<<<<<<< HEAD
from sqlalchemy.orm import Session, joinedload
from app.models.package import Paquete
from app.models.config import Categoria, Hotel, Transporte, Servicio, PuntoAscenso
from app.schemas.package import PaqueteCreate
=======
from sqlalchemy.orm import Session
from app.models.package import Paquete, PaqueteHotel
from app.schemas.package import PaqueteCreate, PaqueteUpdate
from app.models.config import Transporte, Servicio, PuntoAscenso

>>>>>>> 2ceb188 (Add cards)

def get_paquete(db: Session, paquete_id: int):
    return db.query(Paquete).filter(Paquete.id == paquete_id).first()


def get_paquetes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Paquete).filter(Paquete.estado == True, Paquete.es_borrador == False).offset(skip).limit(limit).all()


def get_paquetes_by_category_slug(db: Session, slug: str):
    """Fetch active packages by category slug, with eager-loaded relationships."""
    return (
        db.query(Paquete)
        .join(Categoria, Paquete.categoria_id == Categoria.id)
        .options(
            joinedload(Paquete.destino),
            joinedload(Paquete.categoria),
            joinedload(Paquete.hoteles),
        )
        .filter(Categoria.slug == slug)
        .filter(Paquete.estado == True)
        .filter(Paquete.deleted_at == None)
        .all()
    )

def get_categoria_by_slug(db: Session, slug: str):
    return db.query(Categoria).filter(Categoria.slug == slug).first()

def create_paquete(db: Session, paquete: PaqueteCreate):
    db_paquete = Paquete(
        destino_id=paquete.destino_id,
        categoria_id=paquete.categoria_id,
        titulo_subtitulo=paquete.titulo_subtitulo,
        fecha_salida=paquete.fecha_salida,
        fecha_regreso=paquete.fecha_regreso,
        duracion_dias=paquete.duracion_dias,
        duracion_noches=paquete.duracion_noches,
        precio_base=paquete.precio_base,
<<<<<<< HEAD
        estado=paquete.estado,
        imagen_url=paquete.imagen_url,
        regimen=paquete.regimen,
        gastos_reserva=paquete.gastos_reserva,
        salidas_diarias=paquete.salidas_diarias,
=======
        precio_adicional=paquete.precio_adicional,
        moneda=paquete.moneda,
        tipo_salidas=paquete.tipo_salidas,
        imagen_url=paquete.imagen_url,
        adicionales=paquete.adicionales,
        sobre_el_destino=paquete.sobre_el_destino,
        include_transfer=paquete.include_transfer,
        include_asistencia_medica=paquete.include_asistencia_medica,
        es_borrador=paquete.es_borrador,
        estado=paquete.estado,
>>>>>>> 2ceb188 (Add cards)
    )

    # Hotel detalles (association object con régimen y noches)
    for hd in paquete.hotel_detalles:
        db_paquete.hotel_detalles.append(
            PaqueteHotel(hotel_id=hd.hotel_id, regimen=hd.regimen, cantidad_noches=hd.cantidad_noches)
        )

    # M2M simples
    db_paquete.transportes = db.query(Transporte).filter(Transporte.id.in_(paquete.transporte_ids)).all()
    db_paquete.servicios = db.query(Servicio).filter(Servicio.id.in_(paquete.servicio_ids)).all()
    db_paquete.puntos_ascenso = db.query(PuntoAscenso).filter(PuntoAscenso.id.in_(paquete.punto_ascenso_ids)).all()

    db.add(db_paquete)
    db.commit()
    db.refresh(db_paquete)
    return db_paquete

<<<<<<< HEAD
=======

def update_paquete(db: Session, paquete_id: int, paquete_in: PaqueteUpdate):
    db_paquete = get_paquete(db, paquete_id)
    if not db_paquete:
        return None

    update_data = paquete_in.model_dump(exclude_unset=True)

    # Handle M2M relationships separately
    hotel_detalles = update_data.pop("hotel_detalles", None)
    transporte_ids = update_data.pop("transporte_ids", None)
    servicio_ids = update_data.pop("servicio_ids", None)
    punto_ascenso_ids = update_data.pop("punto_ascenso_ids", None)

    for field, value in update_data.items():
        setattr(db_paquete, field, value)

    if hotel_detalles is not None:
        db_paquete.hotel_detalles.clear()
        for hd in hotel_detalles:
            db_paquete.hotel_detalles.append(
                PaqueteHotel(hotel_id=hd["hotel_id"], regimen=hd.get("regimen"), cantidad_noches=hd.get("cantidad_noches"))
            )

    if transporte_ids is not None:
        db_paquete.transportes = db.query(Transporte).filter(Transporte.id.in_(transporte_ids)).all()

    if servicio_ids is not None:
        db_paquete.servicios = db.query(Servicio).filter(Servicio.id.in_(servicio_ids)).all()

    if punto_ascenso_ids is not None:
        db_paquete.puntos_ascenso = db.query(PuntoAscenso).filter(PuntoAscenso.id.in_(punto_ascenso_ids)).all()

    db.commit()
    db.refresh(db_paquete)
    return db_paquete


def delete_paquete(db: Session, paquete_id: int):
    db_paquete = get_paquete(db, paquete_id)
    if db_paquete:
        db.delete(db_paquete)
        db.commit()
    return db_paquete
>>>>>>> 2ceb188 (Add cards)
