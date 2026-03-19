from app.db.session import Base  # noqa: F401 – ensures Base is registered first
from app.models.user import User
from app.models.config import Destino, Categoria, Hotel, Transporte, Servicio, PuntoAscenso
from app.models.package import Paquete, PaqueteHotel, paquete_transporte_table, paquete_servicio_table, paquete_punto_ascenso_table
from app.models.booking import Reserva
from app.models.board import BoardItem
