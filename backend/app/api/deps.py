from typing import Generator
from app.db.session import SessionLocal

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
