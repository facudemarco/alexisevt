from pydantic_settings import BaseSettings, SettingsConfigDict
import os

# Ruta al .env en la carpeta backend/ (un nivel arriba de app/)
_ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",        # ignora variables del .env que no estén declaradas aquí
    )

    PROJECT_NAME: str = "AlexisEVT API"
    DATABASE_URL: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'local_dev.db')}"
    SECRET_KEY: str = "my_super_secret_for_jwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días

settings = Settings()

