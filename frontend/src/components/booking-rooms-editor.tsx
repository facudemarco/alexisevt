"use client";

import type React from "react";

interface RoomPassenger { nombre: string; apellido: string; habitacion_clave?: string; }

export interface RoomForm { id?: number; clave: string; identificacion: string; tipo: string; capacidad: number; observaciones: string; }

export function RoomsEditor<P extends RoomPassenger>({ rooms, setRooms, passengers, setPassengers }: {
  rooms: RoomForm[];
  setRooms: React.Dispatch<React.SetStateAction<RoomForm[]>>;
  passengers: P[];
  setPassengers: React.Dispatch<React.SetStateAction<P[]>>;
}) {
  const changeRoom = (key: string, changes: Partial<RoomForm>) => setRooms((prev) => prev.map((room) => room.clave === key ? { ...room, ...changes } : room));
  const removeRoom = (key: string) => {
    const assigned = passengers.filter((p) => p.habitacion_clave === key).length;
    if (assigned && !window.confirm(`Esta habitación tiene ${assigned} pasajero(s). Al quitarla quedarán sin asignar. ¿Continuar?`)) return;
    setPassengers((prev) => prev.map((p) => p.habitacion_clave === key ? { ...p, habitacion_clave: "" } : p));
    setRooms((prev) => prev.filter((room) => room.clave !== key));
  };
  return (
    <section className="space-y-3 rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Habitaciones</h3>
        <button type="button" className="text-sm font-bold text-[#1D5D8C]" onClick={() => setRooms((prev) => [...prev, { clave: crypto.randomUUID(), identificacion: `Habitación ${prev.length + 1}`, tipo: "Doble", capacidad: 2, observaciones: "" }])}>+ Agregar habitación</button>
      </div>
      {rooms.map((room) => {
        const assigned = passengers.filter((p) => p.habitacion_clave === room.clave).length;
        return <div key={room.clave} className="space-y-2 rounded-lg bg-gray-50 border border-gray-200 p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-gray-600">Identificación<input aria-label="Identificación de habitación" className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm" value={room.identificacion} onChange={(e) => changeRoom(room.clave, { identificacion: e.target.value })} /></label>
            <label className="text-xs font-medium text-gray-600">Tipo<input aria-label="Tipo de habitación" className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm" value={room.tipo} onChange={(e) => changeRoom(room.clave, { tipo: e.target.value })} /></label>
            <label className="text-xs font-medium text-gray-600">Capacidad<input aria-label="Capacidad de habitación" type="number" min={1} className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm" value={room.capacidad} onChange={(e) => changeRoom(room.clave, { capacidad: Number(e.target.value) })} /></label>
            <label className="text-xs font-medium text-gray-600">Observaciones<input className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm" value={room.observaciones} onChange={(e) => changeRoom(room.clave, { observaciones: e.target.value })} /></label>
          </div>
          <div className="flex justify-between text-xs"><span className={assigned > room.capacidad ? "text-red-600" : "text-gray-600"}>{assigned} asignados · {Math.max(0, room.capacidad - assigned)} plazas disponibles{assigned > room.capacidad && " · capacidad excedida"}</span><button type="button" className="font-bold text-red-600" onClick={() => removeRoom(room.clave)}>Quitar habitación</button></div>
        </div>;
      })}
      {passengers.length > 0 && rooms.length > 0 && <div className="space-y-2 pt-2"><p className="text-xs font-bold text-gray-700">Asignar pasajeros</p>{passengers.map((p, index) => <label key={index} className="flex items-center justify-between gap-3 text-sm text-gray-700"><span>{p.nombre || p.apellido ? `${p.nombre} ${p.apellido}` : `Pasajero ${index + 1}`}</span><select aria-label={`Habitación de pasajero ${index + 1}`} className="max-w-[60%] rounded border border-gray-300 bg-white p-2 text-sm" value={p.habitacion_clave || ""} onChange={(e) => setPassengers((prev) => prev.map((item, i) => i === index ? { ...item, habitacion_clave: e.target.value } : item))}><option value="">Sin asignar</option>{rooms.map((room) => { const count = passengers.filter((item) => item.habitacion_clave === room.clave).length; return <option key={room.clave} value={room.clave} disabled={count >= room.capacidad && p.habitacion_clave !== room.clave}>{room.identificacion || "Habitación"} ({Math.max(0, room.capacidad - count)} libres)</option>; })}</select></label>)}</div>}
    </section>
  );
}

export function validateRooms(rooms: RoomForm[], passengers: RoomPassenger[]): string | null {
  const incomplete = passengers.findIndex((p) => p.habitacion_clave && (!p.nombre.trim() || !p.apellido.trim()));
  if (incomplete >= 0) return `Completá nombre y apellido del pasajero ${incomplete + 1} o quitá su asignación de habitación.`;
  for (const room of rooms) {
    if (!room.identificacion.trim() || !room.tipo.trim() || !Number.isInteger(room.capacidad) || room.capacidad < 1) return "Completá identificación, tipo y capacidad válida de cada habitación.";
    if (passengers.filter((p) => p.habitacion_clave === room.clave).length > room.capacidad) return `La capacidad de ${room.identificacion} está excedida.`;
  }
  return null;
}
