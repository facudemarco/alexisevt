from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import io

from app.api.deps import get_db
from app.api.deps_security import get_current_user, get_current_admin_user
from app.schemas.booking import Reserva, ReservaCreate, ReservaFullUpdate
from app.models.user import User, UserRole
from app.models.notification import Notificacion
from app.crud import crud_booking
from app.core.email import send_email

router = APIRouter()


# ─── helpers ──────────────────────────────────────────────────────────────────

MENSAJES = {
    "Aprobada":   "Tu reserva #{id} fue CONFIRMADA. ¡Buen viaje!",
    "Rechazada":  "Tu reserva #{id} fue RECHAZADA.{motivo}",
    "Pendiente":  "Tu reserva #{id} fue marcada como PENDIENTE nuevamente.",
}

EMAIL_SUBJECTS = {
    "Aprobada":   "✅ Reserva #{id} confirmada — AlexisEVT",
    "Rechazada":  "❌ Reserva #{id} rechazada — AlexisEVT",
    "Pendiente":  "🔄 Reserva #{id} volvió a estado Pendiente — AlexisEVT",
}


def _notify(db: Session, reserva, nuevo_estado: str, motivo: str = ""):
    """Crea notificación en DB y envía email al vendedor de la reserva."""
    motivo_txt = f" Motivo: {motivo}" if motivo else ""
    mensaje = MENSAJES[nuevo_estado].format(id=reserva.id, motivo=motivo_txt)

    notif = Notificacion(
        user_id=reserva.vendedor_id,
        reserva_id=reserva.id,
        tipo=nuevo_estado.lower(),
        mensaje=mensaje,
    )
    db.add(notif)
    db.commit()

    # Email al vendedor
    if reserva.vendedor and reserva.vendedor.email:
        subject = EMAIL_SUBJECTS[nuevo_estado].format(id=reserva.id)
        color = {"Aprobada": "#16a34a", "Rechazada": "#dc2626", "Pendiente": "#ca8a04"}[nuevo_estado]
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <div style="background:{color};padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0;font-size:22px">{subject.replace('#', '&#35;')}</h1>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
            <p style="color:#374151;font-size:16px">{mensaje}</p>
            {"<p style='color:#6b7280;font-size:14px'><strong>Motivo:</strong> " + motivo + "</p>" if motivo else ""}
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
            <p style="color:#9ca3af;font-size:12px">AlexisEVT — Sistema de Reservas</p>
          </div>
        </div>
        """
        send_email(reserva.vendedor.email, subject, html)





# ─── routes ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=Reserva)
def create_reserva(
    reserva_in: ReservaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if reserva_in.paquete_id is None and current_user.rol != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Solo un administrador puede crear reservas sin paquete.")
    auto_approve = current_user.rol == UserRole.ADMIN
    # Admin puede asignar la reserva a un vendedor específico
    effective_vendedor_id = (
        reserva_in.vendedor_id
        if (auto_approve and reserva_in.vendedor_id)
        else current_user.id
    )
    return crud_booking.create_reserva(db=db, reserva=reserva_in, vendedor_id=effective_vendedor_id, auto_approve=auto_approve)


@router.get("/", response_model=List[Reserva])
def read_reservas(
    skip: int = 0,
    limit: int = 200,
    estado: Optional[str] = Query(None),
    destino_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.rol == UserRole.ADMIN:
        return crud_booking.get_todas_reservas(db, skip=skip, limit=limit, estado=estado, destino_id=destino_id)
    else:
        return crud_booking.get_reservas_by_vendedor(db, vendedor_id=current_user.id, skip=skip, limit=limit)

class EstadoUpdate(BaseModel):
    estado: str
    motivo: Optional[str] = None


@router.patch("/{reserva_id}/status", response_model=Reserva)
def update_estado(
    reserva_id: int,
    body: EstadoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    reserva = crud_booking.get_reserva(db, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if body.estado not in ["Pendiente", "Aprobada", "Rechazada"]:
        raise HTTPException(status_code=400, detail="Estado inválido. Use: Pendiente, Aprobada, Rechazada")

    updated = crud_booking.update_reserva_estado(db, reserva_id, body.estado, motivo=body.motivo)

    # Notificar al vendedor
    _notify(db, updated, body.estado, motivo=body.motivo or "")

    return updated


@router.put("/{reserva_id}", response_model=Reserva)
def update_reserva_full(
    reserva_id: int,
    body: ReservaFullUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    reserva = crud_booking.get_reserva(db, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    updated = crud_booking.update_reserva_full(db, reserva_id, body)
    return updated

