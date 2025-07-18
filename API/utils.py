# D:\study\Disease-Prediction\API\utils.py

from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional
import numpy as np
import os

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from schemas import PredictionInput

# For text extraction
from PyPDF2 import PdfReader

# ---- PASSWORD UTILS ----
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# ---- JWT UTILS ----
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ---- FEATURE EXTRACTION UTILS ----
def extract_features(payload: PredictionInput) -> np.ndarray:
    """
    Converts input schema to numerical feature array.
    """
    features = [
        int(payload.age),
        1 if payload.gender.lower() == "male" else 0,
        1 if "fever" in payload.symptoms.lower() else 0,
        1 if "cough" in payload.symptoms.lower() else 0,
        int(payload.lifestyle.smoking),
        int(payload.lifestyle.drinking),
        int(payload.lifestyle.exercise),
        int(payload.lifestyle.stress),
        int(payload.vitals.heart_rate or 0),
        float(payload.vitals.temperature or 0),
        int(payload.vitals.weight or 0),
    ]
    return np.array(features).reshape(1, -1)


# ---- DOCUMENT TEXT EXTRACTOR ----
def extract_text_from_file(file_path: str) -> str:
    """
    Extracts text from a supported file type.
    Currently supports: .pdf, .txt
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError("Uploaded file path not found.")

    ext = file_path.lower().split(".")[-1]

    if ext == "pdf":
        reader = PdfReader(file_path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text.strip()

    elif ext == "txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read().strip()

    else:
        raise ValueError("Unsupported file format")
