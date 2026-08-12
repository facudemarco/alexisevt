from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.api.deps_security import get_current_user, get_current_admin_user
from app.crud import crud_voucher, crud_booking
from app.schemas.voucher import VoucherResponse, VoucherUpdate
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/by-reserva/{reserva_id}", response_model=VoucherResponse)
def get_voucher_by_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reserva = crud_booking.get_reserva(db, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    # Vendedores solo pueden ver vouchers de sus propias reservas
    if current_user.rol != UserRole.ADMIN and reserva.vendedor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tenés permiso para ver este voucher")

    try:
        voucher = crud_voucher.get_or_create_default_voucher(db, reserva_id)
        return voucher
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{voucher_id}", response_model=VoucherResponse)
def update_voucher(
    voucher_id: int,
    data: VoucherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    voucher = crud_voucher.get_voucher_by_id(db, voucher_id)
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher no encontrado")
    return crud_voucher.update_voucher(db, voucher, data)


@router.post("/by-reserva/{reserva_id}/reset", response_model=VoucherResponse)
def reset_voucher(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    reserva = crud_booking.get_reserva(db, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return crud_voucher.reset_voucher_defaults(db, reserva_id)
