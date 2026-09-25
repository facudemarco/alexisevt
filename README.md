# Alexis EVT

Sitio de viajes y sistema de gestión para Alexis EVT. El proyecto reúne el catálogo público de paquetes con un panel interno para administrar salidas, reservas, vendedores, vouchers y liquidaciones.

## Qué incluye

- **Sitio público:** inicio, categorías, ficha de paquete, cartelera, información de la agencia, contacto y sección de cuenta.
- **Paquetes turísticos:** destinos, categorías, hoteles y precios asociados, transporte, servicios, puntos de ascenso, opciones aéreas, adicionales, imágenes y fechas de salida.
- **Salidas múltiples:** un paquete de fechas específicas puede publicar varias combinaciones de salida y regreso. La reserva guarda las fechas elegidas; los paquetes con salidas diarias usan una fecha seleccionada en calendario.
- **Reservas:** reservas de pasajeros individuales y bloqueos grupales para completar los pasajeros después. Vendedores crean reservas pendientes y administradores pueden crearlas aprobadas y asignarlas a un vendedor.
- **Gestión comercial:** estados de reserva, avisos por correo y dentro del panel, vouchers, liquidaciones por reserva, conceptos comisionables y pagos parciales.
- **Administración del sitio:** configuración de datos del catálogo, cartelera y video del banner.
- **Archivos:** imágenes subidas al servidor y videos de banner procesados por un worker FFmpeg.

### Reserva desde la web

El visitante selecciona el paquete, una salida publicada cuando corresponda, la cantidad de pasajeros y sus datos. En el sitio público sin sesión, la solicitud se prepara para enviar por WhatsApp a la agencia; no crea por sí sola una reserva en la base de datos. Un vendedor o administrador autenticado puede completar la reserva desde la ficha del paquete, donde se registra en el sistema.

### Reserva desde el panel

El panel permite crear reservas regulares o bloqueos grupales, asignar vendedor y hotel, editar la reserva y cargar pasajeros. En paquetes de fechas específicas con salidas cargadas, se elige una de esas salidas. La API valida que la fecha enviada siga perteneciendo al paquete y guarda su fecha de salida y, cuando está definida, su fecha de regreso.

## Tecnologías

| Parte | Tecnologías |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| API | FastAPI, Pydantic 2, SQLAlchemy 2, Uvicorn |
| Datos | MySQL en producción; SQLite disponible para desarrollo local |
| Autenticación | JWT Bearer, roles `admin` y `vendedor` |
| Archivos de video | FFmpeg/FFprobe y worker persistente |
| Despliegue | Docker Compose detrás de Nginx |

## Estructura

```text
backend/
  app/api/routers/       Rutas FastAPI por módulo
  app/core/              Configuración, autenticación, correo y worker de video
  app/crud/              Acceso a datos y operaciones de negocio
  app/models/            Modelos SQLAlchemy
  app/schemas/           Contratos Pydantic de entrada y salida
  alembic/versions/      Migraciones de base de datos
  tests/                 Pruebas unitarias de backend
frontend/
  src/app/(public)/      Páginas públicas
  src/app/(admin)/       Panel de administración
  src/components/        Componentes de interfaz
  src/lib/api.ts         Cliente de la API y token de sesión
docs/
  adr/                   Decisiones de arquitectura
  nginx/                 Configuración de referencia para Nginx
  deploy-package-completo.md
system_tests/            Pruebas de sistema heredadas
data/                    Directorio local de archivos persistentes
```

## Módulos de la API

La API usa el prefijo `/api/v1`.

| Módulo | Ruta | Uso |
|---|---|---|
| Autenticación | `/auth` | Inicio de sesión y perfil actual |
| Usuarios | `/users` | Vendedores y usuarios del sistema |
| Configuración | `/config` | Destinos, categorías, hoteles, transportes y parámetros del sitio |
| Paquetes | `/packages` | Catálogo, detalle y administración de paquetes |
| Reservas | `/bookings` | Crear, listar, actualizar y cambiar el estado de las reservas |
| Archivos | `/uploads` | Carga autenticada de imágenes |
| Notificaciones | `/notifications` | Avisos del panel |
| Cartelera | `/cartelera` | Publicaciones del sitio |
| Liquidaciones | `/liquidaciones` | Comisiones, conceptos y pagos |
| Vouchers | `/vouchers` | Consulta y edición de vouchers de reserva |

