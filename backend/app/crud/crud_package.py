from sqlalchemy.orm import Session
from app.models.package import Paquete
from app.schemas.package import PaqueteCreate
from app.models.config import Hotel, Transporte, Servicio, PuntoAscenso

def get_paquete(db: Session, paquete_id: int):
    return db.query(Paquete).filter(Paquete.id == paquete_id).first()

def get_paquetes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Paquete).offset(skip).limit(limit).all()

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
        estado=paquete.estado
    )
    
    # Handle relationships M2M manually before commit
    db_paquete.hoteles = db.query(Hotel).filter(Hotel.id.in_(paquete.hotel_ids)).all()
    db_paquete.transportes = db.query(Transporte).filter(Transporte.id.in_(paquete.transporte_ids)).all()
    db_paquete.servicios = db.query(Servicio).filter(Servicio.id.in_(paquete.servicio_ids)).all()
    db_paquete.puntos_ascenso = db.query(PuntoAscenso).filter(PuntoAscenso.id.in_(paquete.punto_ascenso_ids)).all()
    
    db.add(db_paquete)
    db.commit()
    db.refresh(db_paquete)
    return db_paquete
