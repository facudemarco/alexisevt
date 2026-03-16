import { Card } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UsersManagement() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Agencias y Vendedores</h1>
          <p className="text-gray-500 mt-1">ABM de usuarios que pueden loguearse al sistema.</p>
        </div>
        <Button className="bg-brand-primary"><UserPlus className="w-4 h-4 mr-2"/> Registrar Vendedor</Button>
      </div>

      <Card className="flex-1 flex flex-col p-8 items-center justify-center text-center bg-white">
          <Users className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Sección en Construcción</h3>
      </Card>
    </div>
  );
}
