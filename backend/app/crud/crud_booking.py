from sqlalchemy.orm import Session
from app.models.booking import Reserva
from app.schemas.booking import ReservaCreate

def get_reserva(db: Session, reserva_id: int):
    return db.query(Reserva).filter(Reserva.id == reserva_id).first()

def get_reservas_by_vendedor(db: Session, vendedor_id: int, skip: int = 0, limit: int = 100):
    return db.query(Reserva).filter(Reserva.vendedor_id == vendedor_id).offset(skip).limit(limit).all()

def get_todas_reservas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Reserva).offset(skip).limit(limit).all()

def create_reserva(db: Session, reserva: ReservaCreate, vendedor_id: int):
    db_reserva = Reserva(
        vendedor_id=vendedor_id,
        paquete_id=reserva.paquete_id,
        pasajeros_adultos=reserva.pasajeros_adultos,
        pasajeros_menores=reserva.pasajeros_menores,
        precio_total=reserva.precio_total
    )
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    return db_reserva

def update_reserva_estado(db: Session, reserva_id: int, nuevo_estado: str):
    reserva = get_reserva(db, reserva_id)
    if reserva:
        reserva.estado_reserva = nuevo_estado
        db.commit()
        db.refresh(reserva)
    return reserva
