"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Plus, Minus, Loader2, ChevronDown, Bus, Hotel, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface ConfigItem { id: number; nombre: string; }
interface Transporte { id: number; nombre: string; tipo?: string; }
interface Hotel { id: number; nombre: string; }
interface PuntoAscenso { id: number; nombre_lugar: string; }
interface Categoria { id: number; nombre: string; slug?: string; }

interface HotelDetalle {
  hotel_id: string;
  regimen: string;
  cantidad_noches: string;
  precio: string;
}

interface AdicionalPrecio {
  nombre: string;
  valor: string;
}

interface FormState {
  destino_id: string;
  categoria_id: string;
  imagen_url: string;
  tipo_salidas: "DIARIAS" | "FECHA_ESPECIFICA";
  fecha_salida: string;
  fecha_regreso: string;
  duracion_dias: string;
  duracion_noches: string;
  titulo_subtitulo: string;
  moneda: string;
  precio_base: string;          // usado solo cuando alojamiento_activo = false
  adicionales_precio: AdicionalPrecio[];
  adicionales: string[];
  transporte_activo: boolean;
  transporte_id: string;
  transporte_tipo: string;
  horario_salida: string;
  horario_regreso: string;
  punto_ascenso_ids: number[];
  alojamiento_activo: boolean;
  hotel_detalles: HotelDetalle[];
  include_transfer: boolean;
  include_asistencia_medica: boolean;
}

const EMPTY_HOTEL: HotelDetalle = { hotel_id: "", regimen: "", cantidad_noches: "", precio: "" };
const EMPTY_ADICIONAL_PRECIO: AdicionalPrecio = { nombre: "", valor: "" };

const EMPTY: FormState = {
  destino_id: "", categoria_id: "", imagen_url: "",
  tipo_salidas: "FECHA_ESPECIFICA",
  fecha_salida: "", fecha_regreso: "",
  duracion_dias: "", duracion_noches: "",
  titulo_subtitulo: "", moneda: "ARS",
  precio_base: "",
  adicionales_precio: [],
  adicionales: [""],
  transporte_activo: false, transporte_id: "",
  transporte_tipo: "", horario_salida: "", horario_regreso: "",
  punto_ascenso_ids: [],
  alojamiento_activo: false, hotel_detalles: [{ ...EMPTY_HOTEL }],
  include_transfer: false, include_asistencia_medica: false,
};

// ── Helpers UI ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold text-gray-700 mb-1.5 tracking-wide">
      {children}
    </label>
  );
}

