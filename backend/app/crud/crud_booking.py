from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import set_committed_value
from sqlalchemy import asc
from fastapi import HTTPException
from app.models.package import Paquete
from typing import Optional
from app.models.booking import Reserva, Pasajero, HabitacionReserva, ReservaStatus
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
        .outerjoin(Paquete, Reserva.paquete_id == Paquete.id)
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
        .outerjoin(Paquete, Reserva.paquete_id == Paquete.id)
    )

    if estado:
        q = q.filter(Reserva.estado_reserva == estado)
    if destino_id:
        q = q.filter(Paquete.destino_id == destino_id)

    q = q.order_by(asc(Paquete.fecha_salida))
    return q.offset(skip).limit(limit).all()


def require_available_package(db: Session, paquete_id: int):
    # A locking read sees the latest flag and serializes booking creation with
    # updates to the package in MySQL. Hold the lock until the booking commits.
    paquete = db.query(Paquete.id, Paquete.completo).filter(Paquete.id == paquete_id).with_for_update().first()
    if paquete is None:
        raise HTTPException(404, "Paquete no encontrado.")
    if paquete.completo:
        raise HTTPException(409, "Este paquete está completo y no acepta nuevas reservas.")


def resolve_departure_dates(
    paquete: Paquete,
    fecha_salida: Optional[date],
    fecha_regreso: Optional[date] = None,
) -> tuple[Optional[date], Optional[date]]:
    """Validate a fixed-date booking against the package's published departures.

    Daily departures retain their free date selection. Legacy packages without
    departure rows also keep their existing behavior for compatibility.
    """
    if paquete.tipo_salidas == "DIARIAS" or not paquete.fechas_salida:
        return fecha_salida, fecha_regreso

    if fecha_salida is None:
        raise HTTPException(422, "Seleccioná una fecha de salida cargada en el paquete.")

    salida = next(
        (item for item in paquete.fechas_salida if item.fecha_salida == fecha_salida),
        None,
    )
    if salida is None:
        raise HTTPException(422, "La fecha de salida seleccionada no pertenece a este paquete.")

    if salida.fecha_regreso is not None:
        if fecha_regreso is not None and fecha_regreso != salida.fecha_regreso:
            raise HTTPException(422, "La fecha de regreso no coincide con la salida seleccionada.")
        fecha_regreso = salida.fecha_regreso

    return salida.fecha_salida, fecha_regreso


def sync_rooms_and_passengers(db, reserva, habitaciones, pasajeros):
    """Apply a complete room/passenger snapshot inside the caller's transaction."""
    existing_rooms = {room.id: room for room in reserva.habitaciones}
    existing_passengers = {p.id: p for p in reserva.pasajeros}
    keys = {}
    kept_rooms = set(existing_rooms)
    if habitaciones is not None:
        kept_rooms = set()
        for item in habitaciones:
            if item.id is not None:
                if item.id not in existing_rooms or item.id in kept_rooms:
                    raise HTTPException(422, "Habitación duplicada o ajena a la reserva.")
                room = existing_rooms[item.id]
            else:
                room = HabitacionReserva(reserva=reserva)
                db.add(room)
            for field in ("identificacion", "tipo", "capacidad", "observaciones"):
                setattr(room, field, getattr(item, field))
            db.flush()
            kept_rooms.add(room.id)
            if item.clave:
                if item.clave in keys:
                    raise HTTPException(422, "Clave de habitación duplicada.")
                keys[item.clave] = room.id
    seen = set()
    documents = set()
    if pasajeros is not None:
        for item in pasajeros:
            document = (item.dni or "").strip().casefold()
            if document and document in documents:
                raise HTTPException(422, "Hay pasajeros con el mismo documento en la reserva.")
            if document:
                documents.add(document)
            if item.id is not None:
                if item.id not in existing_passengers or item.id in seen:
                    raise HTTPException(422, "Pasajero duplicado o ajeno a la reserva.")
                passenger = existing_passengers[item.id]
                seen.add(item.id)
            else:
                # Older clients do not send IDs. Match an unambiguous document
                # so a routine edit does not replace existing passengers.
                matches = [p for p in existing_passengers.values() if document and
                           (p.dni or "").strip().casefold() == document and p.id not in seen]
                if len(matches) == 1:
                    passenger = matches[0]
                    seen.add(passenger.id)
                else:
                    passenger = Pasajero(reserva=reserva)
                    db.add(passenger)
            room_id = item.habitacion_id if "habitacion_id" in item.model_fields_set else passenger.habitacion_id
            if item.habitacion_clave:
                if ("habitacion_id" in item.model_fields_set and item.habitacion_id is not None) or item.habitacion_clave not in keys:
                    raise HTTPException(422, "Referencia de habitación inválida.")
                room_id = keys[item.habitacion_clave]
            if room_id is not None and room_id not in kept_rooms:
                raise HTTPException(422, "La habitación no pertenece a la reserva.")
            for field in ("nombre", "apellido", "dni", "fecha_nacimiento", "telefono", "punto_ascenso_id"):
                setattr(passenger, field, getattr(item, field))
            passenger.habitacion_id = room_id
        for passenger_id, passenger in existing_passengers.items():
            if passenger_id not in seen:
                db.delete(passenger)
    elif any(p.habitacion_id not in kept_rooms for p in reserva.pasajeros if p.habitacion_id is not None):
        raise HTTPException(422, "Reasigná los pasajeros antes de quitar la habitación.")
    db.flush()
    counts = {}
    # Use a current locking read, not a potentially older REPEATABLE READ
    # snapshot, when validating capacity after concurrent edits.
    assigned = db.query(Pasajero).filter(Pasajero.reserva_id == reserva.id, Pasajero.habitacion_id.isnot(None)).populate_existing().with_for_update().all()
    for passenger in assigned:
        counts[passenger.habitacion_id] = counts.get(passenger.habitacion_id, 0) + 1
    for room_id, count in counts.items():
        room = db.get(HabitacionReserva, room_id)
        if room_id not in kept_rooms or count > room.capacidad:
            raise HTTPException(422, "La habitación no pertenece a la reserva o supera su capacidad.")
    for room_id, room in existing_rooms.items():
        if room_id not in kept_rooms:
            db.delete(room)


