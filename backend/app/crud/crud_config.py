from app.crud.crud_base import get_multi, get, create, remove
from app.models.config import Destino, Categoria, Hotel, Transporte, Servicio, PuntoAscenso
from app.schemas.config import DestinoCreate, CategoriaCreate, HotelCreate, TransporteCreate, ServicioCreate, PuntoAscensoCreate

# Specialized instances for each dictionary table
crud_destino = type("CRUDDestino", (), {"get_multi": get_multi, "get": get, "create": create, "remove": remove})
crud_categoria = type("CRUDCategoria", (), {"get_multi": get_multi, "get": get, "create": create, "remove": remove})
crud_hotel = type("CRUDHotel", (), {"get_multi": get_multi, "get": get, "create": create, "remove": remove})
crud_transporte = type("CRUDTransporte", (), {"get_multi": get_multi, "get": get, "create": create, "remove": remove})
crud_servicio = type("CRUDServicio", (), {"get_multi": get_multi, "get": get, "create": create, "remove": remove})
crud_punto_ascenso = type("CRUDPuntoAscenso", (), {"get_multi": get_multi, "get": get, "create": create, "remove": remove})
