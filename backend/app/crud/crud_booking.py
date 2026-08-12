from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc
from typing import Optional
from app.models.booking import Reserva, Pasajero, ReservaStatus
from app.schemas.booking import ReservaCreate, ReservaFullUpdate


def get_reserva(db: Session, reserva_id: int):
    return (
        db.query(Reserva)
        .options(joinedload(Reserva.pasajeros).joinedload(Pasajero.punto_ascenso))
        .filter(Reserva.id == reserva_id)
        .first()
    )


def get_reservas_by_vendedor(db: Session, vendedor_id: int, skip: int = 0, limit: int = 100):
    from app.models.package import Paquete
    return (
        db.query(Reserva)
        .options(joinedload(Reserva.pasajeros).joinedload(Pasajero.punto_ascenso))
        .join(Paquete, Reserva.paquete_id == Paquete.id)
        .filter(Reserva.vendedor_id == vendedor_id)
        .order_by(asc(Paquete.fecha_salida))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_todas_reservas(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    estado: Optional[str] = None,
    destino_id: Optional[int] = None,
):
    from app.models.package import Paquete

    q = (
        db.query(Reserva)
        .options(joinedload(Reserva.pasajeros).joinedload(Pasajero.punto_ascenso))
        .join(Paquete, Reserva.paquete_id == Paquete.id)
    )

    if estado:
        q = q.filter(Reserva.estado_reserva == estado)
    if destino_id:
        q = q.filter(Paquete.destino_id == destino_id)

    q = q.order_by(asc(Paquete.fecha_salida))
    return q.offset(skip).limit(limit).all()


def create_reserva(db: Session, reserva: ReservaCreate, vendedor_id: int, auto_approve: bool = False):
    estado = ReservaStatus.APROBADA if auto_approve else ReservaStatus.PENDIENTE
    db_reserva = Reserva(
        vendedor_id=vendedor_id,
        paquete_id=reserva.paquete_id,
        hotel_id=reserva.hotel_id,
        cliente_nombre=reserva.cliente_nombre,
        cliente_email=reserva.cliente_email,
        cliente_telefono=reserva.cliente_telefono,
        pasajeros_adultos=reserva.pasajeros_adultos,
        pasajeros_menores=reserva.pasajeros_menores,
        precio_total=reserva.precio_total,
        estado_reserva=estado,
        fecha_salida=reserva.fecha_salida,
        fecha_regreso=reserva.fecha_regreso,
        duracion_dias=reserva.duracion_dias,
        duracion_noches=reserva.duracion_noches,
        es_bloqueo=bool(reserva.es_bloqueo),
    )
    db.add(db_reserva)
    db.flush()

    if reserva.pasajeros:
        for p in reserva.pasajeros:
            db_pasajero = Pasajero(
                reserva_id=db_reserva.id,
                nombre=p.nombre,
                apellido=p.apellido,
                dni=p.dni,
                fecha_nacimiento=p.fecha_nacimiento,
                telefono=p.telefono,
                punto_ascenso_id=p.punto_ascenso_id,
            )
            db.add(db_pasajero)

    db.commit()
    return get_reserva(db, db_reserva.id)


def update_reserva_estado(db: Session, reserva_id: int, nuevo_estado: str, motivo: Optional[str] = None):
    reserva = get_reserva(db, reserva_id)
    if reserva:
        reserva.estado_reserva = nuevo_estado
        if motivo is not None:
            reserva.motivo_rechazo = motivo
        db.commit()
        db.refresh(reserva)
    return reserva


def update_reserva_full(db: Session, reserva_id: int, data: ReservaFullUpdate):
    reserva = get_reserva(db, reserva_id)
    if not reserva:
        return None

    if data.paquete_id is not None:
        reserva.paquete_id = data.paquete_id
    if data.hotel_id is not None:
        reserva.hotel_id = data.hotel_id
    if data.vendedor_id is not None:
        reserva.vendedor_id = data.vendedor_id
    if data.cliente_nombre is not None:
        reserva.cliente_nombre = data.cliente_nombre
    if data.cliente_email is not None:
        reserva.cliente_email = data.cliente_email
    if data.cliente_telefono is not None:
        reserva.cliente_telefono = data.cliente_telefono
    if data.pasajeros_adultos is not None:
        reserva.pasajeros_adultos = data.pasajeros_adultos
    if data.pasajeros_menores is not None:
        reserva.pasajeros_menores = data.pasajeros_menores
    if data.precio_total is not None:
        reserva.precio_total = data.precio_total
    if data.fecha_salida is not None:
        reserva.fecha_salida = data.fecha_salida
    if data.fecha_regreso is not None:
        reserva.fecha_regreso = data.fecha_regreso
    if data.duracion_dias is not None:
        reserva.duracion_dias = data.duracion_dias
    if data.duracion_noches is not None:
        reserva.duracion_noches = data.duracion_noches
    if data.es_bloqueo is not None:
        reserva.es_bloqueo = data.es_bloqueo

    if data.pasajeros is not None:
        # Replace all passengers
        for p in reserva.pasajeros:
            db.delete(p)
        db.flush()
        for p in data.pasajeros:
            db_pasajero = Pasajero(
                reserva_id=reserva.id,
                nombre=p.nombre,
                apellido=p.apellido,
                dni=p.dni,
                fecha_nacimiento=p.fecha_nacimiento,
                telefono=p.telefono,
                punto_ascenso_id=p.punto_ascenso_id,
            )
            db.add(db_pasajero)

    db.commit()
    return get_reserva(db, reserva.id)
