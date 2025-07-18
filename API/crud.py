from sqlalchemy.orm import Session
from fastapi import HTTPException
from passlib.context import CryptContext
import os

from models import Prediction, User
from schemas import UserCreate, PredictionDB
from utils import hash_password  # Optional
from dotenv import load_dotenv

load_dotenv()

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --------------------------
# Create a New User (with optional admin access)
# --------------------------
def create_user(db: Session, user: UserCreate, is_admin: bool = False):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        age=user.age,
        gender=user.gender,
        hashed_password=hashed_password,
        is_admin=is_admin  # ✅ Respect admin flag
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --------------------------
# Save Prediction
# --------------------------
def save_prediction(db: Session, data: PredictionDB, user_id: int = None):
    """
    Store prediction results in the database.

    Args:
        db (Session): SQLAlchemy session
        data (PredictionDB): Incoming prediction payload
        user_id (int, optional): Associated user ID
    """

    prediction = Prediction(
        name=data.name,
        result=data.result,
        confidence=data.confidence,
        user_id=user_id
    )

    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction
