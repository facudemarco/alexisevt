import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Bus, Truck, BedDouble, Users, HeartPulse, Clock,
} from "lucide-react";
import { Paquete } from "@/types/package";
import { PackageSidebar } from "./PackageSidebar";

// ── Fetch server-side ─────────────────────────────────────────────────────────

async function getPaquete(id: string): Promise<Paquete | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/packages/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFechaSalida(paquete: Paquete) {
  if (paquete.tipo_salidas === "DIARIAS") return "Salidas diarias";
  if (!paquete.fecha_salida) return "";
  const [y, m, d] = paquete.fecha_salida.split("-");
  return `${d}/${m}/${y}`;
}

// Sección con cabecera oscura (servicios incluidos)
function ServiceBlock({
  icon,
  title,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-3 rounded-t-xl">
        <span className="font-bold text-sm flex items-center gap-2">
          {icon}
          {title}
        </span>
        {right && <span className="text-sm font-semibold">{right}</span>}
      </div>
      <div className="border border-gray-200 rounded-b-xl p-4 bg-white">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paquete = await getPaquete(id);
  if (!paquete) notFound();

  const fechaSalida = formatFechaSalida(paquete);
  const primerHotel = paquete.hotel_detalles?.[0];
  const primerTransporte = paquete.transportes?.[0];

  return (
    <div className="min-h-screen bg-[#F1F4F8]">
      {/* ── Título ──────────────────────────────────────────────────────── */}
      <section className="bg-white pt-40 pb-8 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-wide uppercase mb-3">
          Detalle del paquete
        </h1>
        <p className="flex items-center justify-center gap-1.5 font-bold text-gray-800 text-base md:text-lg uppercase tracking-wide">
          <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
          {paquete.destino?.nombre}
          {fechaSalida && <span>[{fechaSalida}]</span>}
        </p>
        {paquete.categoria && (
          <Link
            href={`/?categoria=${paquete.categoria_id}`}
            className="inline-block mt-2 text-gray-500 italic text-sm hover:underline"
          >
            {paquete.categoria.nombre}
          </Link>
        )}
      </section>

      {/* ── Imagen hero ─────────────────────────────────────────────────── */}
      {paquete.imagen_url && (
        <div className="relative w-full h-[320px] md:h-[460px]">
          <Image
            src={paquete.imagen_url}
            alt={paquete.destino?.nombre ?? "Imagen del paquete"}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* ── Contenido principal ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Sidebar (sticky) ────────────────────────────────────────── */}
          <aside className="w-full lg:w-[300px] xl:w-[320px] flex-shrink-0">
            <PackageSidebar paquete={paquete} />
          </aside>

          {/* ── Contenido derecho ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Breadcrumb tipo tab */}
            <div className="flex items-center gap-2 text-sm text-gray-500 border-b border-gray-300 pb-2">
              <span>Periodo</span>
              <span className="text-gray-300">|</span>
              {paquete.categoria && (
                <span className="font-semibold text-gray-800">{paquete.categoria.nombre}</span>
              )}
            </div>

            {/* Adicionales al paquete */}
            {paquete.adicionales && paquete.adicionales.length > 0 && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-3">Adicionales al paquete</h3>
                <ul className="space-y-1">
                  {paquete.adicionales.map((item, i) => (
                    <li key={i} className="text-gray-700 text-sm">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sobre el destino */}
            {paquete.sobre_el_destino && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-3">Sobre el destino</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{paquete.sobre_el_destino}</p>
              </div>
            )}

            {/* Servicios incluidos */}
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-4">Servicios incluidos</h3>

              {/* Transporte */}
              {primerTransporte && (
                <ServiceBlock
                  icon={<Bus className="w-4 h-4" />}
                  title={`Transporte ida y vuelta a ${paquete.destino?.nombre ?? ""} en ${primerTransporte.tipo ?? primerTransporte.nombre}`}
                  right={primerTransporte.tipo ?? undefined}
                >
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      Empresa: <strong>{primerTransporte.nombre || "A confirmar"}</strong>
                    </p>
                    {(primerTransporte.horario_salida_desde || primerTransporte.horario_salida_hasta) && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        Rango aproximado de Horario de ida:{" "}
                        <strong>
                          {primerTransporte.horario_salida_desde ?? "—"} /{" "}
                          {primerTransporte.horario_salida_hasta ?? "—"} hs
                        </strong>
                      </p>
                    )}
                    {primerTransporte.horario_regreso && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        Horario aproximado de regreso:{" "}
                        <strong>{primerTransporte.horario_regreso} hs</strong>
                      </p>
                    )}
                  </div>
                </ServiceBlock>
              )}

              {/* Traslados */}
              {paquete.include_transfer && (
                <ServiceBlock
                  icon={<Truck className="w-4 h-4" />}
                  title="Traslados"
                >
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      Traslado IN al llegar a destino
                    </p>
                    <p className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      Traslado OUT el día de regreso
                    </p>
                  </div>
                </ServiceBlock>
              )}

              {/* Alojamiento */}
              {primerHotel && primerHotel.hotel && (
                <ServiceBlock
                  icon={<BedDouble className="w-4 h-4" />}
                  title="Alojamiento"
                  right={
                    primerHotel.cantidad_noches
                      ? `${primerHotel.cantidad_noches} noche${primerHotel.cantidad_noches !== 1 ? "s" : ""}`
                      : undefined
                  }
                >
                  {/* Galería de imágenes del hotel */}
                  {primerHotel.hotel.imagenes && primerHotel.hotel.imagenes.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {primerHotel.hotel.imagenes.map((url, i) => (
                        <div
                          key={i}
                          className={`relative rounded-xl overflow-hidden ${i === 0 ? "row-span-2 col-span-1 h-48" : "h-[88px]"}`}
                        >
                          <Image
                            src={url}
                            alt={`${primerHotel.hotel!.nombre} - foto ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 className="font-bold text-gray-900 mb-3">{primerHotel.hotel.nombre}</h4>

                  <div className="space-y-2 text-sm text-gray-700 border border-gray-100 rounded-xl p-3">
                    {primerHotel.hotel.direccion && (
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        Dirección: <strong>{primerHotel.hotel.direccion}</strong>
                      </p>
                    )}
                    {primerHotel.regimen && (
                      <p className="flex items-center gap-2">
                        🍽️ Régimen: <strong>{primerHotel.regimen}</strong>
                      </p>
                    )}
                    {primerHotel.hotel.descripcion && (
                      <div>
                        <p className="flex items-center gap-2 mb-1">
                          📄 Descripción del hotel:
                        </p>
                        <p className="text-gray-600 ml-6">{primerHotel.hotel.descripcion}</p>
                      </div>
                    )}
                  </div>
                </ServiceBlock>
              )}

              {/* Lugares de ascenso */}
              {paquete.puntos_ascenso && paquete.puntos_ascenso.length > 0 && (
                <ServiceBlock
                  icon={<Users className="w-4 h-4" />}
                  title="Lugares de ascenso"
                >
                  <div className="text-sm text-gray-700">
                    <p className="flex items-center gap-2 mb-2 font-medium">
                      <Users className="w-4 h-4 text-gray-400" />
                      Las opciones disponibles para ascender son:
                    </p>
                    <ul className="ml-6 space-y-1 list-disc">
                      {paquete.puntos_ascenso.map((p) => (
                        <li key={p.id}>{p.nombre}</li>
                      ))}
                    </ul>
                  </div>
                </ServiceBlock>
              )}

              {/* Asistencia médica */}
              {paquete.include_asistencia_medica && (
                <ServiceBlock
                  icon={<HeartPulse className="w-4 h-4" />}
                  title="Asistencia médica"
                >
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    Voucher de asistencia médica de Avril Assitance durante todo el viaje
                  </p>
                </ServiceBlock>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
