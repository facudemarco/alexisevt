from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.models.voucher import Voucher
from app.models.booking import Reserva
from app.models.package import Paquete, PaqueteHotel
from app.models.config import Hotel
from app.schemas.voucher import VoucherUpdate


def get_voucher_by_reserva(db: Session, reserva_id: int) -> Optional[Voucher]:
    return db.query(Voucher).filter(Voucher.reserva_id == reserva_id).first()


def get_voucher_by_id(db: Session, voucher_id: int) -> Optional[Voucher]:
    return db.query(Voucher).filter(Voucher.id == voucher_id).first()


def _resolve_hotel_info(db: Session, reserva: Reserva):
    """Obtiene el hotel y régimen más preciso asignado a la reserva o a su paquete."""
    hotel = None
    hotel_regimen = None

    # 1. Si la reserva tiene hotel_id explícito
    if reserva.hotel_id:
        hotel = db.query(Hotel).filter(Hotel.id == reserva.hotel_id).first()
        if reserva.paquete and reserva.paquete.hotel_detalles:
            det = next((d for d in reserva.paquete.hotel_detalles if d.hotel_id == reserva.hotel_id), None)
            if det and det.regimen:
                hotel_regimen = det.regimen

    # 2. Si no tiene hotel_id en la reserva, buscar en los hoteles asignados al paquete
    if not hotel and reserva.paquete and reserva.paquete.hotel_detalles:
        for det in reserva.paquete.hotel_detalles:
            if det.hotel:
                hotel = det.hotel
                hotel_regimen = det.regimen
                break

    # 3. Régimen fallback
    if not hotel_regimen and reserva.paquete and reserva.paquete.regimen:
        hotel_regimen = reserva.paquete.regimen

    return hotel, hotel_regimen


def _resolve_transporte_info(reserva: Reserva):
    """Determina si incluye transporte y extrae proveedor, servicio y horarios."""
    paquete = reserva.paquete
    if not paquete:
        return True, "A CONFIRMAR OK", "Bus Semicama", ""

    # Determinar si incluye transporte
    incluye_transporte = bool(
        paquete.transporte_incluido
        or paquete.aereo_incluido
        or (paquete.transporte_empresa and paquete.transporte_empresa.strip())
        or (paquete.transportes and len(paquete.transportes) > 0)
        or (paquete.transporte_tipo and paquete.transporte_tipo.strip())
        or paquete.horario_salida
        or True # Por defecto en turismo AlexisEVT los paquetes incluyen transporte
    )

    # Proveedor
    proveedor = ""
    if paquete.aereo_incluido and paquete.aerolinea:
        proveedor = paquete.aerolinea.nombre
    elif paquete.transporte_empresa and paquete.transporte_empresa.strip():
        proveedor = paquete.transporte_empresa
    elif paquete.transportes and len(paquete.transportes) > 0:
        proveedor = paquete.transportes[0].nombre
    else:
        proveedor = "A CONFIRMAR OK"

    # Tipo de servicio
    servicio = "Bus Semicama"
    if paquete.aereo_incluido:
        servicio = paquete.aereo_tipo_servicio or "Vuelo Comercial"
    elif paquete.transporte_tipo and paquete.transporte_tipo.strip():
        servicio = paquete.transporte_tipo

    # Horario
    horario = paquete.horario_salida or paquete.aereo_horario_salida or ""

    return incluye_transporte, proveedor, servicio, horario


