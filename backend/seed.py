import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, SessionLocal, Base
from app.crud.crud_user import get_user_by_email, create_user
from app.schemas.user import UserCreate
from app.models.user import UserRole
from app.crud import crud_config, crud_package

from app.schemas.config import DestinoCreate, CategoriaCreate
from app.schemas.package import PaqueteCreate
from app.models.config import Destino, Categoria
import datetime

def seed_db():
    # 1. Crear las tablas si no existen (Especial para SQLite Hardcodeado)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Crear Administrador
        admin_email = "admin@admin.com"
        user = get_user_by_email(db, email=admin_email)
        if not user:
            print("Creando usuario administrador...")
            user_in = UserCreate(email=admin_email, password="16582384", nombre="Administrador", rol=UserRole.ADMIN, agencia_nombre="AlexisEVT Central")
            create_user(db, user=user_in)

        # 2. Vendedor Dummy
        vend_email = "vendedor@agencia.com"
        vend = get_user_by_email(db, email=vend_email)
        vend_base = vend
        if not vend:
            print("Creando usuario vendedor...")
            vend_in = UserCreate(email=vend_email, password="password", nombre="Vendedor Test", rol=UserRole.VENDEDOR, agencia_nombre="Agencia Demo")
            vend_base = create_user(db, user=vend_in)

        # 3. Crear Destinos y Categorías
        destinos = ["Brasil", "Argentina", "Miniturismo", "Caribe"]
        categorias = ["Aventura", "Relax", "Familiar", "Express"]
        
        # Validar si ya hay destinos
        existing_dest = crud_config.crud_destino.get_multi(db, model=Destino)
        if len(existing_dest) == 0:
            print("Inyectando Destinos y Categorias Hardcodeadas...")
            db_destinos = {}
            for d in destinos:
               obj = crud_config.crud_destino.create(db, model=Destino, obj_in=DestinoCreate(nombre=d))
               db_destinos[d] = obj.id
               
            db_cats = {}
            for c in categorias:
               obj = crud_config.crud_categoria.create(db, model=Categoria, obj_in=CategoriaCreate(nombre=c))
               db_cats[c] = obj.id

            # Paquetes Hardcodeados Visuales
            print("Inyectando Catálogo de Viajes de Prueba...")
            
            paquetes_dummy = [
                PaqueteCreate(
                    destino_id=db_destinos["Miniturismo"],
                    categoria_id=db_cats["Express"],
                    titulo_subtitulo="Termas de Colón (Express)",
                    fecha_salida=datetime.date.today() + datetime.timedelta(days=15),
                    fecha_regreso=datetime.date.today() + datetime.timedelta(days=18),
                    duracion_dias=4,
                    duracion_noches=3,
                    precio_base=180000,
                    estado=True
                ),
                PaqueteCreate(
                    destino_id=db_destinos["Brasil"],
                    categoria_id=db_cats["Relax"],
                    titulo_subtitulo="Buzios & Rio de Janeiro (Aéreo)",
                    fecha_salida=datetime.date.today() + datetime.timedelta(days=45),
                    fecha_regreso=datetime.date.today() + datetime.timedelta(days=55),
                    duracion_dias=10,
                    duracion_noches=9,
                    precio_base=850000,
                    estado=True
                ),
                PaqueteCreate(
                    destino_id=db_destinos["Argentina"],
                    categoria_id=db_cats["Aventura"],
                    titulo_subtitulo="Glaciar Perito Moreno y Chaltén",
                    fecha_salida=datetime.date.today() + datetime.timedelta(days=30),
                    fecha_regreso=datetime.date.today() + datetime.timedelta(days=37),
                    duracion_dias=7,
                    duracion_noches=6,
                    precio_base=600000,
                    estado=True
                )
            ]
            
            for p in paquetes_dummy:
                crud_package.paquete.create(db, obj_in=p)

            print("Base de Datos Hardcodeada generada con éxito 🎉.")

    except Exception as e:
        print(f"Error en Seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
