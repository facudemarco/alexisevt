from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.core.config import settings
from contextlib import asynccontextmanager
import sys
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # En arranque
    try:
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        import seed
        seed.seed_db()
    except Exception as e:
        print("Error instanciando DB Seed:", e)
    yield
    # Al apagar

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next endpoints
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}
