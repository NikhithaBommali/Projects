from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes import router
from database import Base, engine
from config import APP_NAME

import os
import sys

# ✅ Setup system path for local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# ✅ Create all tables including new Document model
Base.metadata.create_all(bind=engine)

# ✅ Initialize FastAPI app
app = FastAPI(title=APP_NAME)

# ✅ Add CORS middleware (frontend access from localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Mount /uploads for serving uploaded files
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Ensure the directory exists
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ✅ Include all API routes
app.include_router(router, prefix="/api")
