from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import io
from datetime import date
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import joinedload
from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter
from app.models.booking import Reserva as ReservaModel, ReservaStatus
from app.models.package import Paquete
from app.models.config import Destino

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


@router.get("/export/passengers")
def export_passengers(
    destino_id: int,
    fecha_salida: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    destino = db.query(Destino).filter(Destino.id == destino_id).first()
    if not destino:
        raise HTTPException(404, "Destino no encontrado")
    reservas = (db.query(ReservaModel)
        .outerjoin(Paquete, ReservaModel.paquete_id == Paquete.id)
        .options(joinedload(ReservaModel.pasajeros))
        .filter(ReservaModel.estado_reserva == ReservaStatus.APROBADA)
        .filter(or_(Paquete.destino_id == destino_id,
                    and_(ReservaModel.paquete_id.is_(None),
                         func.lower(func.trim(ReservaModel.destino_manual)) == destino.nombre.strip().lower())))
        .filter(func.coalesce(ReservaModel.fecha_salida, Paquete.fecha_salida) == fecha_salida)
        .order_by(ReservaModel.id).all())
    pasajeros = [(r, p) for r in reservas for p in sorted(r.pasajeros, key=lambda p: p.id)]
    if not pasajeros:
        raise HTTPException(404, "No hay pasajeros cargados en reservas aprobadas para ese destino y fecha.")
    wb = Workbook()
    ws = wb.active
    ws.title = "Lista"
    headers = ["Numero", "BUS", "APELLIDO", "NOMBRES", "DNI/LE/CI", "F. NAC.",
               "TELEFONO", "PAX", "HOTEL", "SERVICIO", "SUBE EN", "FILE", "VENDIO", "OBSERVACIONES"]
    ws.append(headers)
    for idx, (reserva, pasajero) in enumerate(pasajeros, 1):
        paquete = reserva.paquete
        vendedor = reserva.vendedor
        hotel = reserva.hotel.nombre if reserva.hotel else reserva.hotel_manual
        servicio = (paquete.transporte_tipo if paquete else reserva.transporte_manual) or "-"
        punto = pasajero.punto_ascenso.nombre_lugar if pasajero.punto_ascenso else "-"
        nombre_vendedor = (vendedor.nombre_sistema or vendedor.nombre) if vendedor else "-"
        values = [idx, "-", pasajero.apellido, pasajero.nombre, pasajero.dni or "-",
                  pasajero.fecha_nacimiento or "-", pasajero.telefono or "-", "-",
                  hotel or "-", servicio, punto, str(reserva.id), nombre_vendedor, "-"]
        for col, value in enumerate(values, 1):
            cell = ws.cell(idx + 1, col)
            cell.value = value
            if isinstance(value, str):
                cell.data_type = "s"
            if col == 6 and pasajero.fecha_nacimiento:
                cell.number_format = "dd/mm/yyyy"
    widths = [9, 8, 22, 25, 16, 14, 18, 8, 25, 20, 30, 12, 25, 30]
    for col, width in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(col)].width = width
    for row in ws.iter_rows():
        for cell in row:
            cell.font = Font(name="Times New Roman", size=10, bold=cell.row == 1)
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return StreamingResponse(out, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f'attachment; filename="pasajeros-{destino_id}-{fecha_salida}.xlsx"'})


@router.get("/{reserva_id}", response_model=Reserva)
def read_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reserva = crud_booking.get_reserva(db, reserva_id)
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if current_user.rol != UserRole.ADMIN and reserva.vendedor_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tenés permiso para ver esta reserva")
    return reserva


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
    updated = crud_booking.update_reserva_full(db, reserva_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return updated

