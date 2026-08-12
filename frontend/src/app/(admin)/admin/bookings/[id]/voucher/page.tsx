"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { fetchApi } from "@/lib/api";
import {
  ArrowLeft,
  Pencil,
  Printer,
  Loader2,
  CheckCircle,
  X,
  Bus,
  Building2,
  Save,
  Phone,
  User,
  Calendar,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────

interface VoucherData {
  id: number;
  reserva_id: number;
  // Transporte
  incluye_transporte: boolean;
  transporte_numero?: string;
  transporte_proveedor?: string;
  transporte_direccion?: string;
  transporte_servicio?: string;
  transporte_tramo?: string;
  transporte_coordinador?: string;
  transporte_coordinador_telefono?: string;
  transporte_lugar_ascenso?: string;
  transporte_horario_salida?: string;
  transporte_fecha_salida?: string;
  transporte_fecha_regreso?: string;
  transporte_observaciones?: string;
  // Hotelería
  incluye_hoteleria: boolean;
  hoteleria_numero?: string;
  hoteleria_hotel_nombre?: string;
  hoteleria_direccion?: string;
  hoteleria_telefono?: string;
  hoteleria_noches?: number;
  hoteleria_regimen?: string;
  hoteleria_detalle_habitaciones?: string;
  hoteleria_fecha_ingreso?: string;
  hoteleria_fecha_egreso?: string;
  hoteleria_observaciones?: string;
  // General
  pasajero_titular?: string;
  cant_pax_detalle?: string;
}

function fmtDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Edit Voucher Modal ─────────────────────────────────────────────────

function EditVoucherModal({
  voucher,
  onClose,
  onSaved,
}: {
  voucher: VoucherData;
  onClose: () => void;
  onSaved: (v: VoucherData) => void;
}) {
  const [formData, setFormData] = useState<VoucherData>({ ...voucher });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"transporte" | "hoteleria" | "general">("transporte");

  const handleChange = (field: keyof VoucherData, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await fetchApi(`/vouchers/${voucher.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      onSaved(updated);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar el voucher.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900">Editar Voucher</h2>
            <span className="text-sm font-bold text-gray-400">Reserva #{voucher.reserva_id}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 bg-gray-100/70 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("transporte")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-2 transition-colors",
              tab === "transporte"
                ? "bg-white text-[#1D5D8C] border-[#1D5D8C] shadow-sm"
                : "text-gray-600 border-transparent hover:text-gray-900"
            )}
          >
            <Bus className="w-4 h-4" />
            Voucher de Transporte
          </button>
          <button
            type="button"
            onClick={() => setTab("hoteleria")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-2 transition-colors",
              tab === "hoteleria"
                ? "bg-white text-[#1D5D8C] border-[#1D5D8C] shadow-sm"
                : "text-gray-600 border-transparent hover:text-gray-900"
            )}
          >
            <Building2 className="w-4 h-4" />
            Voucher de Hotelería
          </button>
          <button
            type="button"
            onClick={() => setTab("general")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-2 transition-colors",
              tab === "general"
                ? "bg-white text-[#1D5D8C] border-[#1D5D8C] shadow-sm"
                : "text-gray-600 border-transparent hover:text-gray-900"
            )}
          >
            <User className="w-4 h-4" />
            Titular y Pasajeros
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === "transporte" && (
            <div className="space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer bg-blue-50/60 px-4 py-3 rounded-xl border border-blue-200">
                <input
                  type="checkbox"
                  checked={formData.incluye_transporte}
                  onChange={(e) => handleChange("incluye_transporte", e.target.checked)}
                  className="w-4 h-4 accent-[#1D5D8C] rounded"
                />
                <span className="text-sm font-bold text-[#1D5D8C]">Incluir Voucher de Transporte en este documento</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nro Voucher Transporte</label>
                  <input
                    value={formData.transporte_numero || ""}
                    onChange={(e) => handleChange("transporte_numero", e.target.value)}
                    placeholder="Ej: 33104"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Empresa / Proveedor de Transporte *</label>
                  <input
                    value={formData.transporte_proveedor || ""}
                    onChange={(e) => handleChange("transporte_proveedor", e.target.value)}
                    placeholder="Ej: Flecha Bus / Plusmar / A CONFIRMAR OK"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-semibold focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Coordinador/a</label>
                  <input
                    value={formData.transporte_coordinador || ""}
                    onChange={(e) => handleChange("transporte_coordinador", e.target.value)}
                    placeholder="Nombre y apellido del coordinador"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono Coordinador/a</label>
                  <input
                    value={formData.transporte_coordinador_telefono || ""}
                    onChange={(e) => handleChange("transporte_coordinador_telefono", e.target.value)}
                    placeholder="Ej: 11-4567-8901"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Servicio</label>
                  <input
                    value={formData.transporte_servicio || ""}
                    onChange={(e) => handleChange("transporte_servicio", e.target.value)}
                    placeholder="Ej: Bus Semicama / Cama Ejecutivo / Aéreo"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tramo</label>
                  <input
                    value={formData.transporte_tramo || ""}
                    onChange={(e) => handleChange("transporte_tramo", e.target.value)}
                    placeholder="Ej: BUE/MDQ/BUE"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-semibold focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Salida</label>
                  <input
                    type="date"
                    value={formData.transporte_fecha_salida || ""}
                    onChange={(e) => handleChange("transporte_fecha_salida", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Regreso</label>
                  <input
                    type="date"
                    value={formData.transporte_fecha_regreso || ""}
                    onChange={(e) => handleChange("transporte_fecha_regreso", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lugar de Ascenso / Carga</label>
                  <input
                    value={formData.transporte_lugar_ascenso || ""}
                    onChange={(e) => handleChange("transporte_lugar_ascenso", e.target.value)}
                    placeholder="Ej: Terminal Dellepiane / Terminal Retiro"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Horario de Presentación / Salida</label>
                  <input
                    value={formData.transporte_horario_salida || ""}
                    onChange={(e) => handleChange("transporte_horario_salida", e.target.value)}
                    placeholder="Ej: 21:30 hs (Presentación 21:00 hs)"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones de Transporte</label>
                  <textarea
                    rows={2}
                    value={formData.transporte_observaciones || ""}
                    onChange={(e) => handleChange("transporte_observaciones", e.target.value)}
                    placeholder="Notas o instrucciones adicionales..."
                    className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "hoteleria" && (
            <div className="space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer bg-blue-50/60 px-4 py-3 rounded-xl border border-blue-200">
                <input
                  type="checkbox"
                  checked={formData.incluye_hoteleria}
                  onChange={(e) => handleChange("incluye_hoteleria", e.target.checked)}
                  className="w-4 h-4 accent-[#1D5D8C] rounded"
                />
                <span className="text-sm font-bold text-[#1D5D8C]">Incluir Voucher de Hotelería en este documento</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nro Voucher Hotelería</label>
                  <input
                    value={formData.hoteleria_numero || ""}
                    onChange={(e) => handleChange("hoteleria_numero", e.target.value)}
                    placeholder="Ej: 33042"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Hotel *</label>
                  <input
                    value={formData.hoteleria_hotel_nombre || ""}
                    onChange={(e) => handleChange("hoteleria_hotel_nombre", e.target.value)}
                    placeholder="Ej: HOTEL NOVI 3*"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-semibold focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Dirección del Hotel</label>
                  <input
                    value={formData.hoteleria_direccion || ""}
                    onChange={(e) => handleChange("hoteleria_direccion", e.target.value)}
                    placeholder="Ej: Hipólito Yrigoyen 1311"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono del Hotel</label>
                  <input
                    value={formData.hoteleria_telefono || ""}
                    onChange={(e) => handleChange("hoteleria_telefono", e.target.value)}
                    placeholder="Ej: 0223 495-1778"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cantidad de Noches</label>
                  <input
                    type="number"
                    value={formData.hoteleria_noches ?? ""}
                    onChange={(e) => handleChange("hoteleria_noches", parseInt(e.target.value) || 0)}
                    placeholder="Ej: 2"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Régimen de Comidas</label>
                  <input
                    value={formData.hoteleria_regimen || ""}
                    onChange={(e) => handleChange("hoteleria_regimen", e.target.value)}
                    placeholder="Ej: Media Pensión / Desayuno / Todo Incluido"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Detalle de Alojamiento y Habitaciones</label>
                  <input
                    value={formData.hoteleria_detalle_habitaciones || ""}
                    onChange={(e) => handleChange("hoteleria_detalle_habitaciones", e.target.value)}
                    placeholder="Ej: 2 NOCHES DE ALOJAMIENTO EN 16 HABITACION DOBLE MAT STANDARD CON REGIMEN MEDIA PENSIÓN"
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-semibold focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Ingreso (Check-in)</label>
                  <input
                    type="date"
                    value={formData.hoteleria_fecha_ingreso || ""}
                    onChange={(e) => handleChange("hoteleria_fecha_ingreso", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Egreso (Check-out)</label>
                  <input
                    type="date"
                    value={formData.hoteleria_fecha_egreso || ""}
                    onChange={(e) => handleChange("hoteleria_fecha_egreso", e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones de Hotelería</label>
                  <textarea
                    rows={2}
                    value={formData.hoteleria_observaciones || ""}
                    onChange={(e) => handleChange("hoteleria_observaciones", e.target.value)}
                    placeholder="Requerimientos especiales, horarios de check-in..."
                    className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[#1D5D8C] focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pasajero / Titular / Grupo *</label>
                <input
                  value={formData.pasajero_titular || ""}
                  onChange={(e) => handleChange("pasajero_titular", e.target.value)}
                  placeholder=""
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-base font-bold text-gray-900 focus:border-[#1D5D8C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Detalle de Cantidad de Pasajeros</label>
                <input
                  value={formData.cant_pax_detalle || ""}
                  onChange={(e) => handleChange("cant_pax_detalle", e.target.value)}
                  placeholder=""
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-semibold focus:border-[#1D5D8C] focus:outline-none"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Voucher Page ──────────────────────────────────────────────────

export default function VoucherPage() {
  const params = useParams();
  const router = useRouter();
  const reservaId = params.id as string;

  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchApi(`/vouchers/by-reserva/${reservaId}`)
      .then((data) => {
        setVoucher(data);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Error al cargar voucher.");
      })
      .finally(() => setLoading(false));
  }, [reservaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-[#1D5D8C]" />
        <p className="text-sm font-medium">Generando vista de voucher...</p>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-bold mb-4">{error || "No se pudo cargar el voucher."}</p>
          <button
            onClick={() => router.push("/admin/bookings")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Reservas
          </button>
        </div>
      </div>
    );
  }

  const handleResetDefaults = async () => {
    if (!confirm("¿Deseás regenerar los datos del voucher con la información actual del paquete y reserva? Los campos modificados manualmente se sobrescribirán.")) return;
    setLoading(true);
    try {
      const data = await fetchApi(`/vouchers/by-reserva/${reservaId}/reset`, { method: "POST" });
      setVoucher(data);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al restablecer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Action Bar (oculto en impresión) */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white print:hidden sticky top-0 z-30 shadow-sm">
        <button
          onClick={() => router.push("/admin/bookings")}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Reservas
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-3.5 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
            title="Sincronizar con datos de la reserva y paquete"
          >
            Sincronizar datos
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#1D5D8C] text-[#1D5D8C] rounded-xl text-sm font-bold hover:bg-[#1D5D8C]/5 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar Voucher
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-[#1D5D8C] text-white rounded-xl text-sm font-bold hover:bg-[#164a70] transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Voucher
          </button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="p-4 sm:p-8 max-w-4xl mx-auto print:p-0 print:max-w-none bg-[#f4f6f8] print:bg-white min-h-screen space-y-8 print:space-y-6">

        {/* ════════════════════════════════════════════════════════════════════
            1. VOUCHER DE TRANSPORTE
           ════════════════════════════════════════════════════════════════════ */}
        {voucher.incluye_transporte && (
          <div className="bg-white border-2 border-gray-800 rounded-xl p-6 print:p-6 shadow-md print:shadow-none relative break-inside-avoid">
            {/* Header: Logo + Título */}
            <div className="flex items-center justify-between gap-6 pb-3">
              <div className="relative w-28 h-16 shrink-0">
                <Image
                  src="/resources/logo.png"
                  alt="Alexis EVT"
                  fill
                  sizes="112px"
                  className="object-contain object-left"
                  priority
                />
              </div>
              <div className="text-center flex-1 pr-10">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-wide uppercase">
                  Voucher de Transporte Nro {voucher.transporte_numero || "—"}
                </h1>
                <p className="text-lg font-black text-gray-600 tracking-wider">
                  RESERVA {voucher.reserva_id}
                </p>
              </div>
            </div>

            {/* Línea divisoria punteada */}
            <div className="border-b-2 border-dotted border-gray-800 my-2" />

            {/* Proveedor / Dirección / Coordinador */}
            <div className="space-y-1 py-1 text-sm">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">PROVEEDOR:</span>
                <span className="col-span-9 sm:col-span-10 font-bold text-gray-900 uppercase">
                  {voucher.transporte_proveedor || "A CONFIRMAR OK"}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">DIRECCION:</span>
                <span className="col-span-9 sm:col-span-10 text-gray-700">
                  {voucher.transporte_direccion || "-"}
                </span>
              </div>
              {voucher.transporte_coordinador && (
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">COORDINADOR:</span>
                  <span className="col-span-9 sm:col-span-10 font-bold text-[#1D5D8C]">
                    {voucher.transporte_coordinador}
                    {voucher.transporte_coordinador_telefono && (
                      <span className="ml-3 font-semibold text-gray-800">
                        (Tel: {voucher.transporte_coordinador_telefono})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Subtítulo centrado */}
            <p className="text-center text-xs font-black tracking-widest text-gray-700 uppercase my-2">
              FAVOR PROVEER LOS SIGUIENTES SERVICIOS
            </p>

            {/* Línea divisoria punteada */}
            <div className="border-b-2 border-dotted border-gray-800 my-2" />

            {/* Detalles del Servicio de Transporte */}
            <div className="space-y-1.5 py-1 text-sm">
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">PASAJERO:</span>
                <span className="col-span-5 sm:col-span-6 font-extrabold text-gray-900 uppercase text-base">
                  {voucher.pasajero_titular || "—"}
                </span>
                <span className="col-span-4 sm:col-span-4 text-right font-black text-gray-900">
                  CANT PAX: <span className="font-bold">{voucher.cant_pax_detalle || "—"}</span>
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">SERVICIO:</span>
                <span className="col-span-9 sm:col-span-10 font-semibold text-gray-800">
                  {voucher.transporte_servicio || "Bus Semicama"}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">TRAMO:</span>
                <span className="col-span-9 sm:col-span-10 font-black text-gray-900 uppercase tracking-wide">
                  {voucher.transporte_tramo || "—"}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">FECHA SALIDA:</span>
                <span className="col-span-9 sm:col-span-10 font-bold text-gray-900">
                  {fmtDate(voucher.transporte_fecha_salida)}
                  {voucher.transporte_horario_salida && (
                    <span className="ml-3 font-semibold text-gray-700">— Horario: {voucher.transporte_horario_salida}</span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">FECHA REGRESO:</span>
                <span className="col-span-9 sm:col-span-10 font-bold text-gray-900">
                  {fmtDate(voucher.transporte_fecha_regreso)}
                </span>
              </div>

              {voucher.transporte_lugar_ascenso && (
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">LUGAR ASCENSO:</span>
                  <span className="col-span-9 sm:col-span-10 font-bold text-[#1D5D8C]">
                    {voucher.transporte_lugar_ascenso}
                  </span>
                </div>
              )}

              {voucher.transporte_observaciones && (
                <div className="grid grid-cols-12 gap-2 pt-1">
                  <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">NOTAS:</span>
                  <span className="col-span-9 sm:col-span-10 text-xs text-gray-700 italic">
                    {voucher.transporte_observaciones}
                  </span>
                </div>
              )}
            </div>

            {/* Línea divisoria punteada */}
            <div className="border-b-2 border-dotted border-gray-800 my-2" />

            {/* Footer Voucher */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 pt-1 gap-1">
              <span className="font-bold text-gray-800 uppercase">Servicios a Facturar a ALEXIS EVT</span>
              <span className="text-gray-500 italic">Esta contratación está sujeta a las condiciones generales que el pasajero declara conocer.</span>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            2. VOUCHER DE HOTELERÍA
           ════════════════════════════════════════════════════════════════════ */}
        {voucher.incluye_hoteleria && (
          <div className="bg-white border-2 border-gray-800 rounded-xl p-6 print:p-6 shadow-md print:shadow-none relative break-inside-avoid">
            {/* Header: Logo + Título */}
            <div className="flex items-center justify-between gap-6 pb-3">
              <div className="relative w-28 h-16 shrink-0">
                <Image
                  src="/resources/logo.png"
                  alt="Alexis EVT"
                  fill
                  sizes="112px"
                  className="object-contain object-left"
                  priority
                />
              </div>
              <div className="text-center flex-1 pr-10">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-wide uppercase">
                  Voucher de Hoteleria Nro {voucher.hoteleria_numero || "—"}
                </h1>
                <p className="text-lg font-black text-gray-600 tracking-wider">
                  RESERVA {voucher.reserva_id}
                </p>
              </div>
            </div>

            {/* Línea divisoria punteada */}
            <div className="border-b-2 border-dotted border-gray-800 my-2" />

            {/* Hotel / Dirección / Teléfono */}
            <div className="space-y-1 py-1 text-sm">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">HOTEL:</span>
                <span className="col-span-9 sm:col-span-10 font-bold text-gray-900 uppercase">
                  {voucher.hoteleria_hotel_nombre || "A CONFIRMAR"}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">DIRECCION:</span>
                <span className="col-span-9 sm:col-span-10 text-gray-700">
                  {voucher.hoteleria_direccion || "-"}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">TELEFONO:</span>
                <span className="col-span-9 sm:col-span-10 text-gray-700 font-medium">
                  {voucher.hoteleria_telefono || "-"}
                </span>
              </div>
            </div>

            {/* Subtítulo centrado */}
            <p className="text-center text-xs font-black tracking-widest text-gray-700 uppercase my-2">
              FAVOR PROVEER LOS SIGUIENTES SERVICIOS
            </p>

            {/* Línea divisoria punteada */}
            <div className="border-b-2 border-dotted border-gray-800 my-2" />

            {/* Detalle Destacado de Alojamiento */}
            <div className="py-2">
              <p className="text-center text-sm sm:text-base font-black text-gray-900 uppercase tracking-wide px-4 leading-snug">
                {voucher.hoteleria_detalle_habitaciones ||
                  `${voucher.hoteleria_noches || 0} NOCHES DE ALOJAMIENTO CON REGIMEN ${voucher.hoteleria_regimen || "MEDIA PENSIÓN"}`}
              </p>
            </div>

            {/* Pasajero / Ingreso / Egreso */}
            <div className="space-y-1.5 py-1 text-sm border-t border-dotted border-gray-400 mt-1">
              <div className="grid grid-cols-12 gap-2 items-baseline pt-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">PASAJERO:</span>
                <span className="col-span-9 sm:col-span-10 font-extrabold text-gray-900 uppercase text-base">
                  {voucher.pasajero_titular || "—"} {voucher.cant_pax_detalle ? `— (${voucher.cant_pax_detalle})` : ""}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">INGRESO:</span>
                <span className="col-span-9 sm:col-span-10 font-bold text-gray-900">
                  {fmtDate(voucher.hoteleria_fecha_ingreso)}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">EGRESO:</span>
                <span className="col-span-9 sm:col-span-10 font-bold text-gray-900">
                  {fmtDate(voucher.hoteleria_fecha_egreso)}
                </span>
              </div>

              {voucher.hoteleria_observaciones && (
                <div className="grid grid-cols-12 gap-2 pt-1">
                  <span className="col-span-3 sm:col-span-2 font-black text-gray-900 uppercase">NOTAS:</span>
                  <span className="col-span-9 sm:col-span-10 text-xs text-gray-700 italic">
                    {voucher.hoteleria_observaciones}
                  </span>
                </div>
              )}
            </div>

            {/* Línea divisoria punteada */}
            <div className="border-b-2 border-dotted border-gray-800 my-2" />

            {/* Footer Voucher */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 pt-1 gap-1">
              <span className="font-bold text-gray-800 uppercase">Servicios a Facturar a ALEXIS EVT</span>
              <span className="text-gray-500 italic">Esta contratación está sujeta a las condiciones generales que el pasajero declara conocer.</span>
            </div>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {showEdit && voucher && (
        <EditVoucherModal
          voucher={voucher}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setVoucher(updated)}
        />
      )}
    </>
  );
}
