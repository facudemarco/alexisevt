"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Plus, Eye, Trash2, Search, Receipt } from "lucide-react";

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
  comision_monto: number;
  total_pagos: number;
  saldo: number;
  reserva_resumen: ReservaResumen | null;
}

// ── Reserva para el selector de nueva liquidación ─────────────────────
interface ReservaParaSelector {
  id: number;
  cliente_nombre: string | null;
  precio_total: number;
  paquete?: { titulo_subtitulo: string; gastos_reserva: number; precio_base: number; destino?: { nombre: string } } | null;
  estado_reserva: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// ── Nueva Liquidación Modal ────────────────────────────────────────────
function NuevaLiquidacionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [reservas, setReservas] = useState<ReservaParaSelector[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedReserva, setSelectedReserva] = useState<ReservaParaSelector | null>(null);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    comision_porcentaje: 15,
    notas: "",
  });
  const [items, setItems] = useState<
    { descripcion: string; precio: string; cant_pax: number; aplica_comision: boolean }[]
  >([]);

  useEffect(() => {
    fetchApi("/bookings/?limit=500")
      .then((data: ReservaParaSelector[]) => {
        // Only show approved bookings
        setReservas(data.filter((r) => r.estado_reserva === "Aprobada"));
      })
      .catch(() => setError("No se pudieron cargar las reservas"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectReserva = (r: ReservaParaSelector) => {
    setSelectedReserva(r);
    const preItems = [];
    if (r.paquete) {
      const pax = 1;
      preItems.push({
        descripcion: "Precio de venta",
        precio: String(r.paquete.precio_base || r.precio_total),
        cant_pax: pax,
        aplica_comision: true,
      });
      if (r.paquete.gastos_reserva && Number(r.paquete.gastos_reserva) > 0) {
        preItems.push({
          descripcion: "Gastos de reserva",
          precio: String(r.paquete.gastos_reserva),
          cant_pax: pax,
          aplica_comision: false,
        });
      }
    }
    setItems(
      preItems.length
        ? preItems
        : [{ descripcion: "Precio de venta", precio: String(r.precio_total), cant_pax: 1, aplica_comision: true }]
    );
  };

  const addItem = () =>
    setItems((prev) => [...prev, { descripcion: "", precio: "0", cant_pax: 1, aplica_comision: true }]);

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (
    idx: number,
    field: keyof (typeof items)[0],
    value: string | number | boolean
  ) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const handleSave = async () => {
    if (!selectedReserva) return setError("Seleccioná una reserva");
    setSaving(true);
    setError("");
    try {
      await fetchApi("/liquidaciones/", {
        method: "POST",
        body: JSON.stringify({
          reserva_id: selectedReserva.id,
          fecha: form.fecha,
          comision_porcentaje: form.comision_porcentaje,
          notas: form.notas || null,
          items: items.map((it, idx) => ({
            orden: idx + 1,
            descripcion: it.descripcion,
            precio: parseFloat(it.precio) || 0,
            cant_pax: it.cant_pax,
            aplica_comision: it.aplica_comision,
          })),
        }),
      });
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear liquidación");
    } finally {
      setSaving(false);
    }
  };

  const filtered = reservas.filter(
    (r) =>
      r.id.toString().includes(search) ||
      r.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      r.paquete?.destino?.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">Nueva Liquidación</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

          {/* Reserva selector */}
          {!selectedReserva ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccioná una reserva aprobada</label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por FILE#, pasajero o destino…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5D8C]/30"
                />
              </div>
              {loading ? (
                <p className="text-sm text-gray-500">Cargando reservas…</p>
              ) : (
                <div className="border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
                  {filtered.length === 0 && (
                    <p className="text-sm text-gray-500 p-4 text-center">Sin reservas aprobadas disponibles</p>
                  )}
                  {filtered.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectReserva(r)}
                      className="w-full text-left px-4 py-3 hover:bg-[#1D5D8C]/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#1D5D8C] text-sm">FILE #{r.id.toString().padStart(3, "0")}</span>
                          <span className="ml-2 text-sm text-gray-700">{r.cliente_nombre || "Sin nombre"}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">{r.paquete?.destino?.nombre}</div>
                          <div className="text-sm font-medium">{fmt(r.precio_total)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Selected reserva header */}
              <div className="flex items-center justify-between bg-[#1D5D8C]/5 rounded-lg p-3">
                <div>
                  <span className="font-bold text-[#1D5D8C]">FILE #{selectedReserva.id.toString().padStart(3, "0")}</span>
                  <span className="ml-2 text-sm text-gray-700">{selectedReserva.cliente_nombre}</span>
                  {selectedReserva.paquete?.destino?.nombre && (
                    <span className="ml-2 text-xs text-gray-500">— {selectedReserva.paquete.destino.nombre}</span>
                  )}
                </div>
                <button onClick={() => setSelectedReserva(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Cambiar
                </button>
              </div>

              {/* Header fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5D8C]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Comisión %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={form.comision_porcentaje}
                    onChange={(e) => setForm((f) => ({ ...f, comision_porcentaje: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5D8C]/30"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Ítems</label>
                  <button onClick={addItem} className="flex items-center gap-1 text-xs text-[#1D5D8C] hover:underline">
                    <Plus className="w-3 h-3" /> Agregar ítem
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#1D5D8C] text-white">
                      <tr>
                        <th className="text-left px-3 py-2">Descripción</th>
                        <th className="text-right px-3 py-2">Precio</th>
                        <th className="text-right px-3 py-2">Pax</th>
                        <th className="text-center px-3 py-2">Comisión</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((it, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={it.descripcion}
                              onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                              className="w-full border-b border-gray-200 focus:outline-none focus:border-[#1D5D8C] bg-transparent text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={it.precio}
                              onChange={(e) => updateItem(idx, "precio", e.target.value)}
                              className="w-24 text-right border-b border-gray-200 focus:outline-none focus:border-[#1D5D8C] bg-transparent text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={it.cant_pax}
                              onChange={(e) => updateItem(idx, "cant_pax", parseInt(e.target.value) || 1)}
                              className="w-12 text-right border-b border-gray-200 focus:outline-none focus:border-[#1D5D8C] bg-transparent text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={it.aplica_comision}
                              onChange={(e) => updateItem(idx, "aplica_comision", e.target.checked)}
                              className="rounded"
                            />
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

              {/* Notas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  rows={2}
                  value={form.notas}
                  onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5D8C]/30 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {selectedReserva && (
          <div className="flex justify-end gap-3 p-5 border-t">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#1D5D8C] text-white rounded-lg text-sm font-semibold hover:bg-[#174d78] disabled:opacity-50 transition-colors"
            >
              {saving ? "Creando…" : "Crear Liquidación"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function LiquidacionesPage() {
  const router = useRouter();
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchApi("/liquidaciones/")
      .then(setLiquidaciones)
      .catch(() => setError("No se pudieron cargar las liquidaciones"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta liquidación? Esta acción no se puede deshacer.")) return;
    setDeletingId(id);
    try {
      await fetchApi(`/liquidaciones/${id}`, { method: "DELETE" });
      setLiquidaciones((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert("No se pudo eliminar la liquidación");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = liquidaciones.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.reserva_id.toString().includes(q) ||
      l.reserva_resumen?.cliente_nombre?.toLowerCase().includes(q) ||
      l.reserva_resumen?.destino_nombre?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Receipt className="w-6 h-6 text-[#1D5D8C]" />
          <h1 className="text-2xl font-bold text-gray-900">Liquidaciones</h1>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-[#1D5D8C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#174d78] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Liquidación
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por FILE#, pasajero o destino…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5D8C]/30"
        />
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
          <Receipt className="w-10 h-10 opacity-30" />
          <p className="text-sm">{search ? "Sin resultados" : "No hay liquidaciones todavía"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#1D5D8C] text-white">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">FILE #</th>
                <th className="text-left px-4 py-3 font-semibold">Pasajero</th>
                <th className="text-left px-4 py-3 font-semibold">Destino</th>
                <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                <th className="text-right px-4 py-3 font-semibold">Subtotal</th>
                <th className="text-right px-4 py-3 font-semibold">Comisión</th>
                <th className="text-right px-4 py-3 font-semibold">Pagos</th>
                <th className="text-right px-4 py-3 font-semibold">Saldo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-[#1D5D8C]/5 transition-colors">
                  <td className="px-4 py-3 font-bold text-[#1D5D8C]">
                    #{l.reserva_id.toString().padStart(3, "0")}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{l.reserva_resumen?.cliente_nombre || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{l.reserva_resumen?.destino_nombre || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(l.fecha + "T00:00:00").toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800">{fmt(l.subtotal)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">−{fmt(l.comision_monto)}</td>
                  <td className="px-4 py-3 text-right text-green-600">−{fmt(l.total_pagos)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-bold ${
                        l.saldo <= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {fmt(l.saldo)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => router.push(`/admin/liquidaciones/${l.id}`)}
                        className="p-1.5 text-[#1D5D8C] hover:bg-[#1D5D8C]/10 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
                        disabled={deletingId === l.id}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NuevaLiquidacionModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
    </div>
  );
}
