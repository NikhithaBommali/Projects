from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import List
from datetime import datetime
from uuid import uuid4
import os
from uuid import UUID
from schemas import (
    UserLogin,
    UserCreate,
    UserOut,
    PredictionInput,
    PredictionOutput,
    ChatRequest,
    ChatHistoryResponse,
)
from utils import verify_password, create_access_token
from database import get_db
from crud import save_prediction, create_user
from models import User, Prediction, Chat, Document, ChatSession
from config import SECRET_KEY, ALGORITHM
from query_handler import get_answer
from model_loader import predict_disease

from document_processor import extract_text_from_file
from embedder import embed_and_store, search_faiss

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ──────────────────────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user

# ──────────────────────────────────────────────────────────────
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "Nikki@1234")

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Admin validation logic
    is_admin = False
    if user.admin_secret:
        if user.admin_secret == ADMIN_SECRET:
            is_admin = True
        else:
            raise HTTPException(status_code=403, detail="Invalid admin secret")

    return create_user(db, user, is_admin=is_admin)
@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    user_in_db = db.query(User).filter(User.email == user.email).first()
    if not user_in_db or not verify_password(user.password, user_in_db.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(data={"sub": user_in_db.email})
    return {
        "token": token,
        "user": {
            "id": user_in_db.id,
            "email": user_in_db.email,
            "first_name": user_in_db.first_name,
            "last_name": user_in_db.last_name,
            "is_admin": user_in_db.is_admin,
        },
    }

# ──────────────────────────────────────────────────────────────
@router.post("/predict", response_model=PredictionOutput)
async def predict_disease_route(
    payload: PredictionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        prediction_result = predict_disease(payload, doc_id=str(current_user.id))

        # ✅ Ensure `prediction_result` is a dict, not just a string
        if isinstance(prediction_result, str):
            prediction_output = {
                "riskLevel": "Medium",
                "confidence": 85.0,
                "conditions": [{
                    "name": prediction_result,
                    "risk": 85.0,
                    "color": "yellow"
                }],
                "recommendations": [
                    "Consult a specialist about the findings.",
                    "Follow up with more diagnostic tests."
                ],
            }
        else:
            prediction_output = prediction_result  # assumed to be dict

        # ✅ Log to DB
        prediction_entry = Prediction(
            name=prediction_output["conditions"][0]["name"][:100],
            result=str(prediction_output),
            user_id=current_user.id,
        )
        db.add(prediction_entry)
        db.commit()
        db.refresh(prediction_entry)

        return prediction_output

    except Exception as e:
        traceback.print_exc()  # Print full error trace to console
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
# ──────────────────────────────────────────────────────────────
@router.get("/dashboard")
def get_dashboard_data(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).all()
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.created_at.desc()).all()

    recent_activities = [
        {"title": "Prediction", "description": p.result, "date": p.created_at.strftime("%d %b %Y")}
        for p in predictions[-3:]
    ] + [
        {"title": "AI Chat", "description": c.query, "date": c.created_at.strftime("%d %b %Y")}
        for c in chats[-2:]
    ]

    return {
        "name": current_user.first_name,
        "prediction_count": len(predictions),
        "health_score": current_user.health_score,
        "chat_count": len(chats),
        "recent_activity": recent_activities,
    }

# ──────────────────────────────────────────────────────────────
@router.post("/chat", response_model=dict)
def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        query = request.query.strip()
        now = datetime.utcnow()

        # 🔍 Get LLM/embedding response
        answer = get_answer(query, doc_id=request.document_id)

        # 🔁 Session management
        session_created = False
        force_new = request.force_new or False

        if force_new:
            new_session = ChatSession(
                id=str(uuid4()),
                title=query[:40],
                user_id=user.id,
                created_at=now
            )
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            session_id = new_session.id
            session_created = True
        else:
            latest_session = (
                db.query(ChatSession)
                .filter(ChatSession.user_id == user.id)
                .order_by(ChatSession.created_at.desc())
                .first()
            )
            if not latest_session or (now - latest_session.created_at).total_seconds() > 3600:
                new_session = ChatSession(
                    id=str(uuid4()),
                    title=query[:40],
                    user_id=user.id,
                    created_at=now
                )
                db.add(new_session)
                db.commit()
                db.refresh(new_session)
                session_id = new_session.id
                session_created = True
            else:
                session_id = latest_session.id

        # 💾 Save chat entry
        chat_entry = Chat(
            query=query,
            response=answer,
            user_id=user.id,
            session_id=session_id,
            created_at=now
        )
        db.add(chat_entry)
        db.commit()
        db.refresh(chat_entry)

        return {
            "id": str(chat_entry.id),
            "response": chat_entry.response,
            "created_at": chat_entry.created_at.isoformat(),
            "session_id": session_id,
            "session_created": session_created
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# ──────────────────────────────────────────────────────────────
@router.get("/chat/sessions")
def list_chat_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return [
        {"id": s.id, "title": s.title, "created_at": s.created_at.strftime("%Y-%m-%d %H:%M")}
        for s in sessions
    ]

@router.get("/chat/history", response_model=List[ChatHistoryResponse])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        chat_history = (
            db.query(Chat)
            .filter(Chat.user_id == current_user.id)
            .order_by(Chat.created_at.asc())
            .all()
        )
        return chat_history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve chat history: {str(e)}")
@router.get("/chat/history/{session_id}", response_model=List[ChatHistoryResponse])
def get_chat_by_session_id(
    session_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    chats = (
        db.query(Chat)
        .filter(Chat.user_id == user.id, Chat.session_id == str(session_id))
        .order_by(Chat.created_at.asc())
        .all()
    )

    if not chats:
        raise HTTPException(status_code=404, detail="No chats found for this session")

    return chats
@router.post("/chat/clear")
def clear_chat_history(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    deleted = db.query(Chat).filter(Chat.user_id == current_user.id).delete()
    db.commit()
    return {"message": f"Deleted {deleted} chat(s) successfully."}

# ──────────────────────────────────────────────────────────────
@router.get("/admin/users", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).all()

@router.get("/admin/chats", response_model=List[ChatHistoryResponse])
def get_all_chats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(Chat).order_by(Chat.created_at.desc()).all()

@router.post("/admin/chats/clear")
def clear_all_chats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    deleted = db.query(Chat).delete()
    db.commit()
    return {"message": f"Deleted {deleted} total chats from all users."}

# ──────────────────────────────────────────────────────────────
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/admin/upload-document")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins only")

    try:
        file_id = uuid4().hex
        file_ext = os.path.splitext(file.filename)[-1].lower()
        filename = f"{file_id}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        doc = Document(
            filename=file.filename,
            content_type=file.content_type,
            file_path=file_path,
            uploaded_by=current_user.id,
            uploaded_at=datetime.utcnow(),
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        text = extract_text_from_file(file_path)
        if not text.strip():
            raise ValueError("No text could be extracted from the document.")
        embed_and_store(text, doc.id)

        return {
            "message": "Document uploaded and embedded successfully.",
            "document_id": doc.id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/documents")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return [
        {"id": str(doc.id), "title": doc.filename}
        for doc in docs
    ]
