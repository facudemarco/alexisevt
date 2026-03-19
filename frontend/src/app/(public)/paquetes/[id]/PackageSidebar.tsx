"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import Link from "next/link";
import { Paquete } from "@/types/package";

interface Props {
  paquete: Paquete;
}

function formatPrice(n: number, moneda: string) {
  if (moneda === "ARS") {
    return "$" + n.toLocaleString("es-AR");
  }
  return `${moneda} ${n.toLocaleString("es-AR")}`;
}

export function PackageSidebar({ paquete }: Props) {
  const [adultos, setAdultos] = useState(2);
  const [menores, setMenores] = useState(0);

  return (
    <div className="sticky top-6 space-y-4">
      {/* Precio */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <p className="text-sm text-gray-600">Precio por persona</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-4xl font-black text-brand-primary">
            {formatPrice(paquete.precio_base, paquete.moneda)}
          </span>
          {paquete.precio_adicional > 0 && (
            <span className="text-base text-gray-500 font-medium">
              + {formatPrice(paquete.precio_adicional, paquete.moneda)}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-700">En base doble/triple/cuádruple</p>

        <Link
          href="/admin/login"
          className="block w-full text-center bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 rounded-xl transition-colors"
        >
          ¡Quiero comprar!
        </Link>
        <Link
          href="/admin/login"
          className="block w-full text-center bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>

      {/* Pedido */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <p className="font-bold text-gray-800 text-sm">Pedido</p>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4" />
            {adultos} adulto{adultos !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdultos((v) => Math.max(1, v - 1))}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
              aria-label="Quitar adulto"
            >
              −
            </button>
            <button
              onClick={() => setAdultos((v) => v + 1)}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
              aria-label="Agregar adulto"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4" />
            {menores} menor{menores !== 1 ? "es" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenores((v) => Math.max(0, v - 1))}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
              aria-label="Quitar menor"
            >
              −
            </button>
            <button
              onClick={() => setMenores((v) => v + 1)}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
              aria-label="Agregar menor"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
