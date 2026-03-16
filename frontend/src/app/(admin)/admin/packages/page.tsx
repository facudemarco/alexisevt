import { Card, CardContent } from "@/components/ui/card";
import { PlaneTakeoff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PackagesManagement() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Catálogo de Paquetes</h1>
          <p className="text-gray-500 mt-1">Gestión integral de viajes, salidas programadas e itinerarios.</p>
        </div>
        <Button className="bg-brand-primary" variant="default"><Plus className="w-4 h-4 mr-2"/> Cargar Nuevo Viaje</Button>
      </div>

      <Card className="flex-1 flex flex-col p-8 items-center justify-center text-center bg-white">
          <PlaneTakeoff className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Sección en Construcción</h3>
          <p className="text-gray-500 max-w-sm">Este módulo permitirá agendar paquetes estableciendo destino, hotel, bus/avión y tarifas finales.</p>
      </Card>
    </div>
  );
}
