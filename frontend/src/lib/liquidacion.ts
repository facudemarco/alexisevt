export interface AdicionalPrecio {
  nombre: string;
  valor: string | number;
  aplica_comision?: boolean;
}

export function adicionalesLiquidacion(
  adicionales: AdicionalPrecio[] | undefined,
  precioAdicional: number,
  adultos: number,
) {
  if (adicionales?.length) {
    return adicionales.map((adicional) => ({
      descripcion: adicional.nombre || "Adicional",
      precio: String(Number(adicional.valor) || 0),
      cant_pax: adultos,
      aplica_comision: adicional.aplica_comision ?? true,
    }));
  }
  return Number(precioAdicional) > 0
    ? [{ descripcion: "Adicional", precio: String(precioAdicional), cant_pax: adultos, aplica_comision: true }]
    : [];
}

export function previewComision(input: string, persisted: number, base: number, subtotal: number, pagos: number) {
  const parsed = Number(input);
  const porcentaje = input.trim() && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : persisted;
  const comision = Math.round(Number(base) * porcentaje) / 100;
  return { comision, saldo: Number(subtotal) - comision - Number(pagos) };
}
