from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AlexisEVT API"
    DATABASE_URL: str = "mysql+pymysql://user:password@db:3306/alexisevt"
    SECRET_KEY: str = "my_super_secret_for_jwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    class Config:
        case_sensitive = True

settings = Settings()
