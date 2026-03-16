from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        nombre=user.nombre,
        email=user.email,
        password_hash=hashed_password,
        rol=user.rol,
        agencia_nombre=user.agencia_nombre,
        comision_porcentaje=user.comision_porcentaje
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
