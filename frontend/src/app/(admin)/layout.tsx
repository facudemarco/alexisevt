"use client";
import { PlaneTakeoff, LayoutDashboard, Ticket, Users, MapPin, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-surface-bg">
        {/* Sidebar Admin */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shadow-sm">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-brand-primary">
              <PlaneTakeoff className="w-6 h-6 text-brand-accent" />
              <span>AlexisEVT Admin</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>
            <Link href="/admin/packages" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
              <PlaneTakeoff className="w-5 h-5" /> Paquetes
            </Link>
            <Link href="/admin/bookings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
              <Ticket className="w-5 h-5" /> Reservas
            </Link>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ajustes</p>
            </div>
            <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
              <Users className="w-5 h-5" /> Vendedores
            </Link>
            <Link href="/admin/cartelera" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
              <MapPin className="w-5 h-5" /> Cartelera Pública
            </Link>
            <Link href="/admin/config" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
              <Settings className="w-5 h-5" /> Parámetros
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button onClick={logout} className="flex items-center w-full gap-3 px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" /> Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
