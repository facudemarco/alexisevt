"""
Seed inicial de la base de datos.
Se ejecuta automáticamente al iniciar el backend (ver main.py lifespan).
Es idempotente: no inserta duplicados si los datos ya existen.
"""

from app.db.session import SessionLocal, engine, Base
from app.models.config import Destino, Categoria, Hotel, Transporte, Servicio, PuntoAscenso
from app.models.package import Paquete, PaqueteHotel
from app.models.user import User
from app.core.security import get_password_hash
from datetime import date


def get_or_create(db, model, defaults=None, **kwargs):
    instance = db.query(model).filter_by(**kwargs).first()
    if instance:
        return instance, False
    params = {**kwargs, **(defaults or {})}
    instance = model(**params)
    db.add(instance)
    return instance, True


def seed_db():
    # Crea tablas si no existen (para entornos fresh)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Categorías ────────────────────────────────────────────────────────
        cat_mini, _ = get_or_create(db, Categoria, nombre="Miniturismo")
        cat_arg, _  = get_or_create(db, Categoria, nombre="Argentina")
        cat_bra, _  = get_or_create(db, Categoria, nombre="Brasil")
        cat_int, _  = get_or_create(db, Categoria, nombre="Internacional")
        db.flush()

        # ── Destinos ──────────────────────────────────────────────────────────
        dest_scl, _ = get_or_create(db, Destino, nombre="San Clemente del Tuyú")
        dest_men, _ = get_or_create(db, Destino, nombre="Mendoza - San Rafael")
        dest_vcp, _ = get_or_create(db, Destino, nombre="Villa Carlos Paz")
        db.flush()

        # ── Hoteles ───────────────────────────────────────────────────────────
        hotel_savoia, created = get_or_create(db, Hotel, nombre="Hotel Savoia")
        if created:
            hotel_savoia.direccion = "Av. San Martín 267, San Clemente del Tuyú, Provincia de Buenos Aires"
            hotel_savoia.descripcion = (
                "Hotel de 3 estrellas ubicado a media cuadra del mar. "
                "Cuenta con habitaciones confortables, pileta y restaurante propio. "
                "Ideal para familias y parejas que buscan descanso y playas tranquilas."
            )
            hotel_savoia.imagenes = []   # las imágenes se cargan desde el admin
        db.flush()

        # ── Transportes ───────────────────────────────────────────────────────
        transp_semi, created = get_or_create(db, Transporte, nombre="A confirmar")
        if created:
            transp_semi.tipo = "Bus Semicama"
            transp_semi.horario_salida_desde = "00:00"
            transp_semi.horario_salida_hasta = "04:30"
            transp_semi.horario_regreso = "10:00"
        db.flush()

        # ── Servicios ─────────────────────────────────────────────────────────
        serv_desayuno, _ = get_or_create(db, Servicio, nombre="Desayuno incluido")
        db.flush()

        # ── Puntos de ascenso ─────────────────────────────────────────────────
        puntos_nombres = [
            "CRUCE VARELA, Terminal Princess",
            "BURZACO, Rotonda Estación de Servicio Axxion",
            "LLAVALLOL, Rotonda Estación de Servicio YPF",
            "LOMAS, Hipólito Irigoyen 9400 esquina Oliden, Estación de Servicio Shell",
            "LANUS, Hipólito Irigoyen y 25 de Mayo Banco Francés",
            "AVELLANEDA, Hipólito Irigoyen 1067 Estación de Servicio YPF",
            "CABA, Terminal Dellepiane",
            "SAN JUSTO, Arturo Illia esq. Monseñor Marcon, Estación de Servicio YPF",
            "MORON, Reyes Católicos 218, Agencia Aveljhon",
            "MERLO, Puente Gnecco Estación de Servicio AXXION",
            "PACHECO, Colectora Panamericana y 197, Parador El Turista",
        ]
        puntos = []
        for nombre in puntos_nombres:
            p, _ = get_or_create(db, PuntoAscenso, nombre=nombre)
            puntos.append(p)
        db.flush()

        # ── Usuario admin ─────────────────────────────────────────────────────
        from app.models.user import UserRole
        admin, created = get_or_create(db, User, email="admin@alexisevt.com")
        if created:
            admin.nombre = "Admin"
            admin.password_hash = get_password_hash("admin123")
            admin.rol = UserRole.ADMIN

        db.flush()

        # ── Paquetes de ejemplo ───────────────────────────────────────────────
        # Solo creamos si no existe ningún paquete aún
        if db.query(Paquete).count() == 0:

            # Paquete 1 – San Clemente con fecha fija
            p1 = Paquete(
                destino_id=dest_scl.id,
                categoria_id=cat_mini.id,
                titulo_subtitulo="Con Termas Marinas",
                fecha_salida=date(2025, 9, 27),
                fecha_regreso=date(2025, 9, 28),
                duracion_dias=2,
                duracion_noches=1,
                precio_base=135000,
                precio_adicional=5000,
                moneda="ARS",
                tipo_salidas="FECHA_ESPECIFICA",
                imagen_url="",
                adicionales=[
                    "Sumar siempre los gastos correspondientes.",
                    "Sumar adicional de bus cama si corresponde al paquete.",
                ],
                sobre_el_destino=(
                    "San Clemente del Tuyú es una ciudad balnearia ubicada al norte "
                    "de la costa atlántica bonaerense. Famosa por sus playas tranquilas, "
                    "el parque marino Mundo Marino y las Termas Marinas que ofrecen "
                    "aguas termales naturales del mar."
                ),
                include_transfer=True,
                include_asistencia_medica=True,
                es_borrador=False,
                estado=True,
            )
            ph1 = PaqueteHotel(hotel_id=hotel_savoia.id, regimen="Media pensión", cantidad_noches=1)
            p1.hotel_detalles.append(ph1)
            p1.transportes.append(transp_semi)
            p1.puntos_ascenso.extend(puntos)
            db.add(p1)

            # Paquete 2 – San Clemente salidas diarias
            p2 = Paquete(
                destino_id=dest_scl.id,
                categoria_id=cat_mini.id,
                titulo_subtitulo="Con Termas Marinas",
                fecha_salida=None,
                fecha_regreso=None,
                duracion_dias=2,
                duracion_noches=1,
                precio_base=135000,
                precio_adicional=5000,
                moneda="ARS",
                tipo_salidas="DIARIAS",
                imagen_url="",
                adicionales=[
                    "Sumar siempre los gastos correspondientes.",
                    "Sumar adicional de bus cama si corresponde al paquete.",
                ],
                sobre_el_destino=(
                    "San Clemente del Tuyú es una ciudad balnearia ubicada al norte "
                    "de la costa atlántica bonaerense. Famosa por sus playas tranquilas, "
                    "el parque marino Mundo Marino y las Termas Marinas."
                ),
                include_transfer=True,
                include_asistencia_medica=True,
                es_borrador=False,
                estado=True,
            )
            ph2 = PaqueteHotel(hotel_id=hotel_savoia.id, regimen="Media pensión", cantidad_noches=1)
            p2.hotel_detalles.append(ph2)
            p2.transportes.append(transp_semi)
            p2.puntos_ascenso.extend(puntos)
            db.add(p2)

            # Paquete 3 – Mendoza Argentina
            p3 = Paquete(
                destino_id=dest_men.id,
                categoria_id=cat_arg.id,
                titulo_subtitulo="Vinos y montañas",
                fecha_salida=date(2025, 6, 6),
                fecha_regreso=date(2025, 6, 8),
                duracion_dias=3,
                duracion_noches=2,
                precio_base=185000,
                precio_adicional=5000,
                moneda="ARS",
                tipo_salidas="FECHA_ESPECIFICA",
                imagen_url="",
                adicionales=["Sumar siempre los gastos correspondientes."],
                sobre_el_destino="Mendoza es la capital del vino argentino, rodeada de la Cordillera de los Andes.",
                include_transfer=True,
                include_asistencia_medica=True,
                es_borrador=False,
                estado=True,
            )
            ph3 = PaqueteHotel(hotel_id=hotel_savoia.id, regimen="Alojamiento y desayuno", cantidad_noches=2)
            p3.hotel_detalles.append(ph3)
            db.add(p3)

        db.commit()
        print("[seed] Base de datos inicializada correctamente.")

    except Exception as e:
        db.rollback()
        print(f"[seed] Error al inicializar la base de datos: {e}")
    finally:
        db.close()
