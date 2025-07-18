from pydantic import BaseModel, EmailStr, Field
from typing import Literal, List
from datetime import datetime
from typing import Optional
from typing import List, Dict, Any
# -------------------------------
# Prediction-Related Schemas
# -------------------------------

class Lifestyle(BaseModel):
    smoking: bool
    drinking: bool
    exercise: bool
    stress: bool

class Vitals(BaseModel):
    blood_pressure: str
    heart_rate: str
    temperature: str
    weight: str

class PredictionInput(BaseModel):
    age: str
    gender: str
    symptoms: str
    medical_history: str
    lifestyle: Dict[str, bool]
    vitals: Dict[str, str]
class Condition(BaseModel):
    name: str
    risk: float
    color: Literal["green", "yellow", "red"]

class PredictionOutput(BaseModel):
    riskLevel: Literal["Low", "Medium", "High"]
    confidence: float
    conditions: List[Condition]
    recommendations: List[str]

class PredictionDB(BaseModel):
    name: str
    result: str  # Can be JSON or plain text
    confidence: int

    class Config:
        from_attributes = True  # replaces orm_mode in Pydantic v2


# -------------------------------
# User-Related Schemas
# -------------------------------

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    age: int = Field(gt=0)
    gender: Literal["Male", "Female", "Other"]
    password: str
    confirm_password: str
    admin_secret: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    age: int
    gender: str
    is_admin: bool

    class Config:
        from_attributes = True 

# -------------------------------
# Chat-Related Schemas
# -------------------------------

class ChatRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    force_new: Optional[bool] = False

class ChatHistoryResponse(BaseModel):
    id: int
    query: str
    response: str
    created_at: datetime

    class Config:
        orm_mode = True
class ChatSessionCreate(BaseModel):
    title: str = "New Chat"

class ChatSessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime

    class Config:
        orm_mode = True