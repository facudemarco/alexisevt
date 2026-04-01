from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

# Ruta al .env en la carpeta backend/ (un nivel arriba de app/)
_ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")

_DEFAULT_SQLITE = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'local_dev.db')}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",        # ignora variables del .env que no estén declaradas aquí
    )

    PROJECT_NAME: str = "AlexisEVT API"
    DEBUG: bool = False

    # ── Base de datos ────────────────────────────────────────────────────────
    # Opción A (dev/simple): DATABASE_URL completa en el .env
    # Opción B (prod/Hostinger): variables individuales DB_* → se construye la URL
    DATABASE_URL: Optional[str] = None
    DB_HOST:      Optional[str] = None
    DB_PORT:      int           = 3306
    DB_USER:      Optional[str] = None
    DB_PASSWORD:  Optional[str] = None
    DB_NAME:      Optional[str] = None

    @property
    def db_url(self) -> str:
        """Devuelve la URL de conexión. Prioriza DATABASE_URL; si no, construye desde DB_*."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.DB_HOST and self.DB_USER and self.DB_PASSWORD and self.DB_NAME:
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
                f"?charset=utf8mb4"
            )
        return _DEFAULT_SQLITE

    # ── JWT ──────────────────────────────────────────────────────────────────
    # Sin default: si no está en .env la app falla al arrancar con un error claro
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días

    # ── Imágenes (ADR-001) ───────────────────────────────────────────────────
    IMAGES_BASE_URL: str = "http://localhost:8000/uploads/images"
    # config.py está en backend/app/core/ → subir 4 niveles llega a la raíz del proyecto
    # Esto alinea con el StaticFiles de main.py y con el alias de nginx /media/images/ → data/images/
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "data", "images"
    )
    SERVE_STATIC_LOCALLY: bool = True

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3011",
        "https://alexis.iwebtecnology.com"
    ]

    # ── SMTP ─────────────────────────────────────────────────────────────────
    SMTP_HOST:     str  = ""
    SMTP_PORT:     int  = 587
    SMTP_USER:     str  = ""
    SMTP_PASSWORD: str  = ""
    SMTP_FROM:     str  = "noreply@alexisevt.com"
    SMTP_TLS:      bool = True


settings = Settings()
