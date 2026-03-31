import Image from "next/image";
import { Calendar, Sun, Moon, Building2, Utensils } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface HotelDetalle {
  hotel?: { nombre: string };
  regimen?: string;
  precio?: number;
}

interface Package {
  id: number;
  destino: { nombre: string };
  titulo_subtitulo: string;
  fecha_salida: string;
  duracion_dias: number;
  duracion_noches: number;
  precio_base: number;
  imagen_url?: string;
  gastos_reserva: number;
  hotel_detalles: HotelDetalle[];
  tipo_salidas?: string;
  moneda?: string;
}

export function PackageCard({ pkg }: { pkg: Package }) {
  const esDiarias = pkg.tipo_salidas === "DIARIAS" || (pkg as any).salidas_diarias;
  const formattedDate = esDiarias
    ? "Salidas diarias"
    : pkg.fecha_salida
      ? format(new Date(pkg.fecha_salida), "dd/MM/yyyy")
      : "—";

  const moneda = pkg.moneda === "USD" ? "U$D " : "$ ";

  const formatPrice = (price: number) =>
    moneda + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(price) + ".-";

  const hoteles = pkg.hotel_detalles?.filter((d) => d.hotel?.nombre) ?? [];

  const preciosHoteles = pkg.hotel_detalles
    ?.map((d) => d.precio)
    .filter((p): p is number => p != null && p > 0);

  const precioDesde = preciosHoteles && preciosHoteles.length > 0
    ? Math.min(...preciosHoteles)
    : pkg.precio_base;

  // "Desde" aparece siempre que haya 2+ hoteles
  const tieneMultiplesPrecios = hoteles.length > 1;

  const bgImage = pkg.imagen_url || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800";

  return (
    <div className="group relative w-full rounded-2xl overflow-hidden shadow-lg h-[420px]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImage}
          alt={pkg.destino?.nombre || "Destino"}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/55 transition-colors group-hover:bg-black/45" />
      </div>

      {/* Content — full height, title top / price bottom */}
      <div className="relative z-10 h-full flex flex-col justify-between px-6 py-6 text-white">

        {/* ── Top: título y subtítulo centrados ── */}
        <div className="text-center">
          <h3 className="text-[36px] md:text-[40px] font-bold tracking-tight leading-tight drop-shadow">
            {pkg.destino?.nombre}
          </h3>
          <p className="text-[18px] md:text-[20px] font-bold opacity-90 mt-1">
            {pkg.titulo_subtitulo}
          </p>
          <div className="w-16 h-[2px] bg-white/40 mx-auto mt-2" />
        </div>

        {/* ── Middle: info ── */}
        <div className="space-y-3 text-[15px] md:text-[16px] font-medium">
          {/* Fila 1: fecha | duración */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-[15px] h-[15px] opacity-85 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-[2px] opacity-85">
                <Sun className="w-[14px] h-[14px] z-10" />
                <Moon className="w-[14px] h-[14px]" />
              </div>
              <span>
                {pkg.duracion_dias} días, {pkg.duracion_noches} noche{pkg.duracion_noches !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Fila(s) hoteles: régimen izq | hotel der */}
          {hoteles.length > 0 ? (
            hoteles.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-[15px] h-[15px] opacity-85 flex-shrink-0" />
                  <span>{d.regimen || "Sin régimen"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-[15px] h-[15px] opacity-85 flex-shrink-0" />
                  <span className="font-bold">{d.hotel!.nombre}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 opacity-70">
              <Building2 className="w-[15px] h-[15px] flex-shrink-0" />
              <span>Sin alojamiento especificado</span>
            </div>
          )}
        </div>

        {/* ── Bottom: precio y botón ── */}
        <div className="flex items-end justify-between">
          <div>
            {tieneMultiplesPrecios && (
              <div className="text-[12px] font-semibold opacity-80 mb-0.5">Desde</div>
            )}
            <div className="text-[38px] md:text-[44px] font-bold leading-none tracking-tight">
              {formatPrice(precioDesde)}
            </div>
            {pkg.gastos_reserva > 0 && (
              <div className="text-[11px] font-semibold opacity-85 mt-1.5">
                + {formatPrice(pkg.gastos_reserva)} de gastos de reserva
              </div>
            )}
          </div>

          <Link href={`/paquetes/${pkg.id}`}>
            <button className="bg-[#1D5D8C] hover:bg-[#164a70] text-white px-6 py-2.5 rounded-xl font-bold text-[15px] transition-colors shadow-md">
              Ver más...
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
