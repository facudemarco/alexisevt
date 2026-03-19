export interface Destino {
  id: number;
  nombre: string;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Hotel {
  id: number;
  nombre: string;
  direccion?: string;
  descripcion?: string;
  imagenes?: string[];
}

export interface Transporte {
  id: number;
  nombre: string;           // empresa
  tipo?: string;            // "Bus Semicama", "Bus Cama", "Aéreo"
  horario_salida_desde?: string;
  horario_salida_hasta?: string;
  horario_regreso?: string;
}

export interface Servicio {
  id: number;
  nombre: string;
}

export interface PuntoAscenso {
  id: number;
  nombre: string;
}

export interface PaqueteHotelDetalle {
  hotel_id: number;
  hotel?: Hotel;
  regimen?: string;
  cantidad_noches?: number;
}

export interface Paquete {
  id: number;
  destino_id: number;
  categoria_id: number;
  titulo_subtitulo: string;
  fecha_salida?: string;    // ISO date string "YYYY-MM-DD"
  fecha_regreso?: string;
  duracion_dias: number;
  duracion_noches: number;
  precio_base: number;
  precio_adicional: number;
  moneda: string;
  tipo_salidas: "DIARIAS" | "FECHA_ESPECIFICA";
  imagen_url?: string;
  adicionales: string[];
  sobre_el_destino?: string;
  include_transfer: boolean;
  include_asistencia_medica: boolean;
  es_borrador: boolean;
  estado: boolean;
  // relaciones
  destino?: Destino;
  categoria?: Categoria;
  hotel_detalles: PaqueteHotelDetalle[];
  transportes: Transporte[];
  servicios: Servicio[];
  puntos_ascenso: PuntoAscenso[];
}
