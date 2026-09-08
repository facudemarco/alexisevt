from sqlalchemy import inspect
from app.db.session import engine, Base, SessionLocal
import app.models # noqa: F401
from app.models.config import SiteConfig, Categoria

DEFAULT_CATEGORY_IMAGES = {
    "miniturismo": "/resources/miniturismo.png",
    "argentina": "/resources/argentina.png",
    "brasil": "/resources/brasil.png",
    "otros-internacionales": "/resources/internacionales.png",
    "internacional": "/resources/internacionales.png",
    "elegi-cuando-viajar": "/resources/Individuales.svg",
    "elegi-donde-viajar": "/resources/Individuales.svg",
    "individuales": "/resources/Individuales.svg",
}

DEFAULT_VIDEO_URL = "https://player.vimeo.com/video/1178920147?background=1&autoplay=1&loop=1&muted=1&autopause=0"
DEFAULT_POSTER_URL = "/resources/hero_cartelera.png"

def update_schema_v5():
    inspector = inspect(engine)
    dialect = engine.dialect.name
    print(f"Dialecto de base de datos detectado: {dialect}")

    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)
        print("Tablas verificadas / creadas con Base.metadata.create_all (incluyendo site_config).")

    db = SessionLocal()
    try:
        # 1. Configurar valores por defecto en site_config si no existen
        banner_video = db.query(SiteConfig).filter(SiteConfig.clave == "home_banner_video_url").first()
        if not banner_video:
            db.add(SiteConfig(clave="home_banner_video_url", valor=DEFAULT_VIDEO_URL))
            print("Creado site_config 'home_banner_video_url'.")

        banner_poster = db.query(SiteConfig).filter(SiteConfig.clave == "home_banner_poster_url").first()
        if not banner_poster:
            db.add(SiteConfig(clave="home_banner_poster_url", valor=DEFAULT_POSTER_URL))
            print("Creado site_config 'home_banner_poster_url'.")

        # 2. Sincronizar imágenes por defecto para categorías que tengan imagen_url nulo
        categorias = db.query(Categoria).all()
        for cat in categorias:
            slug = (cat.slug or "").lower().strip()
            nombre = (cat.nombre or "").lower().strip()
            if not cat.imagen_url:
                if slug in DEFAULT_CATEGORY_IMAGES:
                    cat.imagen_url = DEFAULT_CATEGORY_IMAGES[slug]
                    print(f"Asignada imagen por defecto a categoría '{cat.nombre}': {cat.imagen_url}")
                elif nombre in DEFAULT_CATEGORY_IMAGES:
                    cat.imagen_url = DEFAULT_CATEGORY_IMAGES[nombre]
                    print(f"Asignada imagen por defecto a categoría '{cat.nombre}': {cat.imagen_url}")

        db.commit()
        print("Actualización v5 finalizada con éxito.")
    except Exception as e:
        db.rollback()
        print(f"Error en update_db_v5: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_schema_v5()
