"use client";

import { useState } from "react";
import { Users, ChevronDown, ChevronUp, Loader2, CheckCircle, MessageCircle } from "lucide-react";
import { Paquete, PuntoAscenso } from "@/types/package";
import { useAuth } from "@/components/auth-provider";
import { fetchApi } from "@/lib/api";

interface Props {
  paquete: Paquete;
}

interface PasajeroForm {
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  telefono: string;
  punto_ascenso_id: string;
}

function emptyPax(): PasajeroForm {
  return { nombre: "", apellido: "", dni: "", fecha_nacimiento: "", telefono: "", punto_ascenso_id: "" };
}

function formatPrice(n: number, moneda: string) {
  return moneda === "ARS" ? "$" + n.toLocaleString("es-AR") : `${moneda} ${n.toLocaleString("es-AR")}`;
}

const WHATSAPP_NUMBER = "5491121721486"; // Matches footer: 11-2172-1486

export function PackageSidebar({ paquete }: Props) {
  const { isAuthenticated, role } = useAuth();
  const isVendedor = isAuthenticated && role === "vendedor";
  const isPublic = !isAuthenticated;
  const canBooking = isVendedor || isPublic; // Both vendedor and public users can book
  const puntosAscenso: PuntoAscenso[] = paquete.puntos_ascenso ?? [];

  // Step 1
  const [adultos, setAdultos] = useState(1);
  const [menores, setMenores] = useState(0);

  // Step 2 — per-passenger forms
  const [step, setStep] = useState<"select" | "passengers" | "success">("select");
  const [pasajeros, setPasajeros] = useState<PasajeroForm[]>([emptyPax()]);
  const [expanded, setExpanded] = useState<number>(0); // which accordion is open
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalPax = adultos + menores;
  const precioTotal = (paquete.precio_base + (paquete.precio_adicional ?? 0)) * adultos
    + paquete.precio_base * menores;

  function goToPassengers() {
    const count = totalPax;
    const current = pasajeros.length;
    if (count > current) {
      setPasajeros([...pasajeros, ...Array(count - current).fill(null).map(emptyPax)]);
    } else {
      setPasajeros(pasajeros.slice(0, count));
    }
    setExpanded(0);
    setStep("passengers");
  }

  function updatePax(idx: number, field: keyof PasajeroForm, value: string) {
    setPasajeros((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  function validatePassengers(): boolean {
    for (let i = 0; i < pasajeros.length; i++) {
      const p = pasajeros[i];
      if (!p.nombre.trim() || !p.apellido.trim()) {
        setError(`Completá nombre y apellido del pasajero ${i + 1}.`);
        setExpanded(i);
        return false;
      }
      if (!p.dni.trim()) {
        setError(`Ingresá el DNI del pasajero ${i + 1}.`);
        setExpanded(i);
        return false;
      }
      if (!p.fecha_nacimiento) {
        setError(`Ingresá la fecha de nacimiento del pasajero ${i + 1}.`);
        setExpanded(i);
        return false;
      }
      if (!p.telefono.trim()) {
        setError(`Ingresá el teléfono del pasajero ${i + 1}.`);
        setExpanded(i);
        return false;
      }
      if (puntosAscenso.length > 0 && !p.punto_ascenso_id) {
        setError(`Seleccioná el lugar de ascenso del pasajero ${i + 1}.`);
        setExpanded(i);
        return false;
      }
    }
    setError("");
    return true;
  }

  // Vendedor: submit via API
  async function handleSubmitVendedor() {
    if (!validatePassengers()) return;
    setSaving(true);
    try {
      await fetchApi("/bookings/", {
        method: "POST",
        body: JSON.stringify({
          paquete_id: paquete.id,
          cliente_nombre: `${pasajeros[0].nombre} ${pasajeros[0].apellido}`.trim(),
          cliente_telefono: pasajeros[0].telefono || undefined,
          pasajeros_adultos: adultos,
          pasajeros_menores: menores,
          precio_total: precioTotal,
          pasajeros: pasajeros.map((p) => ({
            nombre: p.nombre,
            apellido: p.apellido,
            dni: p.dni || undefined,
            fecha_nacimiento: p.fecha_nacimiento || undefined,
            telefono: p.telefono || undefined,
            punto_ascenso_id: p.punto_ascenso_id ? parseInt(p.punto_ascenso_id) : undefined,
          })),
        }),
      });
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Error al cargar la reserva.");
    } finally {
      setSaving(false);
    }
  }

  // Public: compose WhatsApp message
  function handleSubmitWhatsApp() {
    if (!validatePassengers()) return;

    const destinoNombre = paquete.destino?.nombre ?? "Sin destino";
    let fechaSalida = "";
    if (paquete.tipo_salidas === "DIARIAS") {
      fechaSalida = "Salidas diarias";
    } else if (paquete.fecha_salida) {
      const [y, m, d] = paquete.fecha_salida.split("-");
      fechaSalida = `${d}/${m}/${y}`;
    }

    let msg = `*Hola! Vi este producto en la web y quiero reservar*\n\n`;
    msg += `*Nueva Reserva - AlexisEVT*\n`;
    msg += `*Destino:* ${destinoNombre}\n`;
    if (fechaSalida) msg += `*Fecha de salida:* ${fechaSalida}\n`;
    if (paquete.categoria) msg += `*Categoría:* ${paquete.categoria.nombre}\n`;
    msg += `*Pasajeros:* ${adultos} adulto${adultos !== 1 ? "s" : ""}`;
    if (menores > 0) msg += ` + ${menores} menor${menores !== 1 ? "es" : ""}`;
    msg += `\n`;
    msg += `*Precio total estimado:* ${formatPrice(precioTotal, paquete.moneda)}\n`;
    msg += `\n── *Detalle de pasajeros* ──\n`;

    pasajeros.forEach((p, idx) => {
      const tipo = idx < adultos ? "Adulto" : "Menor";
      msg += `\n*Pasajero ${idx + 1} (${tipo})*\n`;
      msg += `   Nombre: ${p.nombre} ${p.apellido}\n`;
      msg += `   DNI: ${p.dni}\n`;
      // Format date of birth
      if (p.fecha_nacimiento) {
        const [y, m, d] = p.fecha_nacimiento.split("-");
        msg += `   Fecha de nacimiento: ${d}/${m}/${y}\n`;
      }
      msg += `   Teléfono: ${p.telefono}\n`;
      if (p.punto_ascenso_id) {
        const punto = puntosAscenso.find((pa) => String(pa.id) === p.punto_ascenso_id);
        msg += `   Lugar de ascenso: ${punto?.nombre_lugar ?? p.punto_ascenso_id}\n`;
      }
    });

    const encodedMsg = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
    window.open(whatsappUrl, "_blank");
    setStep("success");
  }

  return (
    <div className="space-y-4">
      {/* Price card */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <p className="text-sm text-gray-600">Precio por persona</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-4xl font-black text-brand-primary">{formatPrice(paquete.precio_base, paquete.moneda)}</span>
          {paquete.precio_adicional > 0 && (
            <span className="text-base text-gray-500 font-medium">+ {formatPrice(paquete.precio_adicional, paquete.moneda)}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-700">En base doble/triple/cuádruple</p>
      </div>

      {/* Step 1 — seleccionar pasajeros */}
      {canBooking && step === "select" && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <p className="font-bold text-gray-800 text-sm">Pasajeros</p>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4" /> {adultos} adulto{adultos !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setAdultos((v) => Math.max(1, v - 1))} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">−</button>
              <button onClick={() => setAdultos((v) => v + 1)} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">+</button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4" /> {menores} menor{menores !== 1 ? "es" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setMenores((v) => Math.max(0, v - 1))} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">−</button>
              <button onClick={() => setMenores((v) => v + 1)} className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">+</button>
            </div>
          </div>

          <div className="border-t pt-3 flex items-center justify-between text-sm font-bold text-gray-800">
            <span>Total estimado ({totalPax} pax)</span>
            <span className="text-brand-primary">{formatPrice(precioTotal, paquete.moneda)}</span>
          </div>

          <button onClick={goToPassengers} className="block w-full text-center bg-[#1D5D8C] hover:bg-[#164a70] text-white font-bold py-3 rounded-xl transition-colors">
            Continuar →
          </button>
        </div>
      )}

      {/* Step 2 — datos por pasajero */}
      {canBooking && step === "passengers" && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="font-bold text-gray-800 text-sm">{totalPax} pasajero{totalPax !== 1 ? "s" : ""} · {formatPrice(precioTotal, paquete.moneda)}</p>
            <button onClick={() => setStep("select")} className="text-xs text-gray-400 hover:text-gray-600 font-medium">← Volver</button>
          </div>

          {pasajeros.map((pax, idx) => (
            <div key={idx} className={`border-b border-gray-100 last:border-0`}>
              {/* Accordion header */}
              <button
                onClick={() => setExpanded(expanded === idx ? -1 : idx)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>
                  Pasajero {idx + 1}
                  {idx < adultos ? " (Adulto)" : " (Menor)"}
                  {pax.nombre && pax.apellido && (
                    <span className="font-normal text-gray-500 ml-2">— {pax.nombre} {pax.apellido}</span>
                  )}
                </span>
                {expanded === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {/* Accordion body */}
              {expanded === idx && (
                <div className="px-6 pb-5 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre *"
                      required
                      value={pax.nombre}
                      onChange={(e) => updatePax(idx, "nombre", e.target.value)}
                      className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C]"
                    />
                    <input
                      type="text"
                      placeholder="Apellido *"
                      required
                      value={pax.apellido}
                      onChange={(e) => updatePax(idx, "apellido", e.target.value)}
                      className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C]"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="DNI *"
                    required
                    value={pax.dni}
                    onChange={(e) => updatePax(idx, "dni", e.target.value)}
                    className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C]"
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Fecha de nacimiento *</label>
                    <input
                      type="date"
                      required
                      value={pax.fecha_nacimiento}
                      onChange={(e) => updatePax(idx, "fecha_nacimiento", e.target.value)}
                      className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] text-gray-700"
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Teléfono *"
                    required
                    value={pax.telefono}
                    onChange={(e) => updatePax(idx, "telefono", e.target.value)}
                    className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C]"
                  />
                  {puntosAscenso.length > 0 && (
                    <select
                      required
                      value={pax.punto_ascenso_id}
                      onChange={(e) => updatePax(idx, "punto_ascenso_id", e.target.value)}
                      className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#1D5D8C] text-gray-700 bg-white"
                    >
                      <option value="">Lugar de ascenso *</option>
                      {puntosAscenso.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre_lugar}</option>
                      ))}
                    </select>
                  )}

                  {idx < pasajeros.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(idx + 1)}
                      className="text-xs text-[#1D5D8C] font-semibold hover:underline self-end mt-1"
                    >
                      Siguiente pasajero →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="px-6 pb-3">
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            </div>
          )}

          <div className="px-6 pb-5 pt-2">
            {isVendedor ? (
              <button
                onClick={handleSubmitVendedor}
                disabled={saving}
                className="w-full bg-[#1D5D8C] hover:bg-[#164a70] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar reserva"}
              </button>
            ) : (
              <button
                onClick={handleSubmitWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#1fb855] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar reserva por WhatsApp
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — éxito (vendedor) */}
      {isVendedor && step === "success" && (
        <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="font-bold text-gray-900 text-lg">¡Reserva cargada!</p>
          <p className="text-sm text-gray-500">La reserva quedó en estado <span className="font-semibold text-yellow-600">Pendiente</span>. El admin la revisará en el panel.</p>
          <a href="/mi-cuenta" className="block w-full text-center bg-[#1D5D8C] hover:bg-[#164a70] text-white font-bold py-3 rounded-xl transition-colors mt-2">
            Ver mis reservas
          </a>
          <button
            onClick={() => { setStep("select"); setPasajeros([emptyPax()]); setAdultos(1); setMenores(0); setError(""); }}
            className="block w-full text-center border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cargar otra reserva
          </button>
        </div>
      )}

      {/* Step 3 — éxito (público / WhatsApp) */}
      {isPublic && step === "success" && (
        <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="font-bold text-gray-900 text-lg">¡Reserva enviada!</p>
          <p className="text-sm text-gray-500">Tu reserva fue enviada por WhatsApp. Nos pondremos en contacto a la brevedad para confirmarla.</p>
          <button
            onClick={() => { setStep("select"); setPasajeros([emptyPax()]); setAdultos(1); setMenores(0); setError(""); }}
            className="block w-full text-center border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Hacer otra reserva
          </button>
        </div>
      )}
    </div>
  );
}
