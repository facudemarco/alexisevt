import Image from "next/image";
import Link from "next/link";
import { Calendar, BedDouble, UtensilsCrossed } from "lucide-react";
import { Paquete } from "@/types/package";

// ── Categorías fijas (deben coincidir con CategoryList) ───────────────────────
const CATEGORIAS_FIJAS = ["Miniturismo", "Argentina", "Brasil", "Internacional"];

async function getPaquetes(): Promise<Paquete[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/packages/`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatFecha(paquete: Paquete): string {
  if (paquete.tipo_salidas === "DIARIAS") return "Salidas diarias";
  if (!paquete.fecha_salida) return "";
  const [y, m, d] = paquete.fecha_salida.split("-");
  return `${d}/${m}/${y}`;
}

function formatPrecio(n: number, moneda: string) {
  return moneda === "ARS" ? `$${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}

/** Convierte "Otros Internacionales" → "otros-internacionales" */
function toAnchor(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

// ── Card ──────────────────────────────────────────────────────────────────────

function PackageCard({ paquete }: { paquete: Paquete }) {
  const fecha = formatFecha(paquete);
  const primerHotel = paquete.hotel_detalles?.[0];
  const hotelNombre = primerHotel?.hotel?.nombre;
  const regimen = primerHotel?.regimen;
  const duracion = `${paquete.duracion_dias} día${paquete.duracion_dias !== 1 ? "s" : ""}, ${paquete.duracion_noches} noche${paquete.duracion_noches !== 1 ? "s" : ""}`;

  return (
    <article className="relative rounded-2xl overflow-hidden shadow-lg group min-h-[280px]">
      {/* Fondo */}
      {paquete.imagen_url ? (
        <Image
          src={paquete.imagen_url}
          alt={paquete.destino?.nombre ?? "Paquete"}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a4f6e] to-[#1a2f45]" />
      )}

      {/* Overlay degradado */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col justify-end h-full p-5 pt-16 text-white">
        {/* Título */}
        <h3 className="text-2xl md:text-3xl font-black leading-tight mb-0.5">
          {paquete.destino?.nombre}
        </h3>
        <p className="text-sm font-semibold text-white/90 mb-3">{paquete.titulo_subtitulo}</p>

        {/* Metadata con divisor vertical */}
        <div className="grid grid-cols-2 text-xs text-white/90 mb-3 gap-y-1.5">
          {fecha && (
            <span className="flex items-center gap-1.5 border-r border-white/30 pr-3">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              {fecha}
            </span>
          )}
          <span className="flex items-center gap-1.5 pl-3">
            ☀️🌙 {duracion}
          </span>
          {regimen && (
            <span className="flex items-center gap-1.5 border-r border-white/30 pr-3">
              <UtensilsCrossed className="w-3.5 h-3.5 flex-shrink-0" />
              {regimen}
            </span>
          )}
          {hotelNombre && (
            <span className="flex items-center gap-1.5 pl-3 truncate">
              <BedDouble className="w-3.5 h-3.5 flex-shrink-0" />
              {hotelNombre}
            </span>
          )}
        </div>

        {/* Precio + botón */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-black leading-none">
              {formatPrecio(paquete.precio_base, paquete.moneda)}.-
            </p>
            {paquete.precio_adicional > 0 && (
              <p className="text-[11px] text-white/70 mt-0.5">
                + {formatPrecio(paquete.precio_adicional, paquete.moneda)} de gastos de reserva
              </p>
            )}
          </div>
          <Link
            href={`/paquetes/${paquete.id}`}
            className="flex-shrink-0 bg-brand-primary hover:bg-[#1a4f78] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-md"
          >
            Ver más...
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── Sección vacía ─────────────────────────────────────────────────────────────

function EmptyCategory({ nombre }: { nombre: string }) {
  return (
    <div className="col-span-full text-center py-12 text-gray-400">
      <p className="text-sm">No hay paquetes de <span className="font-semibold">{nombre}</span> disponibles por el momento.</p>
    </div>
  );
}

// ── Agrupa paquetes por nombre de categoría ───────────────────────────────────

function groupByCategoria(paquetes: Paquete[]): Map<string, Paquete[]> {
  const map = new Map<string, Paquete[]>();
  for (const p of paquetes) {
    const key = p.categoria?.nombre ?? "Otros";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return map;
}

// ── Componente principal ──────────────────────────────────────────────────────

export async function PackageSection() {
  const paquetes = await getPaquetes();
  const grupos = groupByCategoria(paquetes);

  // Construimos las secciones: primero las categorías fijas (con datos o vacías)
  // luego cualquier categoría extra que venga de la API
  const todasCategorias = [
    ...CATEGORIAS_FIJAS,
    ...Array.from(grupos.keys()).filter((k) => !CATEGORIAS_FIJAS.includes(k)),
  ];

  return (
    <>
      {todasCategorias.map((categoria) => {
        const items = grupos.get(categoria) ?? [];
        return (
          <section
            key={categoria}
            id={toAnchor(categoria)}
            className="py-16 px-4 md:px-12 bg-[#EFEFEF] scroll-mt-8"
          >
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-brand-primary text-center tracking-widest uppercase mb-10 italic font-serif">
                {categoria}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.length > 0
                  ? items.map((p) => <PackageCard key={p.id} paquete={p} />)
                  : <EmptyCategory nombre={categoria} />
                }
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
