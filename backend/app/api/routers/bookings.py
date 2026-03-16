from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db
from app.api.deps_security import get_current_user, get_current_admin_user
from app.schemas.booking import Reserva, ReservaCreate
from app.models.user import User, UserRole
from app.crud import crud_booking

router = APIRouter()

@router.post("/", response_model=Reserva)
def create_reserva(reserva_in: ReservaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Solo usuarios autenticados (Vendedores o Admin) pueden crear reservas."""
    return crud_booking.create_reserva(db=db, reserva=reserva_in, vendedor_id=current_user.id)

@router.get("/", response_model=List[Reserva])
def read_reservas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Si es Admin, ve todas. Si es Vendedor, solo ve las suyas."""
    if current_user.rol == UserRole.ADMIN:
        return crud_booking.get_todas_reservas(db, skip=skip, limit=limit)
    else:
        return crud_booking.get_reservas_by_vendedor(db, vendedor_id=current_user.id, skip=skip, limit=limit)

from pydantic import BaseModel
class EstadoUpdate(BaseModel):
    estado: str

@router.patch("/{reserva_id}/status", response_model=Reserva)
def update_estado(reserva_id: int, body: EstadoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Solo administradores pueden cambiar el estado de las reservas (Pendiente, Aprobada, Rechazada)."""
    reserva = crud_booking.get_reserva(db, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    # Validar Enum estricto dictado por la consigna UX
    if body.estado not in ["Pendiente", "Aprobada", "Rechazada"]:
        raise HTTPException(status_code=400, detail="Estado inválido. Use: Pendiente, Aprobada, Rechazada")
        
    return crud_booking.update_reserva_estado(db, reserva_id, body.estado)
