# Alexis EVT - Project Overview (AI-Friendly)

**Tipo:** Sistema de gestion para agencia de viajes (EVT)
**Stack:** Next.js 14 (App Router, TypeScript) + FastAPI (Python) + SQLite (via SQLAlchemy)
**Deployment:** Docker Compose con dos servicios: backend y frontend

---

## Arquitectura General

```
alexisevt/
|-- backend/           # FastAPI REST API (Python)
|   |-- app/
|   |   |-- api/       # Routers FastAPI
|   |   |   |-- routers/  # auth, bookings, board, config, liquidaciones, notifications, packages, uploads, users, vouchers
|   |   |-- core/      # Settings, security, limiter
|   |   |-- crud/      # Capa de acceso a datos (SQLAlchemy ORM)
|   |   |-- db/        # session.py (Base + engine SQLite)
|   |   |-- models/    # SQLAlchemy ORM models
|   |   |-- schemas/   # Pydantic v2 schemas
|   |   |-- main.py    # FastAPI app entry point
|   |-- alembic/       # DB migrations
|-- frontend/          # Next.js 14 App Router (TypeScript)
|   |-- src/
|   |   |-- app/
|   |   |   |-- (admin)/admin/  # Panel admin (protegido)
|   |   |   |   |-- bookings/   # Gestion de reservas
|   |   |   |   |-- cartelera/  # Cartelera/board
|   |   |   |   |-- config/     # Parametros del sistema
|   |   |   |   |-- liquidaciones/ # Liquidaciones de comisiones
|   |   |   |   |-- packages/   # ABM de paquetes turisticos
|   |   |   |   |-- users/      # Gestion de usuarios
|   |   |   |-- (public)/       # Paginas publicas
|   |   |   |-- next-api/       # Route Handlers de Next.js
|   |   |-- components/
|   |   |   |-- admin/          # PackageForm.tsx, NotificationBell.tsx
|   |   |   |-- home/           # Componentes del home publico
|   |   |   |-- packages/       # Componentes de paquetes publicos
|   |   |-- lib/
|   |   |   |-- api.ts          # fetchApi() helper con Bearer token
|   |   |   |-- utils.ts        # cn() y helpers
|   |   |-- types/              # TypeScript types
|-- data/images/       # Imagenes subidas (montadas como static)
```

---

## Modelos de Datos Principales

### Paquete (tabla: paquetes)
- Campos clave: destino_id, categoria_id, titulo_subtitulo, fecha_salida (Date), fecha_regreso (Date), tipo_salidas (DIARIAS | FECHA_ESPECIFICA), precio_base, salidas_diarias (Bool), periodo, adicionales_json (JSON)
- Relaciones: destino, categoria, hotel_detalles (PaqueteHotel M2M con atributos), transportes, servicios, puntos_ascenso, aereo_puntos_ascenso, reservas
- IMPORTANTE: El modelo tiene UN solo fecha_salida y UN solo fecha_regreso. Para multiples fechas de salida no existe soporte actualmente.

### Reserva (tabla: reservas)
- Campos clave: vendedor_id, paquete_id, cliente_nombre, precio_total, fecha_salida, estado_reserva (Pendiente/Aprobada/Rechazada), pasajeros_adultos, pasajeros_menores
- Relaciones: paquete, vendedor, hotel, pasajeros, liquidacion (1-to-1), voucher (1-to-1)

### Liquidacion (tabla: liquidaciones)
- Campos clave: reserva_id (unique FK), fecha, comision_porcentaje (Float, default 15.0), notas
- Relaciones: reserva, items (LiquidacionItem), pagos (Pago)
- Computed fields (Pydantic schema): subtotal, base_comision, comision_monto, total_pagos, saldo

### LiquidacionItem (tabla: liquidacion_items)
- Campos: descripcion, precio (DECIMAL 12,2), cant_pax, aplica_comision (Bool)
- aplica_comision=False excluye el item del calculo de comision

### Pago (tabla: pagos)
- Campos: liquidacion_id, fecha, monto (DECIMAL 12,2), descripcion

### Configuracion (tablas independientes)
- Destino, Categoria, Hotel, Transporte, Servicio, PuntoAscenso, Aerolinea

---

## Flujo de Datos - Liquidaciones

Reserva (Aprobada) -> Nueva Liquidacion
  comision_porcentaje (default 15%, editable en la creacion y edicion)
  items[] generados automaticamente desde paquete.precio_base, precio_adicional, gastos_reserva
  pagos[] se agregan manualmente post-creacion

Calculo (computed_fields en el schema Pydantic):
  subtotal = Sum(item.precio * item.cant_pax)
  base_comision = Sum(item.precio * item.cant_pax WHERE aplica_comision=True)
  comision_monto = base_comision * comision_porcentaje / 100
  saldo = subtotal - comision_monto - total_pagos

---

## Flujo de Datos - Paquetes

FECHA_ESPECIFICA -> fecha_salida (Date), fecha_regreso (Date)  [actualmente una sola fecha]
DIARIAS         -> salidas_diarias=True, periodo (texto libre)

El PackageForm maneja toda la logica de creacion/edicion en un solo componente grande (45KB).

---

## API Endpoints Relevantes

| Modulo         | Metodo | Path                               | Descripcion                           |
|----------------|--------|------------------------------------|---------------------------------------|
| Packages       | GET    | /api/v1/packages/                  | Lista paquetes activos                |
| Packages       | POST   | /api/v1/packages/                  | Crea paquete (admin)                  |
| Packages       | PUT    | /api/v1/packages/{id}              | Actualiza paquete (admin)             |
| Liquidaciones  | GET    | /api/v1/liquidaciones/             | Lista liquidaciones                   |
| Liquidaciones  | POST   | /api/v1/liquidaciones/             | Crea liquidacion                      |
| Liquidaciones  | PUT    | /api/v1/liquidaciones/{id}         | Actualiza liquidacion (items+comision)|
| Liquidaciones  | POST   | /api/v1/liquidaciones/{id}/pagos   | Agrega pago                           |
| Bookings       | GET    | /api/v1/bookings/                  | Lista reservas                        |

---

## Autenticacion

- JWT Bearer token
- get_current_user = cualquier usuario autenticado
- get_current_admin_user = solo administradores
- Frontend: fetchApi() en src/lib/api.ts adjunta el token automaticamente desde localStorage

---

## Convenciones de Codigo

- Backend: FastAPI, Pydantic v2, SQLAlchemy ORM, nombres de dominio en espanol
- Frontend: Next.js App Router, TypeScript, Tailwind CSS, fetchApi() para todas las llamadas
- Color primario: #1D5D8C (azul corporativo)
- DB: SQLite en desarrollo (test.db), configuracion por .env
- Todos los endpoints que modifican datos requieren autenticacion como admin
