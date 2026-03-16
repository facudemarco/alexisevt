import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function CarteleraManagement() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cartelera Pública</h1>
          <p className="text-gray-500 mt-1">Flyers, posters y promociones visibles en la Landing Page.</p>
        </div>
      </div>
      <Card className="flex-1 flex flex-col p-8 items-center justify-center text-center bg-white">
          <MapPin className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Sección en Construcción</h3>
      </Card>
    </div>
  );
}
