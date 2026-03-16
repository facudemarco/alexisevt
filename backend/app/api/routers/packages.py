from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db
from app.api.deps_security import get_current_admin_user
from app.schemas.package import Paquete, PaqueteCreate, PaqueteUpdate
from app.crud import crud_package

router = APIRouter()

@router.get("/", response_model=List[Paquete])
def read_paquetes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Público: Lista los paquetes."""
    return crud_package.get_paquetes(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=Paquete)
def read_paquete(id: int, db: Session = Depends(get_db)):
    """Público: Detalle de un paquete."""
    paquete = crud_package.get_paquete(db, paquete_id=id)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return paquete

@router.post("/", response_model=Paquete, dependencies=[Depends(get_current_admin_user)])
def create_paquete(paquete_in: PaqueteCreate, db: Session = Depends(get_db)):
    """Solo Admin: Crea un nuevo paquete con sus relaciones M2M."""
    return crud_package.create_paquete(db=db, paquete=paquete_in)