FastAPI publica Swagger UI en `/docs` y ReDoc en `/redoc` cuando el servicio está accesible.

## Modelo funcional principal

- **Paquete:** apunta a destino y categoría; puede tener varias salidas, hoteles con precio/régimen, transportes, servicios y puntos de ascenso.
- **PaqueteFechaSalida:** fila asociada al paquete con una fecha de salida y una fecha de regreso opcional.
- **Reserva:** conserva `paquete_id`, `fecha_salida` y `fecha_regreso`, junto con el estado, cliente, vendedor, precio y cantidades de pasajeros. No referencia por ID la fila de salida del paquete; conserva las fechas como valores.
- **Pasajero:** datos personales y punto de ascenso asociado a una reserva.
- **Liquidación:** una por reserva, con conceptos, porcentaje de comisión y pagos.

Las fechas múltiples se respaldan en la migración Alembic `014`. La migración copia la fecha existente de paquetes específicos a `paquete_fechas_salida` cuando aún no hay una fila para ese paquete.

## Requisitos

- Python 3.10 o compatible con la imagen de backend.
- Node.js 20 y npm.
- MySQL para producción, o SQLite para desarrollo.
- FFmpeg y FFprobe para procesar videos. La imagen Docker del backend los instala.

## Desarrollo local

### Backend

Desde la raíz del repositorio:

```bash
cd backend
python -m venv .venv
```

Activá el entorno virtual y luego ejecutá:

```bash
pip install -r requirements.txt
```

Creá `backend/.env` con una clave JWT local. Sin variables de base de datos, la API usa SQLite en `backend/local_dev.db`.

```dotenv
SECRET_KEY=generar-una-clave-local-larga-y-aleatoria
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000"]
```

Iniciá la API desde `backend/`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

En otra terminal:

```bash
cd frontend
npm ci
```

Creá `frontend/.env.local` con la URL local de la API:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Iniciá Next.js:

```bash
npm run dev
```

Abrí <http://localhost:3000>. La API local queda en <http://localhost:8000/docs>. El navegador se conecta directamente a FastAPI, por eso `ALLOWED_ORIGINS` debe incluir el origen del frontend.

### Primer usuario

Al arrancar, el backend crea las tablas que falten y un usuario administrador inicial definido en `backend/app/seed.py`. **Cambiá o reemplazá esa credencial antes de exponer una instalación fuera de un entorno local.** El seed actual no toma esa contraseña de una variable de entorno.

### Base de datos y migraciones

La configuración prioriza `DATABASE_URL`. Como alternativa, se puede configurar MySQL mediante `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`. No guardes credenciales reales en Git.

Con la base de datos configurada, las migraciones se ejecutan desde `backend/`:

```bash
alembic upgrade head
```

Las migraciones viven en `backend/alembic/versions/`. Para entornos existentes, hacé un backup y verificá la revisión actual antes de aplicar cambios.

## Variables de entorno

