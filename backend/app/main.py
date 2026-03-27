from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api.api import api_router
from app.core.config import settings
from app.core.limiter import limiter
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

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    root_path="/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Alexis/api" # <--- ESTO ES CLAVE
)

# Rate limiting — el handler convierte RateLimitExceeded → HTTP 429
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "../../data/images")
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/uploads/images", StaticFiles(directory=IMAGES_DIR), name="images")

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}
