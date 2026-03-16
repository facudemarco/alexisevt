"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2, RefreshCw, PlaneTakeoff } from "lucide-react";
import { fetchApi } from "@/lib/api";

type BookingStatus = "Pendiente" | "Aprobada" | "Rechazada";

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Todas" | BookingStatus>("Todas");
  const [search, setSearch] = useState("");
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/bookings/");
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    let result = bookings;
    if (activeTab !== "Todas") {
      result = result.filter(b => b.estado_reserva === activeTab);
    }
    if (search.trim()) {
      result = result.filter(b => 
         b.id.toString().includes(search) || 
         b.vendedor_id?.toString().includes(search)
      );
    }
    setFilteredBookings(result);
  }, [bookings, activeTab, search]);

  const updateStatus = async (id: number, nuevoEstado: string) => {
     setChangingStatusId(id);
     try {
        await fetchApi(`/bookings/${id}/status`, {
           method: "PATCH",
           body: JSON.stringify({ estado: nuevoEstado })
        });
        // Mutate array directly for snappy UI
        setBookings(prev => prev.map(b => b.id === id ? { ...b, estado_reserva: nuevoEstado } : b));
     } catch (e: any) {
        alert(e.message || "Error al actualizar estado");
     } finally {
        setChangingStatusId(null);
     }
  };

  const statusColors: Record<BookingStatus, string> = {
     "Pendiente": "bg-yellow-100 text-yellow-800 ring-yellow-800/20",
     "Aprobada": "bg-green-100 text-green-800 ring-green-800/20",
     "Rechazada": "bg-red-100 text-red-800 ring-red-800/20"
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Reservas</h1>
          <p className="text-gray-500 mt-1">Control de files centralizado estilo planilla.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={loadBookings} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/> Actualizar</Button>
            <Button variant="default" className="bg-brand-primary">Nueva Reserva</Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-white shadow-sm border border-gray-200">
        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 border-b border-gray-100 flex gap-4 items-center bg-gray-50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
               className="pl-9 h-10 border-gray-200 bg-white" 
               placeholder="Buscar por ID de File o Vendedor..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="ml-auto inline-flex bg-gray-200/50 p-1 rounded-lg">
             {(["Todas", "Pendiente", "Aprobada", "Rechazada"] as const).map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-900'}`}
                 >
                   {tab}
                 </button>
             ))}
          </div>
        </div>

        {/* Tabla Estilo Excel Integrada con BBDD */}
        <div className="flex-1 overflow-auto bg-white">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
               <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
               <p className="text-sm">Cargando datos maestros...</p>
             </div>
          ) : (
             <Table>
               <TableHeader className="bg-gray-50/80 sticky top-0 shadow-sm z-10 w-full backdrop-blur-sm">
                 <TableRow>
                   <TableHead className="w-[100px] font-bold text-gray-700 uppercase text-xs">ID File</TableHead>
                   <TableHead className="font-bold text-gray-700 uppercase text-xs">Agencia / Vend.</TableHead>
                   <TableHead className="font-bold text-gray-700 uppercase text-xs">Paquete Relacionado</TableHead>
                   <TableHead className="font-bold text-gray-700 uppercase text-xs text-center border-l bg-gray-50">Ad / Mn</TableHead>
                   <TableHead className="font-bold text-gray-700 uppercase text-xs text-right border-l bg-gray-50 text-brand-primary">Monto Total</TableHead>
                   <TableHead className="font-bold text-gray-700 uppercase text-xs text-center border-l">Estado Vigente</TableHead>
                   <TableHead className="font-bold text-gray-700 uppercase text-xs text-center">Acciones</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody className="divide-y divide-gray-100">
                 {filteredBookings.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                       <PlaneTakeoff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                       No se encontraron reservas con los filtros actuales.
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredBookings.map((booking) => (
                     <TableRow key={booking.id} className="hover:bg-blue-50/30 transition-colors">
                       <TableCell className="font-semibold text-gray-900">#{7060 + booking.id}</TableCell>
                       <TableCell className="text-gray-600">ID Vendedor: {booking.vendedor_id}</TableCell>
                       <TableCell className="text-gray-600">ID Paquete: {booking.paquete_id}</TableCell>
                       <TableCell className="text-center font-medium bg-gray-50/30 border-l border-gray-100 text-gray-600">{booking.pasajeros_adultos} / {booking.pasajeros_menores}</TableCell>
                       <TableCell className="text-right font-bold text-brand-primary bg-gray-50/30 border-l border-gray-100">${booking.precio_total?.toLocaleString('es-AR')}</TableCell>
                       <TableCell className="text-center border-l border-gray-100">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusColors[booking.estado_reserva as BookingStatus] || 'bg-gray-100 text-gray-800 ring-gray-200'}`}>
                           {booking.estado_reserva}
                         </span>
                       </TableCell>
                       <TableCell className="text-center">
                          <select 
                            className="text-xs bg-gray-50 border border-gray-200 text-gray-700 rounded-md py-1.5 px-2 outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
                            value={booking.estado_reserva}
                            disabled={changingStatusId === booking.id}
                            onChange={(e) => updateStatus(booking.id, e.target.value)}
                          >
                             <option value="Pendiente">Marcar Pendiente</option>
                             <option value="Aprobada">Aprobar (Pago ok)</option>
                             <option value="Rechazada">Rechazar/Caída</option>
                          </select>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