def create_reserva(db: Session, reserva: ReservaCreate, vendedor_id: int, auto_approve: bool = False):
    paquete = None
    fecha_salida, fecha_regreso = reserva.fecha_salida, reserva.fecha_regreso
    if reserva.paquete_id is not None:
        require_available_package(db, reserva.paquete_id)
        paquete = db.query(Paquete).filter(Paquete.id == reserva.paquete_id).first()
        fecha_salida, fecha_regreso = resolve_departure_dates(
            paquete, reserva.fecha_salida, reserva.fecha_regreso
        )
    estado = ReservaStatus.APROBADA if auto_approve else ReservaStatus.PENDIENTE
    db_reserva = Reserva(
        vendedor_id=vendedor_id,
        paquete_id=reserva.paquete_id,
        hotel_id=reserva.hotel_id,
        titulo_viaje=reserva.titulo_viaje,
        destino_manual=reserva.destino_manual,
        hotel_manual=reserva.hotel_manual,
        regimen_manual=reserva.regimen_manual,
        transporte_manual=reserva.transporte_manual,
        moneda=reserva.moneda or "ARS",
        notas_viaje=reserva.notas_viaje,
        cliente_nombre=reserva.cliente_nombre,
        cliente_email=reserva.cliente_email,
        cliente_telefono=reserva.cliente_telefono,
        pasajeros_adultos=reserva.pasajeros_adultos,
        pasajeros_menores=reserva.pasajeros_menores,
        precio_total=reserva.precio_total or 0,
        estado_reserva=estado,
        fecha_salida=fecha_salida,
        fecha_regreso=fecha_regreso,
        duracion_dias=reserva.duracion_dias,
        duracion_noches=reserva.duracion_noches,
        es_bloqueo=bool(reserva.es_bloqueo),
    )
    db.add(db_reserva)
    db.flush()

    sync_rooms_and_passengers(db, db_reserva, reserva.habitaciones, reserva.pasajeros)

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
    # Lock the booking and use locking reads for its children as well. On
    # MySQL these see the latest committed values under REPEATABLE READ.
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).populate_existing().with_for_update().first()
    if not reserva:
        return None
    rooms = db.query(HabitacionReserva).filter_by(reserva_id=reserva_id).populate_existing().with_for_update().all()
    passengers = db.query(Pasajero).filter_by(reserva_id=reserva_id).populate_existing().with_for_update().all()
    set_committed_value(reserva, "habitaciones", rooms)
    set_committed_value(reserva, "pasajeros", passengers)

    package_id_sent = "paquete_id" in data.model_fields_set
    if package_id_sent:
        if data.paquete_id is not None and data.paquete_id != reserva.paquete_id:
            require_available_package(db, data.paquete_id)
        reserva.paquete_id = data.paquete_id

    departure_fields_sent = {"fecha_salida", "fecha_regreso"}.intersection(data.model_fields_set)
    if (package_id_sent and data.paquete_id is not None) or (departure_fields_sent and reserva.paquete_id is not None):
        paquete = db.query(Paquete).filter(Paquete.id == reserva.paquete_id).first()
        selected_departure, selected_return = resolve_departure_dates(
            paquete,
            data.fecha_salida if "fecha_salida" in data.model_fields_set else reserva.fecha_salida,
            data.fecha_regreso if "fecha_regreso" in data.model_fields_set else reserva.fecha_regreso,
        )
        reserva.fecha_salida = selected_departure
        reserva.fecha_regreso = selected_return
    elif package_id_sent and data.paquete_id is None:
        # En modo manual, las fechas pasan a ser opcionales y no se validan contra un paquete.
        reserva.fecha_salida = data.fecha_salida if "fecha_salida" in data.model_fields_set else reserva.fecha_salida
        reserva.fecha_regreso = data.fecha_regreso if "fecha_regreso" in data.model_fields_set else reserva.fecha_regreso
    if "hotel_id" in data.model_fields_set:
        reserva.hotel_id = data.hotel_id
    for field in ("titulo_viaje", "destino_manual", "hotel_manual", "regimen_manual", "transporte_manual", "moneda", "notas_viaje"):
        if field in data.model_fields_set:
            setattr(reserva, field, getattr(data, field))
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
    if data.fecha_salida is not None and not departure_fields_sent:
        reserva.fecha_salida = data.fecha_salida
    if data.fecha_regreso is not None and not departure_fields_sent:
        reserva.fecha_regreso = data.fecha_regreso
    if data.duracion_dias is not None:
        reserva.duracion_dias = data.duracion_dias
    if data.duracion_noches is not None:
        reserva.duracion_noches = data.duracion_noches
    if data.es_bloqueo is not None:
        reserva.es_bloqueo = data.es_bloqueo

    sync_rooms_and_passengers(db, reserva, data.habitaciones, data.pasajeros)

    db.commit()
    return get_reserva(db, reserva.id)
