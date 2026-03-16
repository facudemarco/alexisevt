import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ConfigManagement() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Parámetros del Sistema</h1>
          <p className="text-gray-500 mt-1">Diccionarios, categorías, hoteles y puntos de encuentro.</p>
        </div>
      </div>
      <Card className="flex-1 flex flex-col p-8 items-center justify-center text-center bg-white">
          <Settings className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Sección en Construcción</h3>
      </Card>
    </div>
  );
}
