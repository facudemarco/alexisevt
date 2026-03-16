from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db
from app.api.deps_security import get_current_admin_user
from app.schemas.user import User, UserCreate
from app.crud import crud_user

router = APIRouter()

@router.post("/", response_model=User)
def create_vendedor(user_in: UserCreate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Solo el Admin puede crear usuarios (Vendedores)."""
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Este email ya está registrado.")
    return crud_user.create_user(db=db, user=user_in)

@router.get("/", response_model=List[User])
def read_vendedores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Solo el Admin puede listar todos los vendedores."""
    return crud_user.get_users(db, skip=skip, limit=limit)
