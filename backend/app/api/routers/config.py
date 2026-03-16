from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db
from app.api.deps_security import get_current_admin_user
from app.crud import crud_config
from app.schemas import config as schemas_config
from app.models import config as models_config

router = APIRouter()

# Helper macro para generar los endpoints de diccionarios CRUD dinámicamente
def dict_router(c_name: str, schema_base, schema_create, model, crud_module):
    sub_router = APIRouter()
    
    @sub_router.get("/", response_model=List[schema_base])
    def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
        return crud_module.get_multi(db, model=model, skip=skip, limit=limit)
        
    @sub_router.post("/", response_model=schema_base, dependencies=[Depends(get_current_admin_user)])
    def create_item(item_in: schema_create, db: Session = Depends(get_db)):
        return crud_module.create(db=db, model=model, obj_in=item_in)
        
    @sub_router.delete("/{id}", response_model=schema_base, dependencies=[Depends(get_current_admin_user)])
    def delete_item(id: int, db: Session = Depends(get_db)):
        item = crud_module.remove(db=db, model=model, id=id)
        if not item:
            raise HTTPException(status_code=404, detail="Item no encontrado")
        return item
    
    return sub_router

# Inyectando sub-rutas para cada diccionario
router.include_router(dict_router("destinos", schemas_config.Destino, schemas_config.DestinoCreate, models_config.Destino, crud_config.crud_destino), prefix="/destinos")
router.include_router(dict_router("categorias", schemas_config.Categoria, schemas_config.CategoriaCreate, models_config.Categoria, crud_config.crud_categoria), prefix="/categorias")
router.include_router(dict_router("hoteles", schemas_config.Hotel, schemas_config.HotelCreate, models_config.Hotel, crud_config.crud_hotel), prefix="/hoteles")
router.include_router(dict_router("transportes", schemas_config.Transporte, schemas_config.TransporteCreate, models_config.Transporte, crud_config.crud_transporte), prefix="/transportes")
router.include_router(dict_router("servicios", schemas_config.Servicio, schemas_config.ServicioCreate, models_config.Servicio, crud_config.crud_servicio), prefix="/servicios")
router.include_router(dict_router("puntos_ascenso", schemas_config.PuntoAscenso, schemas_config.PuntoAscensoCreate, models_config.PuntoAscenso, crud_config.crud_punto_ascenso), prefix="/puntos_ascenso")