def get_or_create_default_voucher(db: Session, reserva_id: int) -> Voucher:
    reserva = (
        db.query(Reserva)
        .options(
            joinedload(Reserva.paquete).joinedload(Paquete.hotel_detalles).joinedload(PaqueteHotel.hotel),
            joinedload(Reserva.paquete).joinedload(Paquete.puntos_ascenso),
            joinedload(Reserva.paquete).joinedload(Paquete.destino),
            joinedload(Reserva.paquete).joinedload(Paquete.transportes),
            joinedload(Reserva.paquete).joinedload(Paquete.aerolinea),
            joinedload(Reserva.hotel),
            joinedload(Reserva.pasajeros),
        )
        .filter(Reserva.id == reserva_id)
        .first()
    )
    if not reserva:
        raise ValueError("Reserva no encontrada")

    hotel, hotel_regimen = _resolve_hotel_info(db, reserva)
    incluye_transporte, proveedor_t, servicio_t, horario_salida = _resolve_transporte_info(reserva)

    paquete = reserva.paquete

    # Punto de ascenso
    lugar_ascenso = ""
    if reserva.pasajeros and reserva.pasajeros[0].punto_ascenso_id:
        from app.models.config import PuntoAscenso
        pt = db.query(PuntoAscenso).filter(PuntoAscenso.id == reserva.pasajeros[0].punto_ascenso_id).first()
        if pt:
            lugar_ascenso = pt.nombre_lugar
    if not lugar_ascenso and paquete and paquete.puntos_ascenso and len(paquete.puntos_ascenso) > 0:
        lugar_ascenso = paquete.puntos_ascenso[0].nombre_lugar

    # Destino y Tramo
    destino_nom = paquete.destino.nombre.upper() if paquete and paquete.destino else "DESTINO"
    tramo = f"BUE / {destino_nom} / BUE"

    fecha_sal = reserva.fecha_salida or (paquete.fecha_salida if paquete else None)
    fecha_reg = reserva.fecha_regreso or (paquete.fecha_regreso if paquete else None)
    noches = reserva.duracion_noches or (paquete.duracion_noches if paquete else 0)

    # Titular y Cant Pax
    titular = reserva.cliente_nombre or (
        f"{reserva.pasajeros[0].apellido}, {reserva.pasajeros[0].nombre}" if reserva.pasajeros else "GRUPO"
    )
    if reserva.es_bloqueo:
        titular = f"{titular.upper()} (BLOQUEO {reserva.pasajeros_adultos + reserva.pasajeros_menores} PAX)"

    cant_pax_txt = f"{reserva.pasajeros_adultos} ADL - {reserva.pasajeros_menores} CHD - 0 INF"

    # Detalle hotelería
    regimen_final = hotel_regimen or "Media Pensión"
    detalle_hab = f"{noches} NOCHES DE ALOJAMIENTO CON REGIMEN {regimen_final.upper()}"

    hotel_nombre_final = hotel.nombre if hotel else "A CONFIRMAR"
    hotel_dir = hotel.direccion if (hotel and getattr(hotel, "direccion", None)) else "-"
    hotel_tel = hotel.telefono if (hotel and getattr(hotel, "telefono", None)) else "-"

    incluye_hoteleria = bool(
        hotel is not None
        or (paquete.alojamiento_incluido if paquete else True)
    )

    existing = get_voucher_by_reserva(db, reserva_id)
    if existing:
        # Si el voucher existía pero tenía hotel en "A CONFIRMAR" y ahora se detectó hotel, actualizarlo
        updated = False
        if existing.hoteleria_hotel_nombre in (None, "", "A CONFIRMAR") and hotel:
            existing.hoteleria_hotel_nombre = hotel.nombre
            existing.hoteleria_direccion = hotel_dir
            existing.hoteleria_telefono = hotel_tel
            existing.hoteleria_regimen = regimen_final
            existing.hoteleria_detalle_habitaciones = detalle_hab
            updated = True

        if not existing.transporte_proveedor or existing.transporte_proveedor == "A CONFIRMAR OK":
            if proveedor_t != "A CONFIRMAR OK":
                existing.transporte_proveedor = proveedor_t
                updated = True

        if not existing.transporte_lugar_ascenso and lugar_ascenso:
            existing.transporte_lugar_ascenso = lugar_ascenso
            updated = True

        if updated:
            db.commit()
            db.refresh(existing)

        return existing

    # Crear nuevo voucher
    voucher_num_t = f"{33000 + reserva.id}"
    voucher_num_h = f"{32000 + reserva.id}"

    voucher = Voucher(
        reserva_id=reserva.id,
        # Transporte
        incluye_transporte=incluye_transporte,
        transporte_numero=voucher_num_t,
        transporte_proveedor=proveedor_t,
        transporte_direccion="-",
        transporte_servicio=servicio_t,
        transporte_tramo=tramo,
        transporte_coordinador="",
        transporte_coordinador_telefono="",
        transporte_lugar_ascenso=lugar_ascenso,
        transporte_horario_salida=horario_salida,
        transporte_fecha_salida=fecha_sal,
        transporte_fecha_regreso=fecha_reg,
        transporte_observaciones="",
        # Hotelería
        incluye_hoteleria=incluye_hoteleria,
        hoteleria_numero=voucher_num_h,
        hoteleria_hotel_nombre=hotel_nombre_final,
        hoteleria_direccion=hotel_dir,
        hoteleria_telefono=hotel_tel,
        hoteleria_noches=noches,
        hoteleria_regimen=regimen_final,
        hoteleria_detalle_habitaciones=detalle_hab,
        hoteleria_fecha_ingreso=fecha_sal,
        hoteleria_fecha_egreso=fecha_reg,
        hoteleria_observaciones="",
        # General
        pasajero_titular=titular,
        cant_pax_detalle=cant_pax_txt,
    )

    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher


def reset_voucher_defaults(db: Session, reserva_id: int) -> Voucher:
    """Regenera los valores automáticos del voucher basados en la reserva actual."""
    existing = get_voucher_by_reserva(db, reserva_id)
    if existing:
        db.delete(existing)
        db.commit()
    return get_or_create_default_voucher(db, reserva_id)


def update_voucher(db: Session, voucher: Voucher, data: VoucherUpdate) -> Voucher:
    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(voucher, field, val)
    db.commit()
    db.refresh(voucher)
    return voucher
