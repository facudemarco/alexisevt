"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { fetchApi } from "@/lib/api";
import {
  ArrowLeft, Plus, Trash2, Pencil, Save, X, Printer,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
interface ReservaResumen {
  id: number;
  cliente_nombre: string | null;
  precio_total: number;
  paquete_id: number;
  paquete_titulo: string | null;
  destino_nombre: string | null;
  fecha_salida: string | null;
}

interface LiquidacionItem {
  id: number;
  orden: number;
  descripcion: string;
  precio: number;
  cant_pax: number;
  aplica_comision: boolean;
  total: number;
}

interface Pago {
  id: number;
  fecha: string;
  monto: number;
  descripcion: string | null;
  liquidacion_id: number;
}

interface Liquidacion {
  id: number;
  reserva_id: number;
  fecha: string;
  comision_porcentaje: number;
  notas: string | null;
  created_at: string;
  items: LiquidacionItem[];
  pagos: Pago[];
  subtotal: number;
  base_comision: number;
  comision_monto: number;
  total_pagos: number;
  saldo: number;
  reserva_resumen: ReservaResumen | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// ── Add Pago Form (below pagos table) ─────────────────────────────────
function AddPagoForm({
  liquidacionId,
  onAdded,
}: {
  liquidacionId: number;
  onAdded: (pago: Pago) => void;
}) {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [monto, setMonto] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!monto || parseFloat(monto) <= 0) return setError("Ingresá un monto válido");
    setSaving(true);
    setError("");
    try {
      const pago: Pago = await fetchApi(`/liquidaciones/${liquidacionId}/pagos`, {
        method: "POST",
        body: JSON.stringify({ fecha, monto: parseFloat(monto), descripcion: desc || null }),
      });
      onAdded(pago);
      setMonto("");
      setDesc("");
      setFecha(new Date().toISOString().split("T")[0]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="print:hidden bg-blue-50 border-t-2 border-[#1D5D8C]/20 px-4 py-4 mb-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 font-medium w-12 shrink-0">Nuevo</span>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-40 shrink-0 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1D5D8C]"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="flex-1 min-w-0 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1D5D8C]"
          />
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <input
            type="number"
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-32 text-right border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1D5D8C] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {error && <p className="text-red-500 text-[10px] w-32 text-right leading-tight mt-0.5">{error}</p>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 flex items-center justify-center gap-1.5 bg-[#1D5D8C] text-white px-6 py-2 h-10 rounded text-sm font-semibold hover:bg-[#174d78] disabled:opacity-50 transition-colors"
        >
          {saving ? "…" : <><Plus className="w-4 h-4" /> Agregar</>}
        </button>
      </div>
    </div>
  );
}

// ── Edit Items Modal ───────────────────────────────────────────────────
function EditItemsModal({
  liquidacion,
  onClose,
  onSaved,
}: {
  liquidacion: Liquidacion;
  onClose: () => void;
  onSaved: (liq: Liquidacion) => void;
}) {
  const [items, setItems] = useState(
    liquidacion.items.map((it) => ({
      orden: it.orden,
      descripcion: it.descripcion,
      precio: String(it.precio),
      cant_pax: it.cant_pax,
      aplica_comision: it.aplica_comision,
    }))
  );
  const [comision, setComision] = useState(String(liquidacion.comision_porcentaje));
  const [fecha, setFecha] = useState(liquidacion.fecha);
  const [notas, setNotas] = useState(liquidacion.notas || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addItem = () =>
    setItems((prev) => [...prev, { orden: prev.length + 1, descripcion: "", precio: "0", cant_pax: 1, aplica_comision: true }]);

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, value: string | number | boolean) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated: Liquidacion = await fetchApi(`/liquidaciones/${liquidacion.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fecha,
          comision_porcentaje: parseFloat(comision) || 0,
          notas: notas || null,
          items: items.map((it, idx) => ({
            orden: idx + 1,
            descripcion: it.descripcion,
            precio: parseFloat(it.precio) || 0,
            cant_pax: it.cant_pax,
            aplica_comision: it.aplica_comision,
          })),
        }),
      });
      onSaved(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Editar Liquidación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5D8C]/30" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Comisión %</label>
              <input type="number" min="0" max="100" step="0.5" value={comision}
                onChange={(e) => setComision(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5D8C]/30" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Ítems</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-[#1D5D8C] hover:underline">
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#1D5D8C] text-white text-xs">
                  <tr>
                    <th className="text-left px-3 py-2">Descripción</th>
                    <th className="text-right px-3 py-2">Precio</th>
                    <th className="text-right px-3 py-2">Pax</th>
                    <th className="text-center px-3 py-2">Com.</th>
                    <th className="px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2">
                        <input type="text" value={it.descripcion}
                          onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                          className="w-full border-b border-transparent focus:border-[#1D5D8C] focus:outline-none bg-transparent text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={it.precio}
                          onChange={(e) => updateItem(idx, "precio", e.target.value)}
                          className="w-24 text-right border-b border-transparent focus:border-[#1D5D8C] focus:outline-none bg-transparent text-sm" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" value={it.cant_pax}
                          onChange={(e) => updateItem(idx, "cant_pax", parseInt(e.target.value) || 1)}
                          className="w-10 text-right border-b border-transparent focus:border-[#1D5D8C] focus:outline-none bg-transparent text-sm" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={it.aplica_comision}
                          onChange={(e) => updateItem(idx, "aplica_comision", e.target.checked)}
                          className="rounded" />
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notas</label>
            <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5D8C]/30 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#1D5D8C] text-white rounded-lg text-sm font-semibold hover:bg-[#174d78] disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" />
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Detail Page ───────────────────────────────────────────────────
export default function LiquidacionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [liq, setLiq] = useState<Liquidacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [deletingPagoId, setDeletingPagoId] = useState<number | null>(null);

  const load = useCallback(() => {
    fetchApi(`/liquidaciones/${params.id}`)
      .then(setLiq)
      .catch(() => setError("No se pudo cargar la liquidación"))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const handleDeletePago = async (pagoId: number) => {
    if (!liq) return;
    setDeletingPagoId(pagoId);
    try {
      await fetchApi(`/liquidaciones/${liq.id}/pagos/${pagoId}`, { method: "DELETE" });
      setLiq((prev) => prev ? { ...prev, pagos: prev.pagos.filter((p) => p.id !== pagoId) } : prev);
      // Refresh to get updated computed fields
      load();
    } catch {
      alert("No se pudo eliminar el pago");
    } finally {
      setDeletingPagoId(null);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando…</div>;
  if (error || !liq) return (
    <div className="p-8">
      <p className="text-red-600 mb-4">{error || "Liquidación no encontrada"}</p>
      <button onClick={() => router.back()} className="text-[#1D5D8C] hover:underline text-sm">← Volver</button>
    </div>
  );

  const r = liq.reserva_resumen;
  const fileNum = liq.reserva_id.toString().padStart(3, "0");

  // Rows for pagos table: show at least 4 rows
  const pagoRows = [...liq.pagos];
  while (pagoRows.length < 4) {
    pagoRows.push({ id: -pagoRows.length, fecha: "", monto: 0, descripcion: null, liquidacion_id: liq.id });
  }

  return (
    <>
      {/* Action bar (no-print) */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 print:hidden">
        <button
          onClick={() => router.push("/admin/liquidaciones")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Liquidaciones
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#1D5D8C] text-[#1D5D8C] rounded-lg text-sm font-semibold hover:bg-[#1D5D8C]/5 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D5D8C] text-white rounded-lg text-sm font-semibold hover:bg-[#174d78] transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Liquidación Document */}
      {/* Liquidación Document */}
      <div id="print-root" ref={printRef} className="p-0 sm:p-10 max-w-4xl mx-auto print:p-0 print:max-w-none bg-[#f2f2f2] print:bg-white min-h-screen print:min-h-0 flex flex-col print:block print:h-auto print:overflow-hidden">
        
        <div className="p-6 md:p-10 flex-1 print:p-4 print:pb-0">
          {/* ── Document Header ── */}
          <div className="flex items-start justify-between mb-8">
            {/* Title with slant effect */}
            <div className="relative">
              <div 
                className="bg-[#1D5D8C] text-white px-10 py-5 pr-20"
                style={{ clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0% 100%)' }}
              >
                <h1 className="text-4xl font-bold tracking-widest uppercase">Liquidación</h1>
              </div>
              <div className="absolute left-0 bottom-0 w-2 h-full bg-black/20 -z-10 -ml-2"></div>
            </div>
            
            {/* Logo */}
            <div className="relative w-28 h-28">
              <Image src="/resources/logo.png" alt="Alexis EVT" fill sizes="112px" className="object-contain" />
            </div>
          </div>

          {/* ── Meta row: Pasajero + FILE / Destino / Fecha ── */}
          <div className="grid grid-cols-2 gap-10 mb-8 items-end">
            <div className="pl-4">
              <span className="text-base text-gray-600 block mb-1">Pasajeros:</span>
              <p className="font-extrabold text-gray-900 text-2xl uppercase leading-tight">
                {r?.cliente_nombre || "—"}
              </p>
            </div>
            <div className="space-y-1.5 text-base">
              <div className="flex justify-end gap-10">
                <span className="font-bold text-gray-900 w-20 text-right">FILE #</span>
                <span className="font-semibold text-gray-700 w-32">{fileNum}</span>
              </div>
              <div className="flex justify-end gap-10">
                <span className="font-bold text-gray-900 w-20 text-right">Destino</span>
                <span className="font-semibold text-gray-700 w-32">{r?.destino_nombre || "—"}</span>
              </div>
              <div className="flex justify-end gap-10">
                <span className="font-bold text-gray-900 w-20 text-right">Fecha</span>
                <span className="font-semibold text-gray-700 w-32">
                  {new Date(liq.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* ── Items Table ── */}
          <div className="mb-10 overflow-hidden rounded-sm">
            <table className="w-full text-base border-collapse">
              <thead>
                <tr className="bg-[#1D5D8C] text-white">
                  <th className="text-left px-5 py-3 font-bold w-16">Items</th>
                  <th className="text-left px-5 py-3 font-bold">Descripción</th>
                  <th className="text-right px-5 py-3 font-bold">Precio</th>
                  <th className="text-right px-5 py-3 font-bold">Cant Pax</th>
                  <th className="text-right px-5 py-3 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {liq.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-200/50"}>
                    <td className="px-5 py-4 text-center font-semibold text-gray-800">{idx + 1}</td>
                    <td className="px-5 py-4 text-gray-900 font-medium">
                      {item.descripcion}
                      {!item.aplica_comision && (
                        <span className="ml-2 text-xs text-gray-400 italic">(sin comisión)</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-800 font-medium">{fmt(item.precio)}</td>
                    <td className="px-5 py-4 text-right text-gray-800 font-medium">{item.cant_pax}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="h-0.5 bg-gray-400 w-full mt-1 opacity-50"></div>
          </div>

          {/* ── Pagos Table ── */}
          <div className="mb-10 overflow-hidden rounded-sm">
            <table className="w-full text-base border-collapse">
              <thead>
                <tr className="bg-[#1D5D8C] text-white">
                  <th className="text-left px-5 py-3 font-bold w-20">Pagos</th>
                  <th className="text-left px-5 py-3 font-bold">Fecha</th>
                  <th className="text-left px-5 py-3 font-bold">Descripción</th>
                  <th className="text-right px-5 py-3 font-bold">Monto</th>
                  <th className="w-8 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {pagoRows.map((pago, idx) => (
                  <tr key={pago.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-200/50"}>
                    <td className="px-5 py-3.5 text-center font-semibold text-gray-800">{idx + 1}</td>
                    <td className="px-5 py-3.5 text-gray-800 font-medium">
                      {pago.fecha
                        ? new Date(pago.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : ""}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{pago.descripcion || ""}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                      {pago.monto > 0 ? fmt(pago.monto) : ""}
                    </td>
                    <td className="px-2 py-3.5 print:hidden">
                      {pago.id > 0 && (
                        <button
                          onClick={() => handleDeletePago(pago.id)}
                          disabled={deletingPagoId === pago.id}
                          className="text-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Eliminar pago"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AddPagoForm
              liquidacionId={liq.id}
              onAdded={(pago) => {
                setLiq((prev) => prev ? { ...prev, pagos: [...prev.pagos, pago] } : prev);
                load();
              }}
            />
          </div>

          {/* Notas */}
          {liq.notas && (
            <div className="mt-8 p-4 bg-white/50 rounded border border-gray-300 border-dashed">
              <p className="text-base text-gray-700"><span className="font-extrabold uppercase text-xs tracking-wider mr-2">Notas:</span> {liq.notas}</p>
            </div>
          )}
        </div>

        {/* ── Document Footer ── */}
        <div className="mt-auto print:mt-4">
          <div className="flex justify-between items-end px-10 pb-10 print:px-6 print:pb-6 print:gap-4">
            {/* Footer Logo Box */}
            <div className="bg-[#1D5D8C] p-4 relative w-48 h-28 print:w-40 print:h-24 flex items-center justify-center shrink-0">
              <Image src="/resources/logo.png" alt="Alexis EVT" width={70} height={70} className="object-contain" />
            </div>
          
            {/* Totals Summary */}
            <div className="space-y-1 flex-1 max-w-xs">
              <div className="flex justify-between gap-10 text-lg print:text-base">
                <span className="text-gray-700 font-medium">Subtotal :</span>
                <span className="font-extrabold text-gray-900 text-right">{fmt(liq.subtotal).replace('$', '$ ')}.-</span>
              </div>
              <div className="flex justify-between gap-10 text-lg print:text-base">
                <span className="text-gray-700 font-medium">Comisión {liq.comision_porcentaje}%:</span>
                <span className="font-extrabold text-gray-900 text-right">{fmt(liq.comision_monto).replace('$', '$ ')}.-</span>
              </div>
              <div className="flex justify-between gap-10 text-lg print:text-base">
                <span className="text-gray-700 font-medium">Pagos</span>
                <span className="font-extrabold text-gray-900 text-right">{fmt(liq.total_pagos).replace('$', '$ ')}.-</span>
              </div>
              <div className="border-t-2 border-gray-400 mt-2 pt-2">
                <div className="flex justify-between gap-10 text-2xl print:text-xl">
                  <span className="font-black text-gray-900 uppercase">SALDO TOTAL</span>
                  <span className="font-black text-gray-900 text-right">
                    {fmt(liq.saldo).replace('$', '$ ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Black Bar */}
          <div className="h-10 bg-black w-full"></div>
        </div>
      </div>

      {showEdit && (
        <EditItemsModal
          liquidacion={liq}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setLiq(updated);
            setShowEdit(false);
          }}
        />
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          html, body {
            height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body {
            visibility: hidden;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-root, #print-root * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          [class*="print:hidden"] { display: none !important; }
          @page {
            margin: 0;
            size: A4 portrait;
          }
          #print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            background: white !important;
            transform: scale(0.9) !important;
            transform-origin: top center !important;
          }
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        }
      `}</style>
    </>
  );
}
