"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { Pencil, Trash2, Plus, ImagePlus, X, Loader2, ListFilter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Destino { id: number; nombre: string; }

interface Cliente {
  id: number;
  nombre_sistema?: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: string;
}

interface Hotel {
  id: number;
  nombre: string;
  telefono?: string;
  destino_id?: number;
  direccion?: string;
  descripcion?: string;
  imagenes: string[];
}

type Tab = "hoteles" | "clientes" | "usuarios" | "destinos" | "transporte" | "lugares";

// ── Helpers UI ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-gray-700 mb-1.5">{children}</label>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors"
    />
  );
}

function Textarea({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors resize-none"
    />
  );
}

function SelectField({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium focus:outline-none focus:border-[#1D5D8C] transition-colors appearance-none"
    >
      {children}
    </select>
  );
}

// ── Modal Hotel ────────────────────────────────────────────────────────────

interface HotelFormState {
  nombre: string;
  telefono: string;
  destino_id: string;
  direccion: string;
  descripcion: string;
  imagenes: string[];
}

const EMPTY_HOTEL: HotelFormState = {
  nombre: "", telefono: "", destino_id: "", direccion: "", descripcion: "", imagenes: [],
};

function HotelModal({
  hotel, destinos, onSave, onClose,
}: {
  hotel: Hotel | null;
  destinos: Destino[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<HotelFormState>(
    hotel ? {
      nombre: hotel.nombre,
      telefono: hotel.telefono ?? "",
      destino_id: hotel.destino_id ? String(hotel.destino_id) : "",
      direccion: hotel.direccion ?? "",
      descripcion: hotel.descripcion ?? "",
      imagenes: hotel.imagenes ?? [],
    } : EMPTY_HOTEL
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);

  const set = (key: keyof HotelFormState, v: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await fetchApi("/uploads/image", { method: "POST", body: fd });
      set("imagenes", [...form.imagenes, data.url]);
    } catch (e: any) {
      setError(e.message || "No se pudo subir la imagen.");
    } finally {
      setUploadingImg(false);
    }
  };

  const removeImage = (idx: number) =>
    set("imagenes", form.imagenes.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    setError("");
    try {
      const body = {
        nombre: form.nombre,
        telefono: form.telefono || null,
        destino_id: form.destino_id ? Number(form.destino_id) : null,
        direccion: form.direccion || null,
        descripcion: form.descripcion || null,
        imagenes: form.imagenes,
      };
      if (hotel) {
        await fetchApi(`/config/hoteles/${hotel.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await fetchApi("/config/hoteles/", { method: "POST", body: JSON.stringify(body) });
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900">
            {hotel ? "Editar hotel" : "Agregar hotel"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          <Field label="Nombre del hotel">
            <Input value={form.nombre} onChange={(v) => set("nombre", v)} placeholder="Ej: Hotel Savoia" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono">
              <Input value={form.telefono} onChange={(v) => set("telefono", v)} placeholder="02252 52-1107" />
            </Field>
            <Field label="Destino">
              <SelectField value={form.destino_id} onChange={(v) => set("destino_id", v)}>
                <option value="">Sin destino</option>
                {destinos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </SelectField>
            </Field>
          </div>

          <Field label="Dirección">
            <Input value={form.direccion} onChange={(v) => set("direccion", v)} placeholder="Av. San Martín 1234, San Clemente del Tuyú" />
          </Field>

          <Field label="Descripción">
            <Textarea value={form.descripcion} onChange={(v) => set("descripcion", v)} placeholder="Descripción del hotel..." />
          </Field>

          <Field label="Imágenes">
            <div className="space-y-3">
              {form.imagenes.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {form.imagenes.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className={cn(
                "flex items-center gap-3 w-full h-12 px-4 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer",
                "hover:border-[#1D5D8C] hover:bg-[#1D5D8C]/5 transition-colors text-sm font-semibold text-gray-500",
                uploadingImg && "opacity-60 pointer-events-none"
              )}>
                {uploadingImg
                  ? <Loader2 className="w-4 h-4 text-[#1D5D8C] animate-spin" />
                  : <ImagePlus className="w-4 h-4" />
                }
                {uploadingImg ? "Subiendo..." : "Agregar imagen"}
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                />
              </label>
            </div>
          </Field>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-medium">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {hotel ? "Guardar cambios" : "Agregar hotel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Hoteles ────────────────────────────────────────────────────────────

function HotelesTab({ addTrigger }: { addTrigger: number }) {
  const [hoteles, setHoteles] = useState<Hotel[]>([]);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroDestino, setFiltroDestino] = useState("");
  const [editHotel, setEditHotel] = useState<Hotel | null | undefined>(undefined);
  const load = () => {
    setLoading(true);
    Promise.all([fetchApi("/config/hoteles/"), fetchApi("/config/destinos/")])
      .then(([h, d]) => { setHoteles(h); setDestinos(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Carga inicial
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Abrir modal "nuevo" cuando el padre dispara el trigger (ignorar valor inicial 0)
  useEffect(() => {
    if (addTrigger === 0) return;
    setEditHotel(null);
  }, [addTrigger]);

  const filtered = useMemo(() =>
    filtroDestino
      ? hoteles.filter((h) => String(h.destino_id) === filtroDestino)
      : hoteles,
    [hoteles, filtroDestino]
  );

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este hotel?")) return;
    try {
      await fetchApi(`/config/hoteles/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      alert(e.message || "No se puede eliminar el hotel. Verifique si está asignado a algún paquete.");
    }
  };

  const destinoNombre = (id?: number) =>
    destinos.find((d) => d.id === id)?.nombre ?? "";

  return (
    <>
      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-bold text-gray-500">Destino</span>
        <div className="relative">
          <select
            value={filtroDestino}
            onChange={(e) => setFiltroDestino(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#1D5D8C] appearance-none"
          >
            <option value="">Todos los destinos</option>
            {destinos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
        {filtroDestino && (
          <button onClick={() => setFiltroDestino("")} className="text-gray-400 hover:text-[#1D5D8C] transition-colors" title="Limpiar">
            <ListFilter className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#1D5D8C] text-white">
            <tr>
              <th className="px-5 py-4 text-left font-bold text-base">Nombre</th>
              <th className="px-5 py-4 text-left font-bold text-base">Teléfono</th>
              <th className="px-5 py-4 text-center font-bold text-base">Imagen</th>
              <th className="px-5 py-4 text-center font-bold text-base">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={4} className="py-12 text-center text-gray-400 text-base">Cargando...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-gray-400 text-base">No hay hoteles.</td></tr>
            )}
            {filtered.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-bold text-gray-900 text-base">{h.nombre}</p>
                  {h.destino_id && (
                    <p className="text-sm text-gray-500 mt-0.5">{destinoNombre(h.destino_id)}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-600 text-base">
                  {h.telefono ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-4 text-center">
                  {h.imagenes?.length > 0 ? (
                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={h.imagenes[0]}
                        alt={h.nombre}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <ImagePlus className="w-5 h-5 text-gray-300" />
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setEditHotel(h)} className="text-gray-400 hover:text-[#1D5D8C] transition-colors" aria-label="Editar">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(h.id)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Eliminar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editHotel !== undefined && (
        <HotelModal
          hotel={editHotel}
          destinos={destinos}
          onSave={() => { setEditHotel(undefined); load(); }}
          onClose={() => setEditHotel(undefined)}
        />
      )}
    </>
  );
}

// ── Modal Usuario (vendedor o admin) ──────────────────────────────────────

interface UserFormState {
  nombre_sistema: string;
  nombre: string;
  email: string;
  password: string;
  telefono: string;
}

const EMPTY_USER: UserFormState = {
  nombre_sistema: "", nombre: "", email: "", password: "", telefono: "",
};

function UserModal({ user, rolFixed, titleLabel, onSave, onClose }: {
  user: Cliente | null;
  rolFixed: "vendedor" | "admin";
  titleLabel: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<UserFormState>(
    user ? {
      nombre_sistema: user.nombre_sistema ?? "",
      nombre: user.nombre,
      email: user.email,
      password: "",
      telefono: user.telefono ?? "",
    } : EMPTY_USER
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof UserFormState, v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.email.trim()) {
      setError("Nombre completo y correo son obligatorios.");
      return;
    }
    if (!user && !form.password.trim()) {
      setError("La contraseña es obligatoria.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (user) {
        const body: Record<string, string> = {
          nombre_sistema: form.nombre_sistema,
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
        };
        if (form.password.trim()) body.password = form.password;
        await fetchApi(`/users/${user.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await fetchApi("/users/", {
          method: "POST",
          body: JSON.stringify({
            nombre_sistema: form.nombre_sistema,
            nombre: form.nombre,
            email: form.email,
            password: form.password,
            telefono: form.telefono,
            rol: rolFixed,
          }),
        });
      }
      onSave();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof UserFormState; label: string; placeholder: string; type?: string }[] = [
    { key: "nombre_sistema", label: "Nombre del sistema", placeholder: rolFixed === "vendedor" ? "Ej: VEND VALENTIN DEMARCO" : "Ej: ADMIN ALEXIS" },
    { key: "nombre", label: "Nombre completo", placeholder: "Ej: Claudia Patricia Paletta" },
    { key: "email", label: "Correo electrónico", placeholder: "correo@ejemplo.com", type: "email" },
    { key: "password", label: user ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña", placeholder: "••••••••", type: "password" },
    { key: "telefono", label: "Teléfono", placeholder: "1126517405" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900">{titleLabel}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {fields.map(({ key, label, placeholder, type = "text" }) => (
            <div key={key}>
              <Label>{label}</Label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors"
              />
            </div>
          ))}
          {rolFixed === "admin" && !user && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-medium">
              Este usuario tendrá acceso completo de administrador al sistema.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-medium">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {user ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Alias para mantener compatibilidad con el nombre anterior
const ClienteModal = ({ cliente, onSave, onClose }: { cliente: Cliente | null; onSave: () => void; onClose: () => void }) => (
  <UserModal user={cliente} rolFixed="vendedor" titleLabel={cliente ? "Editar vendedor" : "Agregar Vendedor"} onSave={onSave} onClose={onClose} />
);

// ── Tab Clientes ───────────────────────────────────────────────────────────

function ClientesTab({ addTrigger }: { addTrigger: number }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCliente, setEditCliente] = useState<Cliente | null | undefined>(undefined);

  const load = () => {
    setLoading(true);
    fetchApi("/users/")
      .then(setClientes)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (addTrigger === 0) return;
    setEditCliente(null);
  }, [addTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    try {
      await fetchApi(`/users/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      alert(e.message || "No se puede eliminar el cliente. Verifique si tiene reservas asociadas.");
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#1D5D8C] text-white">
            <tr>
              <th className="px-5 py-4 text-left font-bold text-base">Nombre</th>
              <th className="px-5 py-4 text-left font-bold text-base">Teléfono</th>
              <th className="px-5 py-4 text-center font-bold text-base">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400 text-base">Cargando...</td></tr>
            )}
            {!loading && clientes.length === 0 && (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400 text-base">No hay clientes.</td></tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-bold text-gray-900 text-base uppercase">
                    {c.nombre_sistema || c.nombre}
                  </p>
                  {c.nombre_sistema && (
                    <p className="text-sm text-gray-500 mt-0.5">{c.nombre}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-600 text-base">
                  {c.telefono ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setEditCliente(c)} className="text-gray-400 hover:text-[#1D5D8C] transition-colors" aria-label="Editar">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Eliminar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editCliente !== undefined && (
        <ClienteModal
          cliente={editCliente}
          onSave={() => { setEditCliente(undefined); load(); }}
          onClose={() => setEditCliente(undefined)}
        />
      )}
    </>
  );
}

// ── Modal Destino ──────────────────────────────────────────────────────────

interface DestinoItem {
  id: number;
  nombre: string;
  sigla?: string;
  descripcion?: string;
  es_combinado: boolean;
  destino_ids?: number[];
}

interface DestinoModalProps {
  destino: DestinoItem | null;
  destinosSimples: DestinoItem[];
  onSave: () => void;
  onClose: () => void;
}

function DestinoModal({ destino, destinosSimples, onSave, onClose }: DestinoModalProps) {
  const esCombEdit = destino?.es_combinado ?? false;
  const [modo, setModo] = useState<"simple" | "combinado">(esCombEdit ? "combinado" : "simple");

  // Campos simple
  const [nombre, setNombre] = useState(destino?.nombre ?? "");
  const [sigla, setSigla] = useState(destino?.sigla ?? "");
  const [descripcion, setDescripcion] = useState(destino?.descripcion ?? "");

  // Campos combinado
  const [selIds, setSelIds] = useState<string[]>(
    destino?.destino_ids?.map(String) ?? ["", ""]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addSlot = () => setSelIds((p) => [...p, ""]);
  const setSlot = (i: number, v: string) =>
    setSelIds((p) => p.map((x, idx) => (idx === i ? v : x)));

  // Nombre auto para combinado: une los nombres de los destinos seleccionados
  const nombreCombinado = selIds
    .map((id) => destinosSimples.find((d) => String(d.id) === id)?.nombre)
    .filter(Boolean)
    .join(" + ");

  const handleSave = async () => {
    setError("");
    if (modo === "simple" && !nombre.trim()) {
      setError("El nombre del destino es obligatorio."); return;
    }
    if (modo === "combinado") {
      const filled = selIds.filter((id) => id !== "");
      if (filled.length < 2) { setError("Seleccioná al menos 2 destinos."); return; }
    }
    setSaving(true);
    try {
      const body = modo === "simple"
        ? { nombre, sigla: sigla || null, descripcion: descripcion || null, es_combinado: false, destino_ids: null }
        : {
            nombre: nombreCombinado,
            sigla: sigla || null,
            descripcion: descripcion || null,
            es_combinado: true,
            destino_ids: selIds.filter((id) => id !== "").map(Number),
          };

      if (destino) {
        await fetchApi(`/config/destinos/${destino.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await fetchApi("/config/destinos/", { method: "POST", body: JSON.stringify(body) });
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors";
  const selectClass = "w-full h-11 px-4 pr-10 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-700 font-medium focus:outline-none focus:border-[#1D5D8C] transition-colors appearance-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900">
            {destino ? "Editar destino" : modo === "simple" ? "Agregar Destino" : "Agregar Combinado"}
          </h2>
          {!destino && (
            <button
              type="button"
              onClick={() => setModo((m) => m === "simple" ? "combinado" : "simple")}
              className="flex items-center gap-1 text-sm font-bold text-[#1D5D8C] hover:text-[#164a70] transition-colors"
            >
              {modo === "simple" ? "Agregar combinado" : "Agregar simple"}
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Modo SIMPLE */}
          {modo === "simple" && (
            <>
              <div>
                <Label>Nombre del Destino</Label>
                <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: San Clemente del Tuyú" />
              </div>
              <div>
                <Label>Sigla (simplificación)</Label>
                <input className={inputClass} value={sigla} onChange={(e) => setSigla(e.target.value)} placeholder="Ej: SCL" />
              </div>
              <div>
                <Label>Sobre el destino</Label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del destino..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors resize-none"
                />
              </div>
            </>
          )}

          {/* Modo COMBINADO */}
          {modo === "combinado" && (
            <>
              {selIds.map((sel, i) => (
                <div key={i} className="relative">
                  <select
                    value={sel}
                    onChange={(e) => setSlot(i, e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Agregar Destino</option>
                    {destinosSimples.map((d) => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              ))}

              <button
                type="button"
                onClick={addSlot}
                className="flex items-center gap-1 text-[#1D5D8C] font-bold text-xl hover:text-[#164a70] transition-colors"
                title="Agregar destino"
              >
                <Plus className="w-5 h-5" />
              </button>

              {nombreCombinado && (
                <p className="text-sm text-gray-500 font-medium">
                  Nombre generado: <span className="font-bold text-gray-800">{nombreCombinado}</span>
                </p>
              )}

              <div>
                <Label>Sigla (simplificación)</Label>
                <input className={inputClass} value={sigla} onChange={(e) => setSigla(e.target.value)} placeholder="Ej: NOA" />
              </div>
              <div>
                <Label>Sobre el destino combinado</Label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Norte Argentino"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors resize-none"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-medium">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {destino ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Destinos ───────────────────────────────────────────────────────────

function DestinosTab({ addTrigger }: { addTrigger: number }) {
  const [destinos, setDestinos] = useState<DestinoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDestino, setEditDestino] = useState<DestinoItem | null | undefined>(undefined);

  const load = () => {
    setLoading(true);
    fetchApi("/config/destinos/")
      .then(setDestinos)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (addTrigger === 0) return;
    setEditDestino(null);
  }, [addTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este destino?")) return;
    try {
      await fetchApi(`/config/destinos/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      alert(e.message || "No se puede eliminar el destino. Verifique si está asignado a algún paquete.");
    }
  };

  const destinosSimples = destinos.filter((d) => !d.es_combinado);

  const nombreDisplay = (d: DestinoItem) => {
    if (!d.es_combinado) return d.nombre;
    // Para combinados, mostramos el nombre generado (ya guardado) o reconstruimos
    return d.nombre || d.destino_ids
      ?.map((id) => destinosSimples.find((s) => s.id === id)?.nombre)
      .filter(Boolean)
      .join(" + ") || "Combinado";
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#1D5D8C] text-white">
            <tr>
              <th className="px-5 py-4 text-left font-bold text-base">Nombre</th>
              <th className="px-5 py-4 text-center font-bold text-base">Sigla</th>
              <th className="px-5 py-4 text-center font-bold text-base">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400 text-base">Cargando...</td></tr>
            )}
            {!loading && destinos.length === 0 && (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400 text-base">No hay destinos.</td></tr>
            )}
            {destinos.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-bold text-gray-900 text-base">{nombreDisplay(d)}</p>
                  {d.es_combinado && (
                    <span className="inline-block mt-1 text-xs font-bold text-[#1D5D8C] bg-[#1D5D8C]/10 px-2 py-0.5 rounded-full">
                      Combinado
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-center font-bold text-gray-700 text-base">
                  {d.sigla ?? <span className="text-gray-300 font-normal">—</span>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setEditDestino(d)} className="text-gray-400 hover:text-[#1D5D8C] transition-colors" aria-label="Editar">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Eliminar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editDestino !== undefined && (
        <DestinoModal
          destino={editDestino}
          destinosSimples={destinosSimples}
          onSave={() => { setEditDestino(undefined); load(); }}
          onClose={() => setEditDestino(undefined)}
        />
      )}
    </>
  );
}

// ── Modal Transporte ───────────────────────────────────────────────────────

interface TransporteItem {
  id: number;
  nombre: string;
  razon_social?: string;
}

function TransporteModal({ transporte, onSave, onClose }: {
  transporte: TransporteItem | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(transporte?.nombre ?? "");
  const [razonSocial, setRazonSocial] = useState(transporte?.razon_social ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    setError("");
    try {
      const body = { nombre, razon_social: razonSocial || null };
      if (transporte) {
        await fetchApi(`/config/transportes/${transporte.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await fetchApi("/config/transportes/", { method: "POST", body: JSON.stringify(body) });
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900">
            {transporte ? "Editar empresa" : "Agregar Empresa de Transporte"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <Label>Nombre</Label>
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Dinamar" />
          </div>
          <div>
            <Label>Razón social</Label>
            <input className={inputClass} value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Ej: DINAMAR SERVICIOS TURISTICOS S.R.L." />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-medium">{error}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {transporte ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Transporte ─────────────────────────────────────────────────────────

function TransporteTab({ addTrigger }: { addTrigger: number }) {
  const [transportes, setTransportes] = useState<TransporteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTransporte, setEditTransporte] = useState<TransporteItem | null | undefined>(undefined);

  const load = () => {
    setLoading(true);
    fetchApi("/config/transportes/")
      .then(setTransportes)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (addTrigger === 0) return;
    setEditTransporte(null);
  }, [addTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta empresa de transporte?")) return;
    try {
      await fetchApi(`/config/transportes/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      alert(e.message || "No se puede eliminar la empresa. Verifique si está asignada a algún paquete.");
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#1D5D8C] text-white">
            <tr>
              <th className="px-5 py-4 text-left font-bold text-base">Nombre de la empresa</th>
              <th className="px-5 py-4 text-left font-bold text-base">Razón social</th>
              <th className="px-5 py-4 text-center font-bold text-base">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400 text-base">Cargando...</td></tr>
            )}
            {!loading && transportes.length === 0 && (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400 text-base">No hay empresas de transporte.</td></tr>
            )}
            {transportes.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-bold text-gray-900 text-base">{t.nombre}</td>
                <td className="px-5 py-4 text-gray-600 text-base">
                  {t.razon_social ?? <span className="text-gray-400">-</span>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setEditTransporte(t)} className="text-gray-400 hover:text-[#1D5D8C] transition-colors" aria-label="Editar">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Eliminar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTransporte !== undefined && (
        <TransporteModal
          transporte={editTransporte}
          onSave={() => { setEditTransporte(undefined); load(); }}
          onClose={() => setEditTransporte(undefined)}
        />
      )}
    </>
  );
}

// ── Modal Lugar de carga ───────────────────────────────────────────────────

interface LugarCarga {
  id: number;
  nombre_lugar: string;
  direccion_maps: string;
  horario_default: string;
}

function LugarCargaModal({ lugar, onSave, onClose }: {
  lugar: LugarCarga | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(lugar?.nombre_lugar ?? "");
  const [descripcion, setDescripcion] = useState(lugar?.direccion_maps ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    setError("");
    try {
      const body = { nombre_lugar: nombre, direccion_maps: descripcion, horario_default: lugar?.horario_default ?? "00:00" };
      if (lugar) {
        await fetchApi(`/config/puntos_ascenso/${lugar.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await fetchApi("/config/puntos_ascenso/", { method: "POST", body: JSON.stringify(body) });
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-base text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900">
            {lugar ? "Editar lugar de carga" : "Agregar Lugar de carga"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <Label>Nombre</Label>
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Aeropuerto Ezeiza" />
          </div>
          <div>
            <Label>Descripción</Label>
            <input className={inputClass} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Av. Riccheri Km 33,5" />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-medium">{error}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#1D5D8C] text-white font-bold text-sm hover:bg-[#164a70] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {lugar ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Lugares de carga ───────────────────────────────────────────────────

function LugaresCargaTab({ addTrigger }: { addTrigger: number }) {
  const [lugares, setLugares] = useState<LugarCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLugar, setEditLugar] = useState<LugarCarga | null | undefined>(undefined);

  const load = () => {
    setLoading(true);
    fetchApi("/config/puntos_ascenso/")
      .then(setLugares)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (addTrigger === 0) return;
    setEditLugar(null);
  }, [addTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este lugar de carga?")) return;
    try {
      await fetchApi(`/config/puntos_ascenso/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      alert(e.message || "No se puede eliminar el lugar de carga. Verifique si está asignado a algún paquete.");
    }
  };

  // Truncar descripción larga en tabla
  const truncate = (s: string, max = 35) =>
    s && s.length > max ? s.slice(0, max) + "…" : s;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#1D5D8C] text-white">
            <tr>
              <th className="px-5 py-4 text-left font-bold text-base">Nombre</th>
              <th className="px-5 py-4 text-left font-bold text-base">Descripción</th>
              <th className="px-5 py-4 text-center font-bold text-base">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400 text-base">Cargando...</td></tr>
            )}
            {!loading && lugares.length === 0 && (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400 text-base">No hay lugares de carga.</td></tr>
            )}
            {lugares.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-bold text-gray-900 text-base uppercase">{l.nombre_lugar}</td>
                <td className="px-5 py-4 text-gray-600 text-base">
                  {l.direccion_maps ? truncate(l.direccion_maps) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setEditLugar(l)} className="text-gray-400 hover:text-[#1D5D8C] transition-colors" aria-label="Editar">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(l.id)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Eliminar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editLugar !== undefined && (
        <LugarCargaModal
          lugar={editLugar}
          onSave={() => { setEditLugar(undefined); load(); }}
          onClose={() => setEditLugar(undefined)}
        />
      )}
    </>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "hoteles", label: "Hoteles" },
  { key: "clientes", label: "Clientes" },
  { key: "destinos", label: "Destinos" },
  { key: "transporte", label: "Transporte" },
  { key: "lugares", label: "Lugares de carga" },
];

const ADD_LABELS: Record<Tab, string> = {
  hoteles: "Agregar Hotel",
  clientes: "Agregar Cliente",
  destinos: "Agregar Destino",
  transporte: "Agregar Empresa de transporte",
  lugares: "Agregar Lugar de carga",
  usuarios: "Agregar Usuario",
};

export default function ConfigAdminPage() {
  const [tab, setTab] = useState<Tab>("hoteles");
  const [addTrigger, setAddTrigger] = useState(0);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setAddTrigger(0);
  };

  const handleAdd = () => setAddTrigger((n) => n + 1);

  return (
    <div className="p-6 md:p-8">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-black text-gray-900">Parámetros</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#1D5D8C] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#164a70] transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          {ADD_LABELS[tab]}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6 w-fit shadow-sm">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={cn(
              "px-6 py-3 text-base font-bold transition-colors border-r border-gray-200 last:border-r-0",
              tab === key
                ? "bg-[#1D5D8C] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "hoteles" && <HotelesTab addTrigger={addTrigger} />}
      {tab === "clientes" && <ClientesTab addTrigger={addTrigger} />}
      {tab === "destinos" && <DestinosTab addTrigger={addTrigger} />}
      {tab === "transporte" && <TransporteTab addTrigger={addTrigger} />}
      {tab === "lugares" && <LugaresCargaTab addTrigger={addTrigger} />}
    </div>
  );
}
