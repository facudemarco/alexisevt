"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { PackageForm } from "@/components/admin/PackageForm";
import { Loader2 } from "lucide-react";

export default function EditPackagePage() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchApi(`/packages/${id}`)
      .then((pkg) => {
        setInitialData({
          destino_id: String(pkg.destino_id ?? ""),
          categoria_id: String(pkg.categoria_id ?? ""),
          imagen_url: pkg.imagen_url ?? "",
          tipo_salidas: pkg.tipo_salidas ?? "FECHA_ESPECIFICA",
          fecha_salida: pkg.fecha_salida ?? "",
          fecha_regreso: pkg.fecha_regreso ?? "",
          duracion_dias: String(pkg.duracion_dias ?? ""),
          duracion_noches: String(pkg.duracion_noches ?? ""),
          titulo_subtitulo: pkg.titulo_subtitulo ?? "",
          moneda: pkg.moneda ?? "ARS",
          precio_base: String(pkg.precio_base ?? ""),
          adicionales_precio: Array.isArray(pkg.adicionales_json?.adicionales_precio)
            ? pkg.adicionales_json.adicionales_precio.map((a: any) => ({
                nombre: a.nombre ?? "",
                valor: a.valor ? String(a.valor) : "",
              }))
            : [],
          adicionales: Array.isArray(pkg.adicionales) && pkg.adicionales.length > 0 ? pkg.adicionales : [""],
          transporte_activo: Array.isArray(pkg.transportes) && pkg.transportes.length > 0,
          transporte_id: pkg.transportes?.[0]?.id ? String(pkg.transportes[0].id) : "",
          transporte_tipo: pkg.transporte_tipo ?? "",
          horario_salida: pkg.horario_salida ?? "",
          horario_regreso: pkg.horario_regreso ?? "",
          punto_ascenso_ids: Array.isArray(pkg.puntos_ascenso) ? pkg.puntos_ascenso.map((p: any) => p.id) : [],
          alojamiento_activo: Array.isArray(pkg.hotel_detalles) && pkg.hotel_detalles.length > 0,
          hotel_detalles: Array.isArray(pkg.hotel_detalles) && pkg.hotel_detalles.length > 0
            ? pkg.hotel_detalles.map((d: any) => ({
                hotel_id: d.hotel_id ? String(d.hotel_id) : "",
                regimen: d.regimen ?? "",
                cantidad_noches: d.cantidad_noches ? String(d.cantidad_noches) : "",
                precio: d.precio ? String(d.precio) : "",
              }))
            : [{ hotel_id: "", regimen: "", cantidad_noches: "", precio: "" }],
          include_transfer: pkg.include_transfer ?? false,
          include_asistencia_medica: pkg.include_asistencia_medica ?? false,
        });
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="p-8 text-red-500 font-semibold">
        No se pudo cargar el paquete.
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando paquete...
      </div>
    );
  }

  return <PackageForm initialData={initialData as any} packageId={Number(id)} />;
}
