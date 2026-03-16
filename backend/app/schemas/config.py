from pydantic import BaseModel

# --- Generic Config Schema ---
class ConfigItemBase(BaseModel):
    nombre: str

class ConfigItemCreate(ConfigItemBase):
    pass

class ConfigItemInDBBase(ConfigItemBase):
    id: int

    class Config:
        from_attributes = True

# Specific Schemas
class Destino(ConfigItemInDBBase): pass
class DestinoCreate(ConfigItemCreate): pass

class Categoria(ConfigItemInDBBase): pass
class CategoriaCreate(ConfigItemCreate): pass

class Hotel(ConfigItemInDBBase): pass
class HotelCreate(ConfigItemCreate): pass

class Transporte(ConfigItemInDBBase): pass
class TransporteCreate(ConfigItemCreate): pass

class Servicio(ConfigItemInDBBase): pass
class ServicioCreate(ConfigItemCreate): pass

class PuntoAscenso(ConfigItemInDBBase): pass
class PuntoAscensoCreate(ConfigItemCreate): pass
