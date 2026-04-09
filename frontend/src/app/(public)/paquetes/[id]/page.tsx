import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Bus, Plane, Truck, BedDouble, Users, HeartPulse, Clock,
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
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-3 rounded-t-xl">
        <span className="font-bold text-sm flex items-center gap-2">
          {icon}
          {title}
        </span>
        {right && <div>{right}</div>}
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
  const hotelesDetalle = (paquete.hotel_detalles?.filter((d) => d.hotel) ?? [])
    .sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
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
            sizes="100vw"
            quality={100}
            priority
            style={{ objectPosition: paquete.imagen_posicion ?? "center" }}
          />
        </div>
      )}

      {/* ── Contenido principal ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Sidebar (sticky) ────────────────────────────────────────── */}
          <aside className="w-full lg:w-[300px] xl:w-[320px] flex-shrink-0 self-start sticky top-6">
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
                    {paquete.horario_salida && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        Horario aproximado de ida:{" "}
                        <strong>{paquete.horario_salida} hs</strong>
                      </p>
                    )}
                    {paquete.horario_regreso && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        Horario aproximado de regreso:{" "}
                        <strong>{paquete.horario_regreso} hs</strong>
                      </p>
                    )}
                  </div>
                </ServiceBlock>
              )}

              {/* Aéreo */}
              {paquete.aereo_incluido && (
                <ServiceBlock
                  icon={<Plane className="w-4 h-4" />}
                  title={`Transporte en Aéreo a ${paquete.destino?.nombre ?? ""}`}
                  right={
                    paquete.aereo_tipo_servicio ? (
                      <div className="flex items-center gap-3 pr-4 h-full">
                        <span className="text-sm font-semibold">{paquete.aereo_tipo_servicio}</span>
                        <div className="flex items-center justify-center flex-shrink-0">
                          <img 
                            src="/resources/vector-avion.png" 
                            alt="Avión" 
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              objectFit: 'contain',
                              display: 'block'
                            }}
                          />
                        </div>
                      </div>
                    ) : undefined
                  }
                >
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      Aerolínea: <strong>{paquete.aerolinea?.nombre || "A confirmar"}</strong>
                    </p>
                    {paquete.aereo_horario_salida && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        Rango aproximado de Horario aproximado de ida: <strong>
                          {paquete.aereo_horario_salida} 
                          {paquete.aereo_horario_salida_hasta && paquete.aereo_horario_salida_hasta !== "" ? ` / ${paquete.aereo_horario_salida_hasta}` : ""} 
                          hs
                        </strong>
                      </p>
                    )}
                    {paquete.aereo_horario_regreso && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        Horario aproximado de regreso: <strong>{paquete.aereo_horario_regreso} hs</strong>
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

              {/* Alojamiento — un bloque por hotel */}
              {hotelesDetalle.length > 0 && (
                <ServiceBlock
                  icon={<BedDouble className="w-4 h-4" />}
                  title="Alojamiento"
                >
                  <div className="space-y-6">
                    {hotelesDetalle.map((det, idx) => (
                      <div key={idx} className={idx > 0 ? "pt-5 border-t border-gray-100" : ""}>
                        {/* Galería */}
                        {det.hotel!.imagenes && det.hotel!.imagenes.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {det.hotel!.imagenes.map((url, i) => (
                              <div
                                key={i}
                                className={`relative rounded-xl overflow-hidden ${i === 0 ? "row-span-2 col-span-1 h-48" : "h-[88px]"}`}
                              >
                                <Image
                                  src={url}
                                  alt={`${det.hotel!.nombre} - foto ${i + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <h4 className="font-bold text-gray-900 mb-2">{det.hotel!.nombre}</h4>

                        <div className="space-y-2 text-sm text-gray-700 border border-gray-100 rounded-xl p-3">
                          {det.hotel!.direccion && (
                            <p className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              Dirección: <strong>{det.hotel!.direccion}</strong>
                            </p>
                          )}
                          {det.regimen && (
                            <p className="flex items-center gap-2">
                              🍽️ Régimen: <strong>{det.regimen}</strong>
                            </p>
                          )}
                          {det.cantidad_noches && (
                            <p className="flex items-center gap-2">
                              🌙 Noches: <strong>{det.cantidad_noches}</strong>
                            </p>
                          )}
                          {det.hotel!.descripcion && (
                            <div>
                              <p className="flex items-center gap-2 mb-1">📄 Descripción del hotel:</p>
                              <p className="text-gray-600 ml-6">{det.hotel!.descripcion}</p>
                            </div>
                          )}
                        </div>

                        {det.precio != null && det.precio > 0 && (
                          <div className="mt-3 flex items-center justify-between bg-[#1D5D8C]/5 border border-[#1D5D8C]/20 rounded-xl px-4 py-3">
                            <span className="text-sm font-semibold text-gray-700">Precio por persona</span>
                            <span className="text-lg font-black text-[#1D5D8C]">
                              {paquete.moneda === "USD" ? "U$D " : "$ "}
                              {Number(det.precio).toLocaleString("es-AR")}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
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
                        <li key={p.id}>{p.nombre_lugar}</li>
                      ))}
                    </ul>
                  </div>
                </ServiceBlock>
              )}

              {/* Lugares de ascenso Aéreo */}
              {paquete.aereo_incluido && paquete.aereo_puntos_ascenso && paquete.aereo_puntos_ascenso.length > 0 && (
                <ServiceBlock
                  icon={<Users className="w-4 h-4" />}
                  title="Lugares de ascenso (Aéreo)"
                >
                  <div className="text-sm text-gray-700">
                    <p className="flex items-center gap-2 mb-2 font-medium">
                      <Users className="w-4 h-4 text-gray-400" />
                      Puntos de encuentro para el aéreo:
                    </p>
                    <ul className="ml-6 space-y-1 list-disc">
                      {paquete.aereo_puntos_ascenso.map((p) => (
                        <li key={p.id}>{p.nombre_lugar}</li>
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
