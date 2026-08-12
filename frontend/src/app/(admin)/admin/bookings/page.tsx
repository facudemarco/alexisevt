"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Users,
  Pencil,
  FileText,
  Trash2,
  Building2,
  Calendar,
  Layers,
  MapPin,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ReservaStatus = "Pendiente" | "Aprobada" | "Rechazada";

interface PuntoAscenso {
  id: number;
  nombre_lugar: string;
}

interface Pasajero {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  punto_ascenso_id?: number;
  punto_ascenso?: PuntoAscenso;
}

interface HotelDetalle {
  hotel_id: number;
  hotel?: { id: number; nombre: string; direccion?: string; telefono?: string };
  regimen?: string;
  cantidad_noches?: number;
  precio?: number;
}

interface HotelConfig {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

interface PaqueteDetalle {
  id: number;
  titulo_subtitulo: string;
  fecha_salida?: string;
  fecha_regreso?: string;
  duracion_dias: number;
  duracion_noches: number;
  precio_base: number;
  precio_adicional?: number;
  moneda?: string;
  periodo?: string;
  regimen?: string;
  tipo_salidas?: string;
  aereo_incluido?: boolean;
  destino?: { id: number; nombre: string; sigla?: string };
  hotel_detalles?: HotelDetalle[];
  puntos_ascenso?: PuntoAscenso[];
  aereo_puntos_ascenso?: PuntoAscenso[];
}

interface Reserva {
  id: number;
  vendedor_id: number;
  paquete_id: number;
  hotel_id?: number;
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  pasajeros_adultos: number;
  pasajeros_menores: number;
  estado_reserva: ReservaStatus;
  motivo_rechazo?: string;
  precio_total: number;
  fecha_salida?: string;
  fecha_regreso?: string;
  duracion_dias?: number;
  duracion_noches?: number;
  es_bloqueo?: boolean;
  fecha_creacion: string;
  vendedor?: { id: number; nombre: string; email: string; nombre_sistema?: string };
  hotel?: { id: number; nombre: string; direccion?: string; telefono?: string };
  paquete?: PaqueteDetalle;
  pasajeros: Pasajero[];
}

interface Destino {
  id: number;
  nombre: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ReservaStatus, string> = {
  Pendiente: "bg-yellow-400 text-white",
  Aprobada:  "bg-green-500 text-white",
  Rechazada: "bg-red-500 text-white",
};

function StatusBadge({ status }: { status: ReservaStatus }) {
  return (
    <span className={cn("inline-flex items-center justify-center px-4 py-1 rounded-md text-sm font-bold", STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Filter Select ────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[170px]">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none h-10 rounded-lg border-2 border-gray-200 bg-white px-3 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors cursor-pointer"
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

type ModalView = "detail" | "reject" | "cancel" | "revert";

function DetailModal({ reserva, onClose, onUpdate, onEdit }: {
  reserva: Reserva;
  onClose: () => void;
  onUpdate: (updated: Reserva) => void;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [view, setView] = useState<ModalView>("detail");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function changeStatus(estado: string, motivoText?: string) {
    setSaving(true);
    try {
      const updated = await fetchApi(`/bookings/${reserva.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ estado, motivo: motivoText ?? undefined }),
      });
      onUpdate(updated);
      const statusText = estado === "Aprobada" ? "confirmada" : estado.toLowerCase();
      showToast(`Reserva #${reserva.id} ${statusText} con éxito`);
      setTimeout(() => onClose(), 1500);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al actualizar estado");
    } finally {
      setSaving(false);
    }
  }

  const p = reserva.paquete;
  const destino = p?.destino?.nombre ?? "—";

  // Hotel y Regimen
  const hotelDetalle = p?.hotel_detalles?.find((d) => d.hotel_id === reserva.hotel_id) ?? p?.hotel_detalles?.[0];
  const hotelNombre = reserva.hotel?.nombre ?? hotelDetalle?.hotel?.nombre ?? "—";
  const hotelRegimen = hotelDetalle?.regimen ?? p?.regimen ?? null;

  const fechaSalidaEfectiva = reserva.fecha_salida || p?.fecha_salida;
  const fechaRegresoEfectiva = reserva.fecha_regreso || p?.fecha_regreso;
  const duracionDiasEfectiva = reserva.duracion_dias ?? p?.duracion_dias;
  const duracionNochesEfectiva = reserva.duracion_noches ?? p?.duracion_noches;

  const isAprobada = reserva.estado_reserva === "Aprobada";
  const isPendiente = reserva.estado_reserva === "Pendiente";
  const isRechazada = reserva.estado_reserva === "Rechazada";
  const totalPax = reserva.pasajeros_adultos + reserva.pasajeros_menores;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900">Reserva #{reserva.id}</h2>
            <StatusBadge status={reserva.estado_reserva} />
            {reserva.es_bloqueo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black bg-purple-600 text-white uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                Bloqueo ({totalPax} PAX)
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {view === "detail" && (
            <>
              {/* Two-column: Cliente | Paquete */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-b border-gray-200 bg-gray-50/40">
                {/* Datos del cliente */}
                <div className="px-6 py-5 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Datos del Cliente / Titular</p>
                  <p className="text-lg font-bold text-gray-900">{reserva.cliente_nombre || "—"}</p>
                  {reserva.cliente_email && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <span>✉️</span> {reserva.cliente_email}
                    </p>
                  )}
                  {reserva.cliente_telefono && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <span>📞</span> {reserva.cliente_telefono}
                    </p>
                  )}
                  {reserva.vendedor && (
                    <p className="text-xs text-gray-500 pt-1">
                      Vendedor: <span className="font-semibold text-gray-700">{reserva.vendedor.nombre_sistema || reserva.vendedor.nombre}</span>
                    </p>
                  )}
                </div>

                {/* Datos del paquete y hotel */}
                <div className="px-6 py-5 space-y-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Datos del Viaje y Estadía</p>
                  <p className="text-base font-extrabold text-[#1D5D8C]">{destino}</p>
                  {(fechaSalidaEfectiva || fechaRegresoEfectiva) && (
                    <p className="text-sm text-gray-700 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {fmt(fechaSalidaEfectiva)} al {fmt(fechaRegresoEfectiva)}
                    </p>
                  )}
                  {(duracionDiasEfectiva || duracionNochesEfectiva) && (
                    <p className="text-sm text-gray-600">
                      {duracionDiasEfectiva ?? "—"} días, {duracionNochesEfectiva ?? "—"} noches
                    </p>
                  )}
                  {hotelNombre !== "—" && (
                    <p className="text-sm text-gray-800 flex items-center gap-1.5 font-medium">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      Hotel {hotelNombre}
                      {hotelRegimen && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {hotelRegimen}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-base font-black text-gray-900 pt-1">
                    Total: ${reserva.precio_total?.toLocaleString("es-AR")}.-
                  </p>
                </div>
              </div>

              {/* Bloqueo info si no tiene pasajeros aún */}
              {reserva.es_bloqueo && reserva.pasajeros.length === 0 && (
                <div className="p-5 border-b border-gray-200 bg-purple-50/50">
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-purple-900">Bloqueo grupal sin pasajeros cargados</p>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Este bloqueo tiene <strong>{totalPax} plazas reservadas</strong>. Podés cargar los datos de los pasajeros presionando el botón <strong>Modificar</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pasajeros */}
              {reserva.pasajeros.length > 0 && (
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900">
                      Pasajeros ({reserva.pasajeros.length} de {totalPax})
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100/80 text-xs font-bold text-gray-700">
                          <th className="px-3 py-2.5 text-left border-b border-gray-200">Nombre</th>
                          <th className="px-3 py-2.5 text-left border-b border-l border-gray-200">Apellido</th>
                          <th className="px-3 py-2.5 text-left border-b border-l border-gray-200">DNI</th>
                          <th className="px-3 py-2.5 text-left border-b border-l border-gray-200">Fecha nac.</th>
                          <th className="px-3 py-2.5 text-left border-b border-l border-gray-200">Teléfono</th>
                          <th className="px-3 py-2.5 text-left border-b border-l border-gray-200 text-[#1D5D8C]">Lugar de ascenso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reserva.pasajeros.map((pas, idx) => (
                          <tr key={pas.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            <td className="px-3 py-2.5 border-b border-gray-200 font-semibold text-gray-800">{pas.nombre}</td>
                            <td className="px-3 py-2.5 border-b border-l border-gray-200 text-gray-700">{pas.apellido}</td>
                            <td className="px-3 py-2.5 border-b border-l border-gray-200 text-gray-600">{pas.dni || "—"}</td>
                            <td className="px-3 py-2.5 border-b border-l border-gray-200 text-gray-600 whitespace-nowrap">{fmt(pas.fecha_nacimiento)}</td>
                            <td className="px-3 py-2.5 border-b border-l border-gray-200 text-gray-600">{pas.telefono || "—"}</td>
                            <td className="px-3 py-2.5 border-b border-l border-gray-200 font-medium text-[#1D5D8C] whitespace-nowrap">
                              {pas.punto_ascenso?.nombre_lugar ? (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#1D5D8C]" />
                                  {pas.punto_ascenso.nombre_lugar}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Motivo rechazo */}
              {reserva.motivo_rechazo && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Motivo de rechazo / cancelación</p>
                    <p className="text-sm text-red-800">{reserva.motivo_rechazo}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sub-view: rechazar */}
          {(view === "reject" || view === "cancel") && (
            <div className="px-6 py-5 space-y-4">
              <button
                onClick={() => setView("detail")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {view === "cancel" ? "Cancelar reserva confirmada" : "Rechazar reserva"} #{reserva.id}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {view === "cancel"
                    ? "Se notificará al vendedor con el motivo de cancelación."
                    : "Ingresá el motivo de rechazo. El vendedor podrá verlo en su panel."}
                </p>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo *</label>
                <textarea
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  rows={4}
                  placeholder="Ej: Falta de cupo, documentación incompleta..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Sub-view: volver a pendiente */}
          {view === "revert" && (
            <div className="px-6 py-5 space-y-4">
              <button
                onClick={() => setView("detail")}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Pasar reserva #{reserva.id} a Pendiente
                </h3>
                <p className="text-sm text-gray-500">
                  La reserva volverá al estado Pendiente y se notificará al vendedor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
          {view === "detail" && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-[#1D5D8C] text-[#1D5D8C] font-bold text-sm hover:bg-[#1D5D8C]/5 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Modificar
              </button>
              <button
                onClick={() => router.push(`/admin/bookings/${reserva.id}/voucher`)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Emitir Voucher
              </button>
            </div>
          )}
          {view !== "detail" && <div />}
          <div className="flex gap-2.5">
            {view === "detail" && (
              <>
                {isPendiente && (
                  <>
                    <button
                      onClick={() => setView("reject")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => changeStatus("Aprobada")}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirmar
                    </button>
                  </>
                )}

                {isAprobada && (
                  <>
                    <button
                      onClick={() => setView("cancel")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => setView("revert")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-400 text-white font-bold text-sm hover:bg-yellow-500 transition-colors"
                    >
                      Pendiente
                    </button>
                  </>
                )}

                {isRechazada && (
                  <>
                    <button
                      onClick={() => changeStatus("Pendiente")}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-400 text-white font-bold text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Pasar a Pendiente
                    </button>
                    <button
                      onClick={() => changeStatus("Aprobada")}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirmar
                    </button>
                  </>
                )}
              </>
            )}

            {(view === "reject" || view === "cancel") && (
              <button
                onClick={() => changeStatus("Rechazada", motivo.trim())}
                disabled={saving || !motivo.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {view === "cancel" ? "Confirmar cancelación" : "Confirmar rechazo"}
              </button>
            )}

            {view === "revert" && (
              <button
                onClick={() => changeStatus("Pendiente")}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-400 text-white font-bold text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirmar
              </button>
            )}
          </div>
        </div>

        {/* Floating Toast */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-bold text-sm">{toast}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Booking Modal ───────────────────────────────────────────────────────

interface VendedorOption { id: number; nombre: string; nombre_sistema?: string; }
interface PaxForm { nombre: string; apellido: string; dni: string; fecha_nacimiento: string; telefono: string; punto_ascenso_id: string; }
const emptyPax = (): PaxForm => ({ nombre: "", apellido: "", dni: "", fecha_nacimiento: "", telefono: "", punto_ascenso_id: "" });

function EditBookingModal({ reserva, onClose, onSaved }: {
  reserva: Reserva;
  onClose: () => void;
  onSaved: (updated: Reserva) => void;
}) {
  const [paquetes, setPaquetes] = useState<{ id: number; titulo_subtitulo: string }[]>([]);
  const [vendedores, setVendedores] = useState<VendedorOption[]>([]);
  const [allHoteles, setAllHoteles] = useState<HotelConfig[]>([]);
  const [paqueteDetalle, setPaqueteDetalle] = useState<PaqueteDetalle | null>(null);
  const [loadingOpts, setLoadingOpts] = useState(true);

  const [paqueteId, setPaqueteId] = useState(String(reserva.paquete_id));
  const [hotelId, setHotelId] = useState(reserva.hotel_id ? String(reserva.hotel_id) : "");
  const [vendedorId, setVendedorId] = useState(reserva.vendedor_id ? String(reserva.vendedor_id) : "particular");
  const [clienteNombre, setClienteNombre] = useState(reserva.cliente_nombre ?? "");
  const [clienteEmail, setClienteEmail] = useState(reserva.cliente_email ?? "");
  const [clienteTelefono, setClienteTelefono] = useState(reserva.cliente_telefono ?? "");
  const [adultos, setAdultos] = useState(reserva.pasajeros_adultos);
  const [menores, setMenores] = useState(reserva.pasajeros_menores);
  const [precioTotal, setPrecioTotal] = useState(String(reserva.precio_total));
  const [fechaSalida, setFechaSalida] = useState(reserva.fecha_salida ?? reserva.paquete?.fecha_salida ?? "");
  const [fechaRegreso, setFechaRegreso] = useState(reserva.fecha_regreso ?? reserva.paquete?.fecha_regreso ?? "");
  const [duracionDias, setDuracionDias] = useState(String(reserva.duracion_dias ?? reserva.paquete?.duracion_dias ?? ""));
  const [duracionNoches, setDuracionNoches] = useState(String(reserva.duracion_noches ?? reserva.paquete?.duracion_noches ?? ""));
  const [esBloqueo, setEsBloqueo] = useState(Boolean(reserva.es_bloqueo));

  // FIX: Cargar punto_ascenso_id existente del pasajero (no vacío)
  const [pasajeros, setPasajeros] = useState<PaxForm[]>(
    reserva.pasajeros.length > 0
      ? reserva.pasajeros.map((p) => ({
          nombre: p.nombre,
          apellido: p.apellido,
          dni: p.dni ?? "",
          fecha_nacimiento: p.fecha_nacimiento ?? "",
          telefono: p.telefono ?? "",
          punto_ascenso_id: p.punto_ascenso_id ? String(p.punto_ascenso_id) : "",
        }))
      : []
  );
  const [expanded, setExpanded] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Puntos de ascenso combinados del paquete actual
  const puntosAscenso = useMemo<PuntoAscenso[]>(() => {
    if (!paqueteDetalle) return [];
    const combined = [...(paqueteDetalle.puntos_ascenso ?? [])];
    if (paqueteDetalle.aereo_incluido) combined.push(...(paqueteDetalle.aereo_puntos_ascenso ?? []));
    const seen = new Set();
    return combined.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  }, [paqueteDetalle]);

  // Load paquetes, vendedores y hoteles de configuración
  useEffect(() => {
    Promise.all([
      fetchApi("/packages/"),
      fetchApi("/users/?rol=vendedor"),
      fetchApi("/config/hoteles/"),
    ]).then(([pkgs, vends, hotels]) => {
      setPaquetes(pkgs);
      setVendedores(vends);
      setAllHoteles(hotels);
    }).catch(() => {}).finally(() => setLoadingOpts(false));
  }, []);

  // Load package detail whenever paqueteId changes
  useEffect(() => {
    if (!paqueteId) { setPaqueteDetalle(null); return; }
    fetchApi(`/packages/${paqueteId}`).then((d) => {
      setPaqueteDetalle(d);
      // If no custom duration set, default to package duration
      if (!duracionDias && d.duracion_dias) setDuracionDias(String(d.duracion_dias));
      if (!duracionNoches && d.duracion_noches) setDuracionNoches(String(d.duracion_noches));
      if (!fechaSalida && d.fecha_salida) setFechaSalida(d.fecha_salida);
      if (!fechaRegreso && d.fecha_regreso) setFechaRegreso(d.fecha_regreso);
    }).catch(() => {});
  }, [paqueteId]);

  function syncPaxCount(newAdults: number, newMinors: number) {
    const total = newAdults + newMinors;
    setAdultos(newAdults);
    setMenores(newMinors);
    // Para reservas no bloqueo o con pasajeros ya cargados, sincronizar tamaño
    if (!esBloqueo || pasajeros.length > 0) {
      setPasajeros((prev) => {
        if (total > prev.length) return [...prev, ...Array(total - prev.length).fill(null).map(emptyPax)];
        return prev.slice(0, total);
      });
    }
  }

  function addPassenger() {
    setPasajeros((prev) => [...prev, emptyPax()]);
    setExpanded(pasajeros.length);
  }

  function removePassenger(index: number) {
    setPasajeros((prev) => prev.filter((_, i) => i !== index));
    if (expanded >= index) setExpanded(Math.max(0, expanded - 1));
  }

  function updatePax(idx: number, field: keyof PaxForm, value: string) {
    setPasajeros((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  async function handleSave() {
    if (!clienteNombre.trim()) { setError("Ingresá el nombre del cliente / grupo."); return; }

    // Validación de pasajeros solo si no es bloqueo vacío o si se completaron filas
    if (!esBloqueo) {
      for (let i = 0; i < pasajeros.length; i++) {
        const p = pasajeros[i];
        if (!p.nombre.trim() || !p.apellido.trim()) { setError(`Completá nombre y apellido del pasajero ${i + 1}.`); setExpanded(i); return; }
        if (!p.dni.trim()) { setError(`Ingresá el DNI del pasajero ${i + 1}.`); setExpanded(i); return; }
      }
    } else {
      // En bloqueos, si se ingresó algo en una fila, exigir nombre y apellido
      for (let i = 0; i < pasajeros.length; i++) {
        const p = pasajeros[i];
        if (p.nombre.trim() || p.apellido.trim() || p.dni.trim()) {
          if (!p.nombre.trim() || !p.apellido.trim()) {
            setError(`Completá nombre y apellido del pasajero ${i + 1}.`);
            setExpanded(i);
            return;
          }
        }
      }
    }

    setError(""); setSaving(true);
    try {
      // Filtrar filas completamente vacías en caso de bloqueo
      const validPax = pasajeros.filter((p) => p.nombre.trim() && p.apellido.trim());

      const body: Record<string, unknown> = {
        paquete_id: parseInt(paqueteId),
        hotel_id: hotelId ? parseInt(hotelId) : null,
        cliente_nombre: clienteNombre.trim(),
        cliente_email: clienteEmail.trim() || null,
        cliente_telefono: clienteTelefono.trim() || null,
        pasajeros_adultos: adultos,
        pasajeros_menores: menores,
        precio_total: parseFloat(precioTotal) || reserva.precio_total,
        fecha_salida: fechaSalida || null,
        fecha_regreso: fechaRegreso || null,
        duracion_dias: duracionDias ? parseInt(duracionDias) : null,
        duracion_noches: duracionNoches ? parseInt(duracionNoches) : null,
        es_bloqueo: esBloqueo,
        pasajeros: validPax.map((p) => ({
          nombre: p.nombre.trim(),
          apellido: p.apellido.trim(),
          dni: p.dni.trim() || undefined,
          fecha_nacimiento: p.fecha_nacimiento || undefined,
          telefono: p.telefono.trim() || undefined,
          punto_ascenso_id: p.punto_ascenso_id ? parseInt(p.punto_ascenso_id) : undefined,
        })),
      };
      if (vendedorId !== "particular") body.vendedor_id = parseInt(vendedorId);
      const updated = await fetchApi(`/bookings/${reserva.id}`, { method: "PUT", body: JSON.stringify(body) });
      onSaved(updated);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al modificar la reserva.");
    } finally {
      setSaving(false);
    }
  }

  const totalPax = adultos + menores;
  const hotelOpcionesPaquete = paqueteDetalle?.hotel_detalles ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900">Modificar Reserva #{reserva.id}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loadingOpts ? (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D5D8C]" />
              <span className="text-sm font-medium">Cargando datos...</span>
            </div>
          ) : (
            <>
              {/* Paquete */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Paquete *</label>
                <select
                  value={paqueteId}
                  onChange={(e) => setPaqueteId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar paquete...</option>
                  {paquetes.map((p) => (
                    <option key={p.id} value={p.id}>{p.titulo_subtitulo}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Hotel Mejorado */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Hotel y Régimen</label>
                {hotelOpcionesPaquete.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs font-semibold text-gray-500">Hoteles asignados al paquete:</p>
                    {hotelOpcionesPaquete.map((d) => (
                      <label
                        key={d.hotel_id}
                        className={cn(
                          "flex items-center justify-between gap-3 cursor-pointer px-4 py-3 rounded-xl border-2 transition-colors",
                          String(d.hotel_id) === hotelId ? "border-[#1D5D8C] bg-[#1D5D8C]/5" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="edit_hotel"
                            value={String(d.hotel_id)}
                            checked={String(d.hotel_id) === hotelId}
                            onChange={() => setHotelId(String(d.hotel_id))}
                            className="accent-[#1D5D8C]"
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-800">{d.hotel?.nombre ?? `Hotel #${d.hotel_id}`}</p>
                            {d.regimen && <p className="text-xs font-medium text-emerald-700">{d.regimen}</p>}
                          </div>
                        </div>
                        {d.precio != null && d.precio > 0 && (
                          <span className="text-sm font-black text-[#1D5D8C]">${d.precio.toLocaleString("es-AR")}</span>
                        )}
                      </label>
                    ))}
                  </div>
                ) : null}

                {/* Dropdown general de hotel */}
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">O seleccionar cualquier otro hotel registrado:</label>
                  <select
                    value={hotelId}
                    onChange={(e) => setHotelId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors cursor-pointer"
                  >
                    <option value="">Sin hotel específico</option>
                    {allHoteles.map((h) => (
                      <option key={h.id} value={h.id}>{h.nombre} {h.direccion ? `(${h.direccion})` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vendedor */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Vendedor Asignado</label>
                <select
                  value={vendedorId}
                  onChange={(e) => setVendedorId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors appearance-none cursor-pointer"
                >
                  <option value="particular">Particular (sin vendedor asignado)</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>{v.nombre_sistema || v.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    {esBloqueo ? "Nombre Grupo *" : "Nombre del cliente *"}
                  </label>
                  <input
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder=""
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                  <input
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    placeholder=""
                    type="email"
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Teléfono</label>
                  <input
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder=""
                    type="tel"
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  />
                </div>
              </div>

              {/* Fechas de Salida / Regreso y Duración Días / Noches */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fechas y Duración del Viaje</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Fecha Salida</label>
                    <input
                      type="date"
                      value={fechaSalida}
                      onChange={(e) => setFechaSalida(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Fecha Regreso</label>
                    <input
                      type="date"
                      value={fechaRegreso}
                      onChange={(e) => setFechaRegreso(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Días</label>
                    <input
                      type="number"
                      min={1}
                      value={duracionDias}
                      onChange={(e) => setDuracionDias(e.target.value)}
                      placeholder="Ej: 5"
                      className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Noches</label>
                    <input
                      type="number"
                      min={0}
                      value={duracionNoches}
                      onChange={(e) => setDuracionNoches(e.target.value)}
                      placeholder="Ej: 4"
                      className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Precio Total y Tipo de Reserva (Bloqueo) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Precio Total ($ ARS)</label>
                  <input
                    type="number"
                    value={precioTotal}
                    onChange={(e) => setPrecioTotal(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  />
                </div>
                <div className="pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer bg-purple-50 px-4 py-3 rounded-xl border-2 border-purple-200">
                    <input
                      type="checkbox"
                      checked={esBloqueo}
                      onChange={(e) => setEsBloqueo(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                    <div>
                      <span className="text-sm font-bold text-purple-900 block">Es Bloqueo Grupal</span>
                      <span className="text-xs text-purple-700">Permite mantener la reserva y liquidación sin exigir carga completa de DNI de pasajeros.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Cantidad de Pasajeros */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Adultos</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => syncPaxCount(Math.max(1, adultos - 1), menores)}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={adultos}
                      onChange={(e) => syncPaxCount(Math.max(1, parseInt(e.target.value) || 1), menores)}
                      className="w-16 text-center font-bold text-gray-800 border border-gray-300 rounded-lg h-8"
                    />
                    <button
                      type="button"
                      onClick={() => syncPaxCount(adultos + 1, menores)}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Menores</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => syncPaxCount(adultos, Math.max(0, menores - 1))}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={menores}
                      onChange={(e) => syncPaxCount(adultos, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 text-center font-bold text-gray-800 border border-gray-300 rounded-lg h-8"
                    />
                    <button
                      type="button"
                      onClick={() => syncPaxCount(adultos, menores + 1)}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Formulario Dinámico de Pasajeros */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">
                    Lista de Pasajeros ({pasajeros.length} de {totalPax} plazas)
                  </p>
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="flex items-center gap-1 text-xs font-bold text-[#1D5D8C] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Pasajero
                  </button>
                </div>

                {pasajeros.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">No hay pasajeros cargados en este bloqueo.</p>
                    <button
                      type="button"
                      onClick={addPassenger}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#1D5D8C] px-3.5 py-2 rounded-lg hover:bg-[#164a70] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Cargar primer pasajero
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-gray-200 overflow-hidden">
                    {pasajeros.map((pax, idx) => (
                      <div key={idx} className="border-b border-gray-100 last:border-0 bg-white">
                        <div className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50/80 transition-colors">
                          <button
                            type="button"
                            onClick={() => setExpanded(expanded === idx ? -1 : idx)}
                            className="flex-1 text-left flex items-center justify-between pr-3"
                          >
                            <span>
                              Pasajero {idx + 1} {idx < adultos ? "(Adulto)" : "(Menor)"}
                              {pax.nombre && pax.apellido && (
                                <span className="font-normal text-gray-500 ml-2">— {pax.nombre} {pax.apellido}</span>
                              )}
                            </span>
                            {expanded === idx ? <ChevronLeft className="w-4 h-4 rotate-90 text-gray-400" /> : <ChevronLeft className="w-4 h-4 -rotate-90 text-gray-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removePassenger(idx)}
                            className="text-red-400 hover:text-red-600 p-1 transition-colors"
                            title="Eliminar pasajero"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {expanded === idx && (
                          <div className="px-5 pb-4 grid grid-cols-2 gap-3 bg-gray-50/40 pt-2 border-t border-gray-100">
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Nombre *</label>
                              <input
                                placeholder="Nombre"
                                value={pax.nombre}
                                onChange={(e) => updatePax(idx, "nombre", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Apellido *</label>
                              <input
                                placeholder="Apellido"
                                value={pax.apellido}
                                onChange={(e) => updatePax(idx, "apellido", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">DNI / Pasaporte *</label>
                              <input
                                placeholder="DNI"
                                value={pax.dni}
                                onChange={(e) => updatePax(idx, "dni", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Fecha de nacimiento</label>
                              <input
                                type="date"
                                value={pax.fecha_nacimiento}
                                onChange={(e) => updatePax(idx, "fecha_nacimiento", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] text-gray-700 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Teléfono</label>
                              <input
                                placeholder="Teléfono"
                                value={pax.telefono}
                                onChange={(e) => updatePax(idx, "telefono", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Lugar de ascenso / carga</label>
                              <select
                                value={pax.punto_ascenso_id}
                                onChange={(e) => updatePax(idx, "punto_ascenso_id", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white text-gray-700 cursor-pointer"
                              >
                                <option value="">Seleccionar lugar de ascenso...</option>
                                {puntosAscenso.map((p) => (
                                  <option key={p.id} value={p.id}>{p.nombre_lugar}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loadingOpts}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Booking Modal ─────────────────────────────────────────────────────

interface PaqueteOption { id: number; titulo_subtitulo: string; precio_base: number; precio_adicional: number; moneda: string; fecha_salida?: string; fecha_regreso?: string; duracion_dias?: number; duracion_noches?: number; }

function CreateBookingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [mode, setMode] = useState<"regular" | "bloqueo">("regular");
  const [paquetes, setPaquetes] = useState<PaqueteOption[]>([]);
  const [vendedores, setVendedores] = useState<VendedorOption[]>([]);
  const [allHoteles, setAllHoteles] = useState<HotelConfig[]>([]);
  const [paqueteDetalle, setPaqueteDetalle] = useState<PaqueteDetalle | null>(null);
  const [loadingOpts, setLoadingOpts] = useState(true);

  const [paqueteId, setPaqueteId] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [vendedorId, setVendedorId] = useState("particular");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [adultos, setAdultos] = useState(1);
  const [menores, setMenores] = useState(0);
  const [precioTotalCustom, setPrecioTotalCustom] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [fechaRegreso, setFechaRegreso] = useState("");
  const [duracionDias, setDuracionDias] = useState("");
  const [duracionNoches, setDuracionNoches] = useState("");

  const [pasajeros, setPasajeros] = useState<PaxForm[]>([emptyPax()]);
  const [expanded, setExpanded] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchApi("/packages/"),
      fetchApi("/users/?rol=vendedor"),
      fetchApi("/config/hoteles/"),
    ]).then(([pkgs, vends, hotels]) => {
      setPaquetes(pkgs);
      setVendedores(vends);
      setAllHoteles(hotels);
    }).catch(() => {}).finally(() => setLoadingOpts(false));
  }, []);

  // When package changes
  useEffect(() => {
    if (!paqueteId) { setPaqueteDetalle(null); return; }
    fetchApi(`/packages/${paqueteId}`).then((d) => {
      setPaqueteDetalle(d);
      if (d.fecha_salida) setFechaSalida(d.fecha_salida);
      if (d.fecha_regreso) setFechaRegreso(d.fecha_regreso);
      if (d.duracion_dias) setDuracionDias(String(d.duracion_dias));
      if (d.duracion_noches) setDuracionNoches(String(d.duracion_noches));
      if (d.hotel_detalles && d.hotel_detalles[0]) {
        setHotelId(String(d.hotel_detalles[0].hotel_id));
      }
    }).catch(() => {});
  }, [paqueteId]);

  const totalPax = adultos + menores;
  const selectedPkg = paquetes.find((p) => String(p.id) === paqueteId);

  const autoCalculatedPrice = selectedPkg
    ? (selectedPkg.precio_base + (selectedPkg.precio_adicional ?? 0)) * adultos + selectedPkg.precio_base * menores
    : 0;

  const finalPrecioTotal = precioTotalCustom ? parseFloat(precioTotalCustom) : autoCalculatedPrice;

  // Puntos de ascenso del paquete
  const puntosAscenso = useMemo<PuntoAscenso[]>(() => {
    if (!paqueteDetalle) return [];
    const combined = [...(paqueteDetalle.puntos_ascenso ?? [])];
    if (paqueteDetalle.aereo_incluido) combined.push(...(paqueteDetalle.aereo_puntos_ascenso ?? []));
    const seen = new Set();
    return combined.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  }, [paqueteDetalle]);

  function syncPaxCount(newTotal: number) {
    setPasajeros((prev) => {
      if (newTotal > prev.length) return [...prev, ...Array(newTotal - prev.length).fill(null).map(emptyPax)];
      return prev.slice(0, newTotal);
    });
  }

  function updatePax(idx: number, field: keyof PaxForm, value: string) {
    setPasajeros((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  async function handleSave() {
    if (!paqueteId) { setError("Seleccioná un paquete."); return; }
    if (!clienteNombre.trim()) { setError("Ingresá el nombre del cliente / grupo."); return; }

    if (mode === "regular") {
      for (let i = 0; i < pasajeros.length; i++) {
        const p = pasajeros[i];
        if (!p.nombre.trim() || !p.apellido.trim()) { setError(`Completá nombre y apellido del pasajero ${i + 1}.`); setExpanded(i); return; }
        if (!p.dni.trim()) { setError(`Ingresá el DNI del pasajero ${i + 1}.`); setExpanded(i); return; }
      }
    }

    setError(""); setSaving(true);
    try {
      const body: Record<string, unknown> = {
        paquete_id: parseInt(paqueteId),
        hotel_id: hotelId ? parseInt(hotelId) : null,
        cliente_nombre: clienteNombre.trim(),
        cliente_email: clienteEmail.trim() || undefined,
        cliente_telefono: clienteTelefono.trim() || undefined,
        pasajeros_adultos: adultos,
        pasajeros_menores: menores,
        precio_total: finalPrecioTotal,
        fecha_salida: fechaSalida || undefined,
        fecha_regreso: fechaRegreso || undefined,
        duracion_dias: duracionDias ? parseInt(duracionDias) : undefined,
        duracion_noches: duracionNoches ? parseInt(duracionNoches) : undefined,
        es_bloqueo: mode === "bloqueo",
        pasajeros: mode === "regular"
          ? pasajeros.map((p) => ({
              nombre: p.nombre.trim(),
              apellido: p.apellido.trim(),
              dni: p.dni.trim() || undefined,
              fecha_nacimiento: p.fecha_nacimiento || undefined,
              telefono: p.telefono.trim() || undefined,
              punto_ascenso_id: p.punto_ascenso_id ? parseInt(p.punto_ascenso_id) : undefined,
            }))
          : [],
      };
      if (vendedorId !== "particular") body.vendedor_id = parseInt(vendedorId);
      await fetchApi("/bookings/", { method: "POST", body: JSON.stringify(body) });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear la reserva.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header con pestañas Regular / Bloqueo */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900">
              {mode === "regular" ? "Nueva Reserva Regular" : "Nuevo Bloqueo Grupal"}
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex bg-gray-200/80 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setMode("regular")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                mode === "regular" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Reserva Regular (con pasajeros)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("bloqueo");
                if (adultos === 1) setAdultos(20);
              }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                mode === "bloqueo" ? "bg-purple-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              Bloqueo Grupal (sin DNI obligatorio)
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loadingOpts ? (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D5D8C]" />
              <span className="text-sm font-medium">Cargando paquetes...</span>
            </div>
          ) : (
            <>
              {mode === "bloqueo" && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 leading-relaxed">
                  <strong>ℹ️ Modo Bloqueo:</strong> Creá una reserva para grupos grandes (ej: 50 plazas) a nombre de un cliente/empresa. Esto genera la reserva y habilita su <strong>liquidación contable de inmediato</strong>, permitiendo cargar los nombres y datos de cada pasajero más adelante de forma manual.
                </div>
              )}

              {/* Paquete */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Paquete *</label>
                <select
                  value={paqueteId}
                  onChange={(e) => setPaqueteId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar paquete...</option>
                  {paquetes.map((p) => (
                    <option key={p.id} value={p.id}>{p.titulo_subtitulo}</option>
                  ))}
                </select>
                {selectedPkg && (
                  <p className="text-xs text-gray-500 mt-1">
                    Precio base de referencia: ${selectedPkg.precio_base.toLocaleString("es-AR")} {selectedPkg.moneda}
                  </p>
                )}
              </div>

              {/* Hotel */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Hotel Asignado</label>
                <select
                  value={hotelId}
                  onChange={(e) => setHotelId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors cursor-pointer"
                >
                  <option value="">A confirmar / Según paquete</option>
                  {allHoteles.map((h) => (
                    <option key={h.id} value={h.id}>{h.nombre} {h.direccion ? `(${h.direccion})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Vendedor */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Vendedor</label>
                <select
                  value={vendedorId}
                  onChange={(e) => setVendedorId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors cursor-pointer"
                >
                  <option value="particular">Particular (sin vendedor asignado)</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>{v.nombre_sistema || v.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    {mode === "bloqueo" ? "Nombre Grupo *" : "Nombre del cliente *"}
                  </label>
                  <input
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder=""
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                  <input
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    placeholder=""
                    type="email"
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Teléfono</label>
                  <input
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder=""
                    type="tel"
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  />
                </div>
              </div>

              {/* Fechas y Duración */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Fecha Salida</label>
                  <input
                    type="date"
                    value={fechaSalida}
                    onChange={(e) => setFechaSalida(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Fecha Regreso</label>
                  <input
                    type="date"
                    value={fechaRegreso}
                    onChange={(e) => setFechaRegreso(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Días</label>
                  <input
                    type="number"
                    min={1}
                    value={duracionDias}
                    onChange={(e) => setDuracionDias(e.target.value)}
                    placeholder="Ej: 5"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Noches</label>
                  <input
                    type="number"
                    min={0}
                    value={duracionNoches}
                    onChange={(e) => setDuracionNoches(e.target.value)}
                    placeholder="Ej: 4"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Cantidad de Pasajeros */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Adultos</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { const v = Math.max(1, adultos - 1); setAdultos(v); if (mode === "regular") syncPaxCount(v + menores); }}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={adultos}
                      onChange={(e) => {
                        const v = Math.max(1, parseInt(e.target.value) || 1);
                        setAdultos(v);
                        if (mode === "regular") syncPaxCount(v + menores);
                      }}
                      className="w-16 text-center font-bold text-gray-800 border border-gray-300 rounded-lg h-8"
                    />
                    <button
                      type="button"
                      onClick={() => { const v = adultos + 1; setAdultos(v); if (mode === "regular") syncPaxCount(v + menores); }}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Menores</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { const v = Math.max(0, menores - 1); setMenores(v); if (mode === "regular") syncPaxCount(adultos + v); }}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={menores}
                      onChange={(e) => {
                        const v = Math.max(0, parseInt(e.target.value) || 0);
                        setMenores(v);
                        if (mode === "regular") syncPaxCount(adultos + v);
                      }}
                      className="w-16 text-center font-bold text-gray-800 border border-gray-300 rounded-lg h-8"
                    />
                    <button
                      type="button"
                      onClick={() => { const v = menores + 1; setMenores(v); if (mode === "regular") syncPaxCount(adultos + v); }}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Precio Total */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Precio Total Pactado ($ ARS)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={precioTotalCustom || (mode === "regular" && autoCalculatedPrice ? String(autoCalculatedPrice) : "")}
                    onChange={(e) => setPrecioTotalCustom(e.target.value)}
                    placeholder={mode === "regular" && autoCalculatedPrice ? String(autoCalculatedPrice) : ""}
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#1D5D8C] transition-colors"
                  />
                </div>
                {selectedPkg && mode === "regular" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Cálculo sugerido por {totalPax} pax: ${autoCalculatedPrice.toLocaleString("es-AR")} {selectedPkg.moneda}
                  </p>
                )}
              </div>

              {/* Pasajeros (solo en modo regular) */}
              {mode === "regular" && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">Datos de los pasajeros ({totalPax})</p>
                  <div className="space-y-2 rounded-xl border border-gray-200 overflow-hidden">
                    {pasajeros.map((pax, idx) => (
                      <div key={idx} className="border-b border-gray-100 last:border-0">
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === idx ? -1 : idx)}
                          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                        >
                          <span>
                            Pasajero {idx + 1} {idx < adultos ? "(Adulto)" : "(Menor)"}
                            {pax.nombre && pax.apellido && <span className="font-normal text-gray-500 ml-2">— {pax.nombre} {pax.apellido}</span>}
                          </span>
                          {expanded === idx ? <ChevronLeft className="w-4 h-4 rotate-90 text-gray-400" /> : <ChevronLeft className="w-4 h-4 -rotate-90 text-gray-400" />}
                        </button>
                        {expanded === idx && (
                          <div className="px-5 pb-4 grid grid-cols-2 gap-3 bg-gray-50/40 pt-2">
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Nombre *</label>
                              <input
                                placeholder="Nombre"
                                value={pax.nombre}
                                onChange={(e) => updatePax(idx, "nombre", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Apellido *</label>
                              <input
                                placeholder="Apellido"
                                value={pax.apellido}
                                onChange={(e) => updatePax(idx, "apellido", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">DNI *</label>
                              <input
                                placeholder="DNI"
                                value={pax.dni}
                                onChange={(e) => updatePax(idx, "dni", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Fecha de nacimiento</label>
                              <input
                                type="date"
                                value={pax.fecha_nacimiento}
                                onChange={(e) => updatePax(idx, "fecha_nacimiento", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] text-gray-700 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Teléfono</label>
                              <input
                                placeholder="Teléfono"
                                value={pax.telefono}
                                onChange={(e) => updatePax(idx, "telefono", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium block mb-1">Lugar de ascenso</label>
                              <select
                                value={pax.punto_ascenso_id}
                                onChange={(e) => updatePax(idx, "punto_ascenso_id", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] bg-white text-gray-700 cursor-pointer"
                              >
                                <option value="">Seleccionar punto de ascenso...</option>
                                {puntosAscenso.map((p) => (
                                  <option key={p.id} value={p.id}>{p.nombre_lugar}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-400">
            La reserva se creará en estado <span className="font-semibold text-green-600">Aprobada</span> automáticamente.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loadingOpts}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-60 shadow-sm",
                mode === "bloqueo" ? "bg-purple-600 hover:bg-purple-700" : "bg-[#1D5D8C] hover:bg-[#164a70]"
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {mode === "bloqueo" ? "Crear Bloqueo" : "Crear Reserva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const router = useRouter();
  const [reservas, setReservas]     = useState<Reserva[]>([]);
  const [destinos, setDestinos]     = useState<Destino[]>([]);
  const [loading, setLoading]       = useState(true);

  const [filterCliente, setFilterCliente]         = useState("");
  const [filterDestino, setFilterDestino]         = useState("");
  const [filterEstado, setFilterEstado]           = useState("");
  const [filterTipo, setFilterTipo]               = useState("");
  const [filterPeriodo, setFilterPeriodo]         = useState("");
  const [filterReservaId, setFilterReservaId]     = useState("");
  const [filterFechaSalida, setFilterFechaSalida] = useState("");

  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selected, setSelected] = useState<Reserva | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Reserva | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [data, destsData] = await Promise.all([
        fetchApi("/bookings/"),
        fetchApi("/config/destinos/"),
      ]);
      setReservas(data);
      setDestinos(destsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const clienteOptions = useMemo(() => {
    const names = reservas.map((r) => r.cliente_nombre ?? "").filter(Boolean);
    return [...new Set(names)].sort();
  }, [reservas]);

  const periodoOptions = useMemo(() => {
    const p = reservas.map((r) => r.paquete?.periodo).filter(Boolean);
    return [...new Set(p)].sort();
  }, [reservas]);

  const filtered = useMemo(() => {
    let result = reservas.filter((r) => {
      const searchId = filterReservaId.replace("#", "").trim();
      if (searchId && !String(r.id).includes(searchId)) return false;
      if (filterCliente && r.cliente_nombre !== filterCliente) return false;
      if (filterEstado && r.estado_reserva !== filterEstado) return false;
      if (filterTipo === "bloqueo" && !r.es_bloqueo) return false;
      if (filterTipo === "regular" && r.es_bloqueo) return false;
      if (filterDestino && String(r.paquete?.destino?.id ?? "") !== filterDestino) return false;
      if (filterPeriodo && r.paquete?.periodo !== filterPeriodo) return false;
      if (filterFechaSalida) {
        const sal = r.fecha_salida || r.paquete?.fecha_salida;
        if (sal !== filterFechaSalida) return false;
      }
      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      switch (sortBy) {
        case "id": valA = a.id; valB = b.id; break;
        case "cliente": valA = a.cliente_nombre?.toLowerCase() || ""; valB = b.cliente_nombre?.toLowerCase() || ""; break;
        case "destino": valA = a.paquete?.destino?.nombre?.toLowerCase() || ""; valB = b.paquete?.destino?.nombre?.toLowerCase() || ""; break;
        case "salida":  valA = a.fecha_salida || a.paquete?.fecha_salida || ""; valB = b.fecha_salida || b.paquete?.fecha_salida || ""; break;
        case "pasajeros": valA = a.pasajeros_adultos + a.pasajeros_menores; valB = b.pasajeros_adultos + b.pasajeros_menores; break;
        case "estado": valA = a.estado_reserva; valB = b.estado_reserva; break;
        case "fecha_creacion": valA = a.fecha_creacion; valB = b.fecha_creacion; break;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [reservas, filterCliente, filterEstado, filterTipo, filterDestino, filterPeriodo, filterFechaSalida, sortBy, sortOrder, filterReservaId]);

  function handleUpdate(updated: Reserva) {
    setReservas((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const hasFilters = filterCliente || filterDestino || filterEstado || filterTipo || filterPeriodo || filterFechaSalida || filterReservaId;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reservas y Bloqueos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de reservas individuales, bloqueos grupales y emisión de vouchers.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva reserva / Bloqueo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <FilterSelect label="Tipo" value={filterTipo} onChange={setFilterTipo}>
          <option value="">Todos los tipos</option>
          <option value="regular">Reservas regulares</option>
          <option value="bloqueo">Bloqueos grupales</option>
        </FilterSelect>

        <FilterSelect label="Cliente / Grupo" value={filterCliente} onChange={setFilterCliente}>
          <option value="">Todos los clientes</option>
          {clienteOptions.map((n) => <option key={n} value={n}>{n}</option>)}
        </FilterSelect>

        <FilterSelect label="Destino" value={filterDestino} onChange={setFilterDestino}>
          <option value="">Todos los destinos</option>
          {destinos.map((d) => <option key={d.id} value={String(d.id)}>{d.nombre}</option>)}
        </FilterSelect>

        <FilterSelect label="Estado" value={filterEstado} onChange={setFilterEstado}>
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobada">Aprobada</option>
          <option value="Rechazada">Rechazada</option>
        </FilterSelect>

        <FilterSelect label="Período" value={filterPeriodo} onChange={setFilterPeriodo}>
          <option value="">Todos los períodos</option>
          {periodoOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </FilterSelect>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Nro Reserva</label>
          <input
            type="text"
            placeholder="Ej: 125"
            value={filterReservaId}
            onChange={(e) => setFilterReservaId(e.target.value)}
            className="h-10 rounded-lg border-2 border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors w-28"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Fecha de salida</label>
          <input
            type="date"
            value={filterFechaSalida}
            onChange={(e) => setFilterFechaSalida(e.target.value)}
            className="h-10 rounded-lg border-2 border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1D5D8C] transition-colors"
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setFilterCliente("");
              setFilterDestino("");
              setFilterEstado("");
              setFilterTipo("");
              setFilterPeriodo("");
              setFilterReservaId("");
              setFilterFechaSalida("");
            }}
            className="h-10 self-end px-4 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-400 py-20 bg-white rounded-2xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#1D5D8C]" />
          <p className="text-sm font-medium">Cargando reservas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 py-20 bg-white rounded-2xl border border-gray-200">
          <Package className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-medium">No hay reservas con estos filtros.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm border-collapse min-w-[950px] lg:min-w-0">
            <thead>
              <tr className="bg-gray-50/80 uppercase tracking-wider text-[11px]">
                {[
                  { id: "id", label: "ID", width: "w-20" },
                  { id: "fecha_creacion", label: "Alta", width: "w-28" },
                  { id: "cliente", label: "Cliente / Grupo", width: "" },
                  { id: "destino", label: "Destino", width: "" },
                  { id: "salida", label: "Salida", width: "w-28" },
                  { id: "pasajeros", label: "Pasajeros", width: "w-24" },
                  { id: "estado", label: "Estado", width: "w-32" },
                  { id: "voucher", label: "Voucher", width: "w-28" },
                  { id: "actions", label: "", width: "w-10" },
                ].map((col, i) => (
                  <th
                    key={col.id}
                    onClick={() => {
                      if (col.id === "actions" || col.id === "voucher") return;
                      if (sortBy === col.id) {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy(col.id);
                        setSortOrder("asc");
                      }
                    }}
                    className={cn(
                      "px-3.5 py-3 text-left font-bold text-gray-500 border-b border-gray-200",
                      col.width,
                      col.id !== "actions" && col.id !== "voucher" && "cursor-pointer hover:bg-gray-100 transition-colors",
                      i > 0 && "border-l border-gray-100",
                      (col.id === "pasajeros" || col.id === "estado" || col.id === "voucher") && "text-center"
                    )}
                  >
                    <div className="flex items-center gap-1.5 justify-center md:justify-start">
                      {col.label}
                      {col.id !== "actions" && col.id !== "voucher" && (
                        <div className="flex flex-col text-gray-300">
                          {sortBy === col.id ? (
                            sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-[#1D5D8C]" /> : <ArrowDown className="w-3 h-3 text-[#1D5D8C]" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-blue-50/60",
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  )}
                >
                  <td className="px-3.5 py-3.5 border-b border-gray-200 text-[#1D5D8C] font-black">
                    #{r.id}
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-l border-gray-100 text-gray-600 font-medium whitespace-nowrap">
                    {fmt(r.fecha_creacion)}
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-l border-gray-100 font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{r.cliente_nombre || "—"}</span>
                      {r.es_bloqueo && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                          BLOQUEO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-l border-gray-100 text-gray-700">
                    {r.paquete?.destino?.nombre ?? "—"}
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-l border-gray-100 text-gray-700 whitespace-nowrap font-medium">
                    {fmt(r.fecha_salida || r.paquete?.fecha_salida)}
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-l border-gray-100 text-center text-gray-700 font-semibold whitespace-nowrap">
                    {r.pasajeros_adultos + r.pasajeros_menores}
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-l border-gray-100 text-center">
                    <StatusBadge status={r.estado_reserva} />
                  </td>
                  <td
                    className="px-3.5 py-3.5 border-b border-l border-gray-100 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/bookings/${r.id}/voucher`);
                    }}
                  >
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1D5D8C] font-bold text-xs hover:bg-[#1D5D8C] hover:text-white transition-colors"
                      title="Ver / Emitir Voucher"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Voucher
                    </button>
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-l border-gray-100 w-10 text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400">
          Mostrando {filtered.length} de {reservas.length} registros
        </p>
      )}

      {selected && !editTarget && (
        <DetailModal
          reserva={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            handleUpdate(updated);
            setSelected(updated);
          }}
          onEdit={() => { setEditTarget(selected); setSelected(null); }}
        />
      )}

      {editTarget && (
        <EditBookingModal
          reserva={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            handleUpdate(updated);
            setEditTarget(null);
          }}
        />
      )}

      {showCreate && (
        <CreateBookingModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
