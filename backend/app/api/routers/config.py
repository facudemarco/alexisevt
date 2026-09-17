import uuid
import shutil
import time
from threading import Lock
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app.api.deps import get_db
from app.api.deps_security import get_current_admin_user
from app.core.config import settings
from app.core.banner_video import folders, read_job, save_job
from app.crud import crud_config
from app.crud.crud_base import update as crud_update
from app.schemas import config as schemas_config
from app.models import config as models_config

router = APIRouter()
upload_lock = Lock()

# Helper macro para generar los endpoints de diccionarios CRUD dinámicamente
def dict_router(c_name: str, schema_base, schema_create, model, crud_module, schema_update=None):
    sub_router = APIRouter()

    @sub_router.get("/", response_model=List[schema_base])
    def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
        return crud_module.get_multi(db, model=model, skip=skip, limit=limit)

    @sub_router.post("/", response_model=schema_base, dependencies=[Depends(get_current_admin_user)])
    def create_item(item_in: schema_create, db: Session = Depends(get_db)):
        return crud_module.create(db=db, model=model, obj_in=item_in)

    if schema_update:
        @sub_router.put("/{id}", response_model=schema_base, dependencies=[Depends(get_current_admin_user)])
        def update_item(id: int, item_in: schema_update, db: Session = Depends(get_db)):
            item = crud_update(db=db, model=model, id=id, obj_in=item_in)
            if not item:
                raise HTTPException(status_code=404, detail="Item no encontrado")
            return item

    @sub_router.delete("/{id}", response_model=schema_base, dependencies=[Depends(get_current_admin_user)])
    def delete_item(id: int, db: Session = Depends(get_db)):
        try:
            item = crud_module.remove(db=db, model=model, id=id)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail=f"No se puede eliminar '{c_name}' porque está siendo utilizado en paquetes u otros registros. Desasígnelo primero."
            )
        if not item:
            raise HTTPException(status_code=404, detail="Item no encontrado")
        return item

    return sub_router

# Inyectando sub-rutas para cada diccionario
router.include_router(dict_router("destinos", schemas_config.Destino, schemas_config.DestinoCreate, models_config.Destino, crud_config.crud_destino, schema_update=schemas_config.DestinoUpdate), prefix="/destinos")
router.include_router(dict_router("categorias", schemas_config.Categoria, schemas_config.CategoriaCreate, models_config.Categoria, crud_config.crud_categoria, schema_update=schemas_config.CategoriaUpdate), prefix="/categorias")
router.include_router(dict_router("hoteles", schemas_config.Hotel, schemas_config.HotelCreate, models_config.Hotel, crud_config.crud_hotel, schema_update=schemas_config.HotelUpdate), prefix="/hoteles")
router.include_router(dict_router("transportes", schemas_config.Transporte, schemas_config.TransporteCreate, models_config.Transporte, crud_config.crud_transporte, schema_update=schemas_config.TransporteUpdate), prefix="/transportes")
router.include_router(dict_router("servicios", schemas_config.Servicio, schemas_config.ServicioCreate, models_config.Servicio, crud_config.crud_servicio), prefix="/servicios")
router.include_router(dict_router("puntos_ascenso", schemas_config.PuntoAscenso, schemas_config.PuntoAscensoCreate, models_config.PuntoAscenso, crud_config.crud_punto_ascenso, schema_update=schemas_config.PuntoAscensoUpdate), prefix="/puntos_ascenso")
router.include_router(dict_router("aerolineas", schemas_config.Aerolinea, schemas_config.AerolineaCreate, models_config.Aerolinea, crud_config.crud_aerolinea), prefix="/aerolineas")


# ── Configuración de Banner Home y videos locales ─────────────────────────────

DEFAULT_VIDEO_URL = "https://player.vimeo.com/video/1178920147?background=1&autoplay=1&loop=1&muted=1&autopause=0"
DEFAULT_POSTER_URL = "/resources/hero_cartelera.png"


def get_site_config(db: Session, key: str, default: str = "") -> str:
    item = db.query(models_config.SiteConfig).filter(models_config.SiteConfig.clave == key).first()
    return item.valor if item and item.valor is not None else default


@router.get("/home-banner", response_model=schemas_config.HomeBannerConfig)
def get_home_banner(db: Session = Depends(get_db)):
    return schemas_config.HomeBannerConfig(
        video_url=get_site_config(db, "home_banner_video_url", DEFAULT_VIDEO_URL),
        mobile_video_url=get_site_config(db, "home_banner_mobile_video_url", ""),
        poster_url=get_site_config(db, "home_banner_poster_url", DEFAULT_POSTER_URL),
    )


@router.get("/home-banner/upload-status", dependencies=[Depends(get_current_admin_user)])
def banner_upload_status():
    jobs, _ = folders()
    items = [read_job(path) for path in jobs.glob("*.json")]
    latest = max(items, key=lambda job: job["created_at"], default=None)
    return {
        "job": latest,
        "max_size_mb": settings.VIDEO_MAX_UPLOAD_MB,
        "max_duration_seconds": settings.VIDEO_MAX_DURATION_SECONDS,
    }


@router.post("/home-banner/upload-video", status_code=202, dependencies=[Depends(get_current_admin_user)])
def upload_home_banner_video(file: UploadFile = File(...)):
    """Stream to private storage, then enqueue. A separate worker publishes the result."""
    jobs, _ = folders()
    if not upload_lock.acquire(blocking=False):
        file.file.close()
        raise HTTPException(409, "Ya se está recibiendo otro video. Intentá nuevamente en unos momentos.")
    job_id = uuid.uuid4().hex
    source = jobs / f"{job_id}.source"
    try:
        if Path(file.filename or "").suffix.lower() not in {".mp4", ".mov", ".webm", ".m4v"}:
            raise HTTPException(400, "Seleccioná un archivo MP4, MOV, WebM o M4V.")
        if any(read_job(path)["status"] in ("queued", "processing") for path in jobs.glob("*.json")):
            raise HTTPException(409, "Ya hay un video en preparación. Esperá a que termine.")
        limit = settings.VIDEO_MAX_UPLOAD_MB * 1024 * 1024
        required_space = limit * 2 + int(settings.VIDEO_MAX_DURATION_SECONDS * 9_000_000 / 8 * 1.2)
        if shutil.disk_usage(jobs).free < required_space:
            raise HTTPException(507, "No hay suficiente espacio disponible para procesar el video.")
        size = 0
        with source.open("xb") as target:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > limit:
                    raise HTTPException(413, f"El archivo supera {settings.VIDEO_MAX_UPLOAD_MB} MB.")
                target.write(chunk)
        if not size:
            raise HTTPException(400, "El archivo está vacío.")
        job = {"id": job_id, "created_at": time.time(), "status": "queued", "message": "Video recibido. Esperando procesamiento…"}
        save_job(job)
        return job
    except Exception:
        source.unlink(missing_ok=True)
        raise
    finally:
        file.file.close()
        upload_lock.release()
