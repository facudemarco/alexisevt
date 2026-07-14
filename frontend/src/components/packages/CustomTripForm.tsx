"use client";

import { useState } from "react";
import { 
  MapPin, 
  Calendar, 
  Moon, 
  BedDouble, 
  Users, 
  User, 
  Baby, 
  Mail, 
  Phone, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2
} from "lucide-react";

export function CustomTripForm() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    destino: "",
    fecha: "",
    noches: "",
    habitaciones: ["Doble"],
    pasajeros: "2",
    mayores: "2",
    menores: "0",
    agregar_transporte: false,
    tipo_transporte: "Avion", // "Avion" | "Bus"
    comentarios: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addHabitacion = () => {
    setForm((prev) => ({
      ...prev,
      habitaciones: [...prev.habitaciones, "Doble"],
    }));
  };

  const removeHabitacion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      habitaciones: prev.habitaciones.filter((_, idx) => idx !== index),
    }));
  };

  const handleHabitacionChange = (index: number, val: string) => {
    setForm((prev) => {
      const copy = [...prev.habitaciones];
      copy[index] = val;
      return { ...prev, habitaciones: copy };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.nombre || !form.email || !form.destino || !form.fecha || !form.pasajeros) {
      setError("Por favor, completa todos los campos obligatorios (*).");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/next-api/viaje-a-medida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Ocurrió un error al enviar tu consulta.");
      }

      setSuccess(true);
      setForm({
        nombre: "",
        email: "",
        telefono: "",
        destino: "",
        fecha: "",
        noches: "",
        habitaciones: ["Doble"],
        pasajeros: "2",
        mayores: "2",
        menores: "0",
        agregar_transporte: false,
        tipo_transporte: "Avion",
        comentarios: "",
      });
    } catch (err: any) {
      setError(err.message || "No se pudo enviar la consulta. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl p-10 shadow-xl border border-gray-100/50 text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 font-serif mb-4">¡Consulta Recibida!</h2>
        <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto mb-8">
          Muchas gracias por elegirnos. Nos pondremos en contacto contigo a la brevedad para enviarte las mejores propuestas para tu próximo viaje.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-[#1D5D8C] hover:bg-[#164a70] text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-2xl border border-gray-100/50 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold font-serif text-[#1D5D8C] uppercase tracking-wide">
          Diseñá tu viaje a medida
        </h2>
        <p className="text-gray-500 text-sm md:text-base mt-2">
          Completá el formulario con tus preferencias y nuestro equipo armará la escapada perfecta para vos.
        </p>
        <div className="w-20 h-[3px] bg-[#1D5D8C]/30 mx-auto mt-4 rounded-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Sección 1: Datos Personales */}
        <div>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1D5D8C]" /> 1. Datos de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="relative group">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Nombre y Apellido *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Correo Electrónico *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Ej: juan@email.com"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Teléfono de contacto
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Ej: +54 9 11 1234 5678"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                />
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Detalles del Viaje */}
        <div>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1D5D8C]" /> 2. Preferencias del Viaje
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="relative group lg:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Destino *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="destino"
                  value={form.destino}
                  onChange={handleChange}
                  placeholder="¿A dónde te gustaría viajar?"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                />
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Fecha de Salida Estimada *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                />
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Cantidad de Noches
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="noches"
                  value={form.noches}
                  onChange={handleChange}
                  placeholder="Noches"
                  min="1"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                />
                <Moon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Alojamiento, Pasajeros y Transporte */}
        <div>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1D5D8C]" /> 3. Alojamiento, Pasajeros y Transporte
          </h3>
          <div className="space-y-6">
            
            {/* Habitaciones dinámicas */}
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-200/50 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                  Distribución de Habitaciones
                </label>
                <button
                  type="button"
                  onClick={addHabitacion}
                  className="text-xs font-bold text-[#1D5D8C] hover:text-[#164a70] flex items-center gap-1 bg-[#1D5D8C]/10 hover:bg-[#1D5D8C]/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar habitación
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.habitaciones.map((hab, idx) => (
                  <div key={idx} className="flex items-center gap-2 animate-fade-in">
                    <div className="relative flex-1 group">
                      <select
                        value={hab}
                        onChange={(e) => handleHabitacionChange(idx, e.target.value)}
                        className="w-full h-12 pl-10 pr-10 rounded-xl border-2 border-gray-200 bg-white text-gray-800 font-medium focus:outline-none focus:border-[#1D5D8C] transition-all text-sm appearance-none"
                      >
                        <option value="Individual">Habitación Individual</option>
                        <option value="Doble">Habitación Doble</option>
                        <option value="Triple">Habitación Triple</option>
                        <option value="Cuádruple">Habitación Cuádruple</option>
                        <option value="Familiar">Habitación Familiar</option>
                      </select>
                      <BedDouble className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                    {form.habitaciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHabitacion(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2.5 rounded-xl transition-all"
                        title="Eliminar habitación"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pasajeros */}
            <div className="grid grid-cols-3 gap-5">
              <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Pasajeros *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="pasajeros"
                    value={form.pasajeros}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                  />
                  <Users className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Mayores
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="mayores"
                    value={form.mayores}
                    onChange={handleChange}
                    min="1"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Menores
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="menores"
                    value={form.menores}
                    onChange={handleChange}
                    min="0"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm"
                  />
                  <Baby className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-[#1D5D8C] transition-colors" />
                </div>
              </div>
            </div>

            {/* Checkbox y Selector de Transporte */}
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-200/50 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="agregar_transporte"
                  name="agregar_transporte"
                  checked={form.agregar_transporte}
                  onChange={(e) => setForm((prev) => ({ ...prev, agregar_transporte: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-[#1D5D8C] focus:ring-[#1D5D8C] cursor-pointer"
                />
                <label htmlFor="agregar_transporte" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  Quiero agregar transporte al presupuesto
                </label>
              </div>

              {form.agregar_transporte && (
                <div className="pt-3 border-t border-gray-200/60 animate-fade-in">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                    Seleccioná el medio de transporte
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, tipo_transporte: "Avion" }))}
                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all text-sm ${
                        form.tipo_transporte === "Avion"
                          ? "border-[#1D5D8C] bg-[#1D5D8C]/5 text-[#1D5D8C] shadow-sm"
                          : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                      }`}
                    >
                      ✈️ Avión
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, tipo_transporte: "Bus" }))}
                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all text-sm ${
                        form.tipo_transporte === "Bus"
                          ? "border-[#1D5D8C] bg-[#1D5D8C]/5 text-[#1D5D8C] shadow-sm"
                          : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                      }`}
                    >
                      🚌 Bus
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Sección 4: Comentarios */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
            Contanos más detalles o preferencias (Opcional)
          </label>
          <textarea
            name="comentarios"
            value={form.comentarios}
            onChange={handleChange}
            placeholder="Ej: Preferencia de horarios, régimen alimenticio, tipo de transporte preferido (aéreo/terrestre)..."
            rows={4}
            className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white/50 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#1D5D8C] focus:ring-1 focus:ring-[#1D5D8C]/10 transition-all text-sm resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto min-w-[200px] h-14 bg-[#1D5D8C] hover:bg-[#164a70] text-white font-bold px-8 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar solicitud
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
