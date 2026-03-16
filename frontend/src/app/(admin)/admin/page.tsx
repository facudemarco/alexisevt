import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaneTakeoff, Ticket, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard General</h1>
          <p className="text-gray-500 mt-1">Bienvenido al sistema de gestión operativa de AlexisEVT.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-brand-secondary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reservas</CardTitle>
            <Ticket className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">1,248</div>
            <p className="text-xs text-green-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1"/> +12% respecto al mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-secondary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Paquetes Activos</CardTitle>
            <PlaneTakeoff className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">45</div>
            <p className="text-xs text-gray-500 mt-1">En catálogo público</p>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-secondary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Vendedores Activos</CardTitle>
            <Users className="w-5 h-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">18</div>
            <p className="text-xs text-gray-500 mt-1">Agencias registradas</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
        <Card>
           <CardContent className="p-0">
             <div className="divide-y divide-gray-100">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Nueva reserva ingresada por 'Agencia {i}'</p>
                      <p className="text-xs text-gray-500">Hace {i*2} horas</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                  </div>
                ))}
             </div>
           </CardContent>
        </Card>
      </div>

    </div>
  );
}
