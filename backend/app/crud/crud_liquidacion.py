from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from app.models.liquidacion import Liquidacion, LiquidacionItem, Pago
from app.schemas.liquidacion import LiquidacionCreate, LiquidacionUpdate, PagoCreate, LiquidacionResponse, ReservaResumen


def _load_liq(db: Session, liq: Liquidacion) -> LiquidacionResponse:
    """Build LiquidacionResponse with reserva_resumen populated."""
    reserva = liq.reserva
    resumen = None
    if reserva:
        paquete = reserva.paquete
        resumen = ReservaResumen(
            id=reserva.id,
            cliente_nombre=reserva.cliente_nombre,
            precio_total=reserva.precio_total,
            paquete_id=reserva.paquete_id,
            paquete_titulo=paquete.titulo_subtitulo if paquete else reserva.titulo_viaje,
            destino_nombre=(paquete.destino.nombre if (paquete and paquete.destino) else reserva.destino_manual),
            fecha_salida=paquete.fecha_salida if paquete else reserva.fecha_salida,
        )
    return LiquidacionResponse(
        id=liq.id,
        reserva_id=liq.reserva_id,
        fecha=liq.fecha,
        comision_porcentaje=liq.comision_porcentaje,
        notas=liq.notas,
        created_at=liq.created_at,
        items=liq.items,
        pagos=liq.pagos,
        reserva_resumen=resumen,
    )


def _query(db: Session):
    return (
        db.query(Liquidacion)
        .options(
            joinedload(Liquidacion.items),
            joinedload(Liquidacion.pagos),
            joinedload(Liquidacion.reserva),
        )
    )


def get_liquidacion(db: Session, liquidacion_id: int) -> Optional[Liquidacion]:
    return _query(db).filter(Liquidacion.id == liquidacion_id).first()


def get_liquidacion_by_reserva(db: Session, reserva_id: int) -> Optional[Liquidacion]:
    return _query(db).filter(Liquidacion.reserva_id == reserva_id).first()


def get_all_liquidaciones(db: Session, skip: int = 0, limit: int = 200) -> List[LiquidacionResponse]:
    liqs = _query(db).order_by(Liquidacion.id.desc()).offset(skip).limit(limit).all()
    return [_load_liq(db, liq) for liq in liqs]


def create_liquidacion(db: Session, data: LiquidacionCreate) -> LiquidacionResponse:
    liq = Liquidacion(
        reserva_id=data.reserva_id,
        fecha=data.fecha,
        comision_porcentaje=data.comision_porcentaje,
        notas=data.notas,
    )
    db.add(liq)
    db.flush()

    for idx, item_data in enumerate(data.items, start=1):
        item = LiquidacionItem(
            liquidacion_id=liq.id,
            orden=item_data.orden if item_data.orden else idx,
            descripcion=item_data.descripcion,
            precio=item_data.precio,
            cant_pax=item_data.cant_pax,
            aplica_comision=item_data.aplica_comision,
        )
        db.add(item)

    db.commit()
    db.refresh(liq)
    liq = get_liquidacion(db, liq.id)
    return _load_liq(db, liq)


def update_liquidacion(db: Session, liq: Liquidacion, data: LiquidacionUpdate) -> LiquidacionResponse:
    if data.fecha is not None:
        liq.fecha = data.fecha
    if data.comision_porcentaje is not None:
        liq.comision_porcentaje = data.comision_porcentaje
    if data.notas is not None:
        liq.notas = data.notas

    if data.items is not None:
        for item in list(liq.items):
            db.delete(item)
        db.flush()
        for idx, item_data in enumerate(data.items, start=1):
            item = LiquidacionItem(
                liquidacion_id=liq.id,
                orden=item_data.orden if item_data.orden else idx,
                descripcion=item_data.descripcion,
                precio=item_data.precio,
                cant_pax=item_data.cant_pax,
                aplica_comision=item_data.aplica_comision,
            )
            db.add(item)

    db.commit()
    db.refresh(liq)
    liq = get_liquidacion(db, liq.id)
    return _load_liq(db, liq)


def add_pago(db: Session, liquidacion_id: int, data: PagoCreate) -> Optional[Pago]:
    liq = db.query(Liquidacion).filter(Liquidacion.id == liquidacion_id).first()
    if not liq:
        return None
    pago = Pago(
        liquidacion_id=liquidacion_id,
        fecha=data.fecha,
        monto=data.monto,
        descripcion=data.descripcion,
    )
    db.add(pago)
    db.commit()
    db.refresh(pago)
    return pago


def delete_pago(db: Session, liquidacion_id: int, pago_id: int) -> bool:
    pago = db.query(Pago).filter(Pago.id == pago_id, Pago.liquidacion_id == liquidacion_id).first()
    if not pago:
        return False
    db.delete(pago)
    db.commit()
    return True


def delete_liquidacion(db: Session, liq: Liquidacion) -> None:
    db.delete(liq)
    db.commit()