| Variable | Servicio | Descripción |
|---|---|---|
| `SECRET_KEY` | Backend | Clave requerida para firmar JWT. Usá un valor aleatorio fuerte en cada entorno. |
| `DATABASE_URL` | Backend | URL SQLAlchemy completa; tiene prioridad sobre las variables `DB_*`. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Backend | Conexión MySQL cuando no se define `DATABASE_URL`. |
| `DEBUG` | Backend | Activa el modo de depuración; dejar desactivado en producción. |
| `ALLOWED_ORIGINS` | Backend | Orígenes permitidos por CORS. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Duración del JWT; el valor por defecto es siete días. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_TLS` | Backend | Configuración de correo para notificaciones. |
| `IMAGES_BASE_URL`, `UPLOAD_DIR`, `SERVE_STATIC_LOCALLY` | Backend | URL pública y directorio de imágenes. |
| `VIDEOS_BASE_URL`, `VIDEOS_DIR`, `FFMPEG_PATH`, `FFPROBE_PATH` | Backend | Publicación y procesamiento del banner de video. |
| `VIDEO_MAX_UPLOAD_MB`, `VIDEO_MAX_DURATION_SECONDS`, `VIDEO_PROCESS_TIMEOUT_SECONDS` | Backend | Límites de recepción y procesamiento de video. |
| `NEXT_PUBLIC_API_URL` | Frontend | URL base de la API que consume el navegador. |

## Docker y despliegue

`docker-compose.yml` define tres servicios: `backend`, `frontend` y `video-worker`. La configuración del repositorio está orientada al VPS actual: publica internamente la API en `127.0.0.1:8011`, Next.js en `127.0.0.1:3011` y usa rutas persistentes `/home/iweb/alexisevt/data/...`. También espera `backend/.env` y `frontend/.env`.

Antes de usar Compose en otro servidor, adaptá las rutas de volúmenes, las variables de entorno, la URL pública del frontend y Nginx. No publiques directamente los puertos de los contenedores si el diseño requiere que Nginx sea el proxy externo. La configuración de referencia está en `docs/nginx/alexisevt.conf`.

El worker de video debe operar con acceso compartido a `VIDEOS_DIR`; el directorio `published/` se sirve públicamente y la cola privada `jobs/` no debe exponerse. Ver `docs/adr/ADR-004-local-banner-video.md` para detalles de procesamiento, límites y operación.

## Pruebas y validación

Desde `backend/`:

```bash
python -m pytest -q
```

Desde `frontend/`:

```bash
npm run lint
npm run build
node --test tests/liquidacion.test.cjs
```

El backend incluye pruebas para las fechas múltiples de paquete, las fechas elegidas en reservas y el worker de video. Las pruebas de sistema antiguas están en `system_tests/` y usan una base SQLite local.

## Decisiones de arquitectura

- `docs/adr/ADR-001-image-storage.md`: almacenamiento de imágenes.
- `docs/adr/ADR-002-nginx-routing-cors-envvars.md`: proxy, CORS y configuración.
- `docs/adr/ADR-003-security-and-optimization.md`: temas históricos de seguridad y optimización; algunas secciones describen código anterior y deben contrastarse con la implementación actual.
- `docs/adr/ADR-004-local-banner-video.md`: videos del banner y worker FFmpeg.

## Aspectos a mejorar

Prioridades sugeridas a partir de la revisión del código actual:

1. **Credencial inicial del administrador:** `backend/app/seed.py` contiene una contraseña fija para el usuario inicial. Hacerla configurable, forzar cambio inicial y evitar la creación de una contraseña conocida en producción.
2. **Sesión del navegador:** el frontend lee el JWT desde una cookie JavaScript (`js-cookie`). Migrar a cookies `HttpOnly`, `Secure` y `SameSite` reduce el impacto de una vulnerabilidad XSS.
3. **Integridad de la salida elegida:** la reserva persiste las fechas, pero no el ID de `PaqueteFechaSalida`. Una referencia por ID o una copia inmutable de los datos de salida permitiría auditar qué salida se vendió aunque el paquete se edite después.
4. **Schema y migraciones:** el arranque ejecuta `Base.metadata.create_all` además de existir Alembic. Dejar que las migraciones sean la única fuente de cambios de esquema ayuda a mantener instalaciones consistentes y evita divergencias entre ambientes.
5. **Disponibilidad por salida:** el indicador `completo` aplica al paquete entero. Si cada fecha tiene cupos distintos, modelar capacidad y reservas por salida, y hacer la asignación atómica en base de datos.
6. **Escalado del rate limiting:** los límites actuales usan almacenamiento en memoria. Cambiar a almacenamiento compartido como Redis antes de levantar varios procesos o instancias, y configurar proxies confiables en vez de confiar en encabezados IP arbitrarios.
7. **Archivos y procesos pesados:** limitar tamaño de imágenes desde la API (incluyendo lectura en streaming), validar contenido real además del MIME y monitorizar el espacio usado por versiones de video y la cola de trabajos.
8. **Pruebas de extremo a extremo:** agregar recorridos que prueben selección y persistencia de salidas en web, panel, edición, voucher y liquidación con MySQL, incluyendo cambios del paquete después de crear reservas.
9. **Observabilidad y operación:** incorporar logs estructurados, IDs de correlación, métricas, alertas, política de backups/restauración verificada y rotación de secretos.
10. **Documentación de despliegue:** convertir la configuración ligada al VPS en valores parametrizables, documentar rollback de migraciones/despliegue y revisar la documentación histórica ADR-003 contra el estado actual.

## Documentación adicional

- `PROJECT_OVERVIEW.md`: resumen de arquitectura para colaboradores y herramientas de desarrollo.
- `docs/deploy-package-completo.md`: operación del cambio de paquete completo.
- `docs/adr/`: decisiones y procedimientos técnicos.
