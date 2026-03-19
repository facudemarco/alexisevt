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
    """Público: Lista los paquetes activos (no borradores)."""
    return crud_package.get_paquetes(db, skip=skip, limit=limit)

@router.get("/by-category/{slug}", response_model=List[Paquete])
def read_paquetes_by_category(slug: str, db: Session = Depends(get_db)):
    """Público: Lista los paquetes activos por slug de categoría."""
    categoria = crud_package.get_categoria_by_slug(db, slug=slug)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return crud_package.get_paquetes_by_category_slug(db, slug=slug)

@router.get("/{id}", response_model=Paquete)
def read_paquete(id: int, db: Session = Depends(get_db)):
    """Público: Detalle de un paquete."""
    paquete = crud_package.get_paquete(db, paquete_id=id)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return paquete


@router.post("/", response_model=Paquete, dependencies=[Depends(get_current_admin_user)])
def create_paquete(paquete_in: PaqueteCreate, db: Session = Depends(get_db)):
    """Solo Admin: Crea un nuevo paquete con sus relaciones."""
    return crud_package.create_paquete(db=db, paquete=paquete_in)


@router.put("/{id}", response_model=Paquete, dependencies=[Depends(get_current_admin_user)])
def update_paquete(id: int, paquete_in: PaqueteUpdate, db: Session = Depends(get_db)):
    """Solo Admin: Actualiza un paquete existente."""
    paquete = crud_package.update_paquete(db=db, paquete_id=id, paquete_in=paquete_in)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return paquete


@router.delete("/{id}", dependencies=[Depends(get_current_admin_user)])
def delete_paquete(id: int, db: Session = Depends(get_db)):
    """Solo Admin: Elimina un paquete."""
    paquete = crud_package.delete_paquete(db=db, paquete_id=id)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return {"ok": True}