function Select({ value, onChange, children, className }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 pr-10 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium appearance-none focus:outline-none focus:border-[#1D5D8C] transition-colors"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, className }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium",
        "placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors",
        className
      )}
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void; }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0",
        checked ? "bg-[#1D5D8C]" : "bg-gray-300"
      )}
    >
      <span className={cn(
        "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  );
}

function SectionCard({ icon, title, activo, onToggle, children }: {
  icon: React.ReactNode; title: string; activo: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <div className={cn(
      "rounded-2xl border-2 overflow-hidden transition-colors",
      activo ? "border-[#1D5D8C]" : "border-gray-200"
    )}>
      <div className={cn(
        "flex items-center justify-between px-5 py-4 transition-colors",
        activo ? "bg-[#1D5D8C]" : "bg-gray-50"
      )}>
        <div className={cn("flex items-center gap-3 font-bold text-base", activo ? "text-white" : "text-gray-600")}>
          {icon}
          {title}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-semibold", activo ? "text-white/80" : "text-gray-400")}>
            {activo ? "Activado" : "Desactivado"}
          </span>
          <Toggle checked={activo} onChange={onToggle} />
        </div>
      </div>
      {activo && children && (
        <div className="p-5 bg-white space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

interface Props {
  initialData?: Partial<FormState>;
  packageId?: number;
}

export function PackageForm({ initialData, packageId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);

  const [destinos, setDestinos] = useState<ConfigItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [hoteles, setHoteles] = useState<Hotel[]>([]);
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [puntosAscenso, setPuntosAscenso] = useState<PuntoAscenso[]>([]);

  useEffect(() => {
    Promise.all([
      fetchApi("/config/destinos/"),
      fetchApi("/config/categorias/"),
      fetchApi("/config/hoteles/"),
      fetchApi("/config/transportes/"),
      fetchApi("/config/puntos_ascenso/"),
    ]).then(([d, c, h, t, p]) => {
      setDestinos(d); setCategorias(c); setHoteles(h);
      setTransportes(t); setPuntosAscenso(p);
    }).catch(() => {});
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addAdicional = () => set("adicionales", [...form.adicionales, ""]);
  const removeAdicional = (i: number) => set("adicionales", form.adicionales.filter((_, idx) => idx !== i));
  const setAdicional = (i: number, v: string) => {
    const arr = [...form.adicionales]; arr[i] = v; set("adicionales", arr);
  };

  const addHotel = () => set("hotel_detalles", [...form.hotel_detalles, { ...EMPTY_HOTEL }]);
  const removeHotel = (i: number) => set("hotel_detalles", form.hotel_detalles.filter((_, idx) => idx !== i));
  const setHotelField = <K extends keyof HotelDetalle>(i: number, key: K, v: HotelDetalle[K]) => {
    const arr = [...form.hotel_detalles];
    arr[i] = { ...arr[i], [key]: v };
    set("hotel_detalles", arr);
  };

  const addAdicionalPrecio = () => set("adicionales_precio", [...form.adicionales_precio, { ...EMPTY_ADICIONAL_PRECIO }]);
  const removeAdicionalPrecio = (i: number) => set("adicionales_precio", form.adicionales_precio.filter((_, idx) => idx !== i));
  const setAdicionalPrecioField = (i: number, key: keyof AdicionalPrecio, v: string) => {
    const arr = [...form.adicionales_precio];
    arr[i] = { ...arr[i], [key]: v };
    set("adicionales_precio", arr);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // fetchApi adjunta el Bearer token automáticamente y maneja FormData sin Content-Type
      const data = await fetchApi("/uploads/image", { method: "POST", body: fd });
      set("imagen_url", data.url);
    } catch (e: any) {
      setError(e.message || "Error al subir la imagen.");
    } finally {
      setUploadingImg(false);
    }
  };

  const togglePunto = (id: number) => {
    const ids = form.punto_ascenso_ids.includes(id)
      ? form.punto_ascenso_ids.filter((x) => x !== id)
      : [...form.punto_ascenso_ids, id];
    set("punto_ascenso_ids", ids);
  };

  const handleSubmit = async (esDraft: boolean) => {
    setError("");
    if (!form.destino_id || !form.categoria_id) {
      setError("Destino y período son obligatorios.");
      return;
    }
    const hotelesValidos = form.alojamiento_activo
      ? form.hotel_detalles.filter((h) => h.hotel_id !== "")
      : [];
    if (form.alojamiento_activo && hotelesValidos.length === 0) {
      setError("Debés seleccionar al menos un hotel.");
      return;
    }
    if (!form.alojamiento_activo && !form.precio_base) {
      setError("El precio del paquete es obligatorio cuando no hay alojamiento.");
      return;
    }

    // precio_base = mínimo de hoteles (si hay) o precio manual
    const preciosHoteles = hotelesValidos.map((h) => Number(h.precio)).filter((p) => p > 0);
    const precioBase = form.alojamiento_activo && preciosHoteles.length > 0
      ? Math.min(...preciosHoteles)
      : Number(form.precio_base) || 0;

    // precio_adicional = suma de todos los adicionales de precio
    const precioAdicional = form.adicionales_precio
      .filter((a) => a.valor)
      .reduce((sum, a) => sum + (Number(a.valor) || 0), 0);

    setLoading(true);
    try {
      const body = {
        destino_id: Number(form.destino_id),
        categoria_id: Number(form.categoria_id),
        titulo_subtitulo: form.titulo_subtitulo,
        fecha_salida: form.tipo_salidas === "FECHA_ESPECIFICA" && form.fecha_salida ? form.fecha_salida : null,
        fecha_regreso: form.tipo_salidas === "FECHA_ESPECIFICA" && form.fecha_regreso ? form.fecha_regreso : null,
        duracion_dias: Number(form.duracion_dias) || 0,
        duracion_noches: Number(form.duracion_noches) || 0,
        precio_base: precioBase,
        precio_adicional: precioAdicional,
        moneda: form.moneda,
        tipo_salidas: form.tipo_salidas,
        imagen_url: form.imagen_url || null,
        adicionales: form.adicionales.filter((a) => a.trim() !== ""),
        adicionales_json: form.adicionales_precio.length > 0
          ? { adicionales_precio: form.adicionales_precio.filter((a) => a.nombre || a.valor) }
          : null,
        include_transfer: form.include_transfer,
        include_asistencia_medica: form.include_asistencia_medica,
        es_borrador: esDraft,
        estado: true,
        hotel_detalles: hotelesValidos.map((h) => ({
          hotel_id: Number(h.hotel_id),
          regimen: h.regimen || null,
          cantidad_noches: Number(h.cantidad_noches) || null,
          precio: h.precio ? Number(h.precio) : null,
        })),
        transporte_ids: form.transporte_activo && form.transporte_id ? [Number(form.transporte_id)] : [],
        punto_ascenso_ids: form.punto_ascenso_ids,
        servicio_ids: [],
      };

      if (packageId) {
        await fetchApi(`/packages/${packageId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await fetchApi("/packages/", { method: "POST", body: JSON.stringify(body) });
      }
      router.push("/admin/packages");
    } catch (e: any) {
      setError(e.message || "Error al guardar el paquete.");
    } finally {
      setLoading(false);
    }
  };

  const tiposTransporte = ["Bus Semicama", "Bus Cama", "Aéreo", "Minibús", "Otro"];
  const regimenes = ["Solo alojamiento", "Alojamiento y desayuno", "Media pensión", "Pensión completa", "Todo incluido"];

  return (
    <div className="p-6 md:p-10 max-w-2xl">

      {/* Encabezado */}
      <button
        onClick={() => router.push("/admin/packages")}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-[#1D5D8C] transition-colors mb-6"
      >
        ← Volver a paquetes
      </button>
      <h1 className="text-4xl font-black text-gray-900 mb-8">
        {packageId ? "Editar paquete" : "Agregar paquete"}
      </h1>

      <div className="space-y-7">

        {/* ── Identificación ── */}
        <Divider label="Identificación" />

        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label>Destino</Label>
            <Select value={form.destino_id} onChange={(v) => set("destino_id", v)}>
              <option value="">Seleccionar destino</option>
              {destinos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </Select>
          </div>
          <div>
            <Label>Período / Categoría</Label>
            <Select value={form.categoria_id} onChange={(v) => set("categoria_id", v)}>
              <option value="">Seleccionar período</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </div>
        </div>

        <div>
          <Label>Subtítulo</Label>
          <Input value={form.titulo_subtitulo} onChange={(v) => set("titulo_subtitulo", v)} placeholder="Ej: Con Termas Marinas" />
        </div>

        {/* Imagen */}
        <div>
          <Label>Imagen del paquete</Label>
          {form.imagen_url ? (
            <div className="relative w-full h-44 rounded-xl overflow-hidden border-2 border-gray-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imagen_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 bg-white text-gray-800 font-bold text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  Cambiar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => set("imagen_url", "")}
                  className="flex items-center gap-2 bg-red-500 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Quitar
                </button>
              </div>
            </div>
          ) : (
            <label className={cn(
              "flex flex-col items-center justify-center w-full h-44 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer",
              "hover:border-[#1D5D8C] hover:bg-[#1D5D8C]/5 transition-colors",
              uploadingImg && "opacity-60 pointer-events-none"
            )}>
              {uploadingImg ? (
                <Loader2 className="w-8 h-8 text-[#1D5D8C] animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-gray-500">Subir imagen</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG o WebP · máx. 10 MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
              />
            </label>
          )}
        </div>

        {/* ── Fechas y duración ── */}
        <Divider label="Fechas y duración" />

        <div className="flex items-center gap-5">
          <Label>Tipo de salidas</Label>
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
            {(["FECHA_ESPECIFICA", "DIARIAS"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => set("tipo_salidas", tipo)}
                className={cn(
                  "px-5 py-2 text-sm font-bold transition-colors",
                  form.tipo_salidas === tipo
                    ? "bg-[#1D5D8C] text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                )}
              >
                {tipo === "FECHA_ESPECIFICA" ? "Fecha específica" : "Diarias"}
              </button>
            ))}
          </div>
        </div>

        {form.tipo_salidas === "FECHA_ESPECIFICA" && (
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Fecha de salida</Label>
              <Input type="date" value={form.fecha_salida} onChange={(v) => set("fecha_salida", v)} />
            </div>
            <div>
              <Label>Fecha de regreso</Label>
              <Input type="date" value={form.fecha_regreso} onChange={(v) => set("fecha_regreso", v)} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 max-w-xs">
          <div>
            <Label>Días</Label>
            <Input type="number" value={form.duracion_dias} onChange={(v) => set("duracion_dias", v)} placeholder="0" />
          </div>
          <div>
            <Label>Noches</Label>
            <Input type="number" value={form.duracion_noches} onChange={(v) => set("duracion_noches", v)} placeholder="0" />
          </div>
        </div>

        {/* ── Moneda (siempre visible) ── */}
        <Divider label="Precio" />

        <div className="max-w-[180px]">
          <Label>Moneda</Label>
          <Select value={form.moneda} onChange={(v) => set("moneda", v)}>
            <option value="ARS">ARS $</option>
            <option value="USD">USD U$D</option>
          </Select>
        </div>

        {/* Precio base: solo si NO hay alojamiento */}
        {!form.alojamiento_activo && (
          <div className="max-w-xs">
            <Label>Precio base del paquete por persona</Label>
            <Input type="number" value={form.precio_base} onChange={(v) => set("precio_base", v)} placeholder="0" />
          </div>
        )}

        {/* ── Adicionales al paquete (descripción, no precio) ── */}
        <div>
          <Label>Incluye / Adicionales informativos</Label>
          <div className="space-y-2.5 mt-1">
            {form.adicionales.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={item} onChange={(v) => setAdicional(i, v)} placeholder="Ej: Asistencia al viajero, seguro de equipaje…" />
                <button
                  type="button"
                  onClick={() => removeAdicional(i)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAdicional}
              className="flex items-center gap-2 text-sm font-bold text-[#1D5D8C] hover:text-[#164a70] transition-colors mt-1"
            >
              <Plus className="w-4 h-4" /> Agregar ítem
            </button>
          </div>
        </div>

        {/* ── Transporte ── */}
        <SectionCard
          icon={<Bus className="w-5 h-5" />}
          title="Transporte"
          activo={form.transporte_activo}
          onToggle={(v) => set("transporte_activo", v)}
        >
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Empresa de transporte</Label>
              <Select value={form.transporte_id} onChange={(v) => set("transporte_id", v)}>
                <option value="">Seleccionar</option>
                {transportes.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </Select>
            </div>
            <div>
              <Label>Tipo de transporte</Label>
              <Select value={form.transporte_tipo} onChange={(v) => set("transporte_tipo", v)}>
                <option value="">Seleccionar</option>
                {tiposTransporte.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Horario aprox. de salida</Label>
              <Input type="time" value={form.horario_salida} onChange={(v) => set("horario_salida", v)} />
            </div>
            <div>
              <Label>Horario aprox. de regreso</Label>
              <Input type="time" value={form.horario_regreso} onChange={(v) => set("horario_regreso", v)} />
            </div>
          </div>
          <div>
            <Label>Lugares de ascenso</Label>
            <div className="border-2 border-gray-200 rounded-xl p-3 space-y-1 max-h-44 overflow-y-auto">
              {puntosAscenso.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 text-base font-medium cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form.punto_ascenso_ids.includes(p.id)}
                    onChange={() => togglePunto(p.id)}
                    className="w-4 h-4 accent-[#1D5D8C]"
                  />
                  {p.nombre_lugar}
                </label>
              ))}
              {puntosAscenso.length === 0 && (
                <p className="text-sm text-gray-400 px-2 py-1">No hay puntos cargados en parámetros.</p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Alojamiento ── */}
        <SectionCard
          icon={<Hotel className="w-5 h-5" />}
          title="Alojamiento"
          activo={form.alojamiento_activo}
          onToggle={(v) => set("alojamiento_activo", v)}
        >
          <div className="space-y-4">
            {form.hotel_detalles.map((det, i) => (
              <div key={i} className="rounded-xl border-2 border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                    Hotel {i + 1}
                  </span>
                  {form.hotel_detalles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHotel(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hotel</Label>
                    <Select value={det.hotel_id} onChange={(v) => setHotelField(i, "hotel_id", v)}>
                      <option value="">Seleccionar</option>
                      {hoteles.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Régimen</Label>
                    <Select value={det.regimen} onChange={(v) => setHotelField(i, "regimen", v)}>
                      <option value="">Seleccionar</option>
                      {regimenes.map((r) => <option key={r} value={r}>{r}</option>)}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio por persona</Label>
                    <Input type="number" value={det.precio} onChange={(v) => setHotelField(i, "precio", v)} placeholder="0" />
                  </div>
                  <div>
                    <Label>Cant. de noches</Label>
                    <Input type="number" value={det.cantidad_noches} onChange={(v) => setHotelField(i, "cantidad_noches", v)} placeholder="0" />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addHotel}
              className="flex items-center gap-2 text-sm font-bold text-[#1D5D8C] hover:text-[#164a70] transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar otro hotel
            </button>
          </div>
        </SectionCard>

        {/* ── Precios adicionales (gastos, suplementos, etc.) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-700">Precios adicionales</p>
              <p className="text-xs text-gray-400 mt-0.5">Gastos de reserva, suplemento bus cama, etc. Se suman al precio principal.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {form.adicionales_precio.map((ap, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={ap.nombre}
                  onChange={(v) => setAdicionalPrecioField(i, "nombre", v)}
                  placeholder="Ej: Gastos de reserva"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={ap.valor}
                  onChange={(v) => setAdicionalPrecioField(i, "valor", v)}
                  placeholder="0"
                  className="w-36"
                />
                <button
                  type="button"
                  onClick={() => removeAdicionalPrecio(i)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAdicionalPrecio}
              className="flex items-center gap-2 text-sm font-bold text-[#1D5D8C] hover:text-[#164a70] transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar precio adicional
            </button>
            {form.adicionales_precio.some((a) => a.valor) && (
              <p className="text-sm font-bold text-gray-500 pt-1">
                Total adicionales:{" "}
                <span className="text-gray-800">
                  {form.moneda === "USD" ? "U$D " : "$ "}
                  {form.adicionales_precio
                    .filter((a) => a.valor)
                    .reduce((s, a) => s + (Number(a.valor) || 0), 0)
                    .toLocaleString("es-AR")}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* ── Incluye ── */}
        <Divider label="Incluye" />

        <div className="flex gap-6">
          {[
            { key: "include_transfer" as const, label: "Transfer IN/OUT" },
            { key: "include_asistencia_medica" as const, label: "Asistencia médica" },
          ].map(({ key, label }) => (
            <label
              key={key}
              className={cn(
                "flex items-center gap-3 cursor-pointer px-5 py-3.5 rounded-xl border-2 font-semibold text-base transition-colors select-none",
                form[key]
                  ? "border-[#1D5D8C] bg-[#1D5D8C]/5 text-[#1D5D8C]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 accent-[#1D5D8C]"
              />
              {label}
            </label>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-base text-red-600 bg-red-50 border border-red-100 rounded-xl px-5 py-4 font-medium">
            {error}
          </p>
        )}

        {/* Botones */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-7 py-3.5 rounded-xl border-2 border-[#1D5D8C] text-[#1D5D8C] font-bold text-base hover:bg-[#1D5D8C]/5 transition-colors disabled:opacity-60"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-7 py-3.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-base hover:bg-[#164a70] transition-colors disabled:opacity-60 flex items-center gap-2 shadow-md"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {packageId ? "Guardar cambios" : "Agregar Paquete"}
          </button>
        </div>

      </div>
    </div>
  );
}
