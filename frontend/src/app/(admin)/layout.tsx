"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";
import { PublicHeader } from "@/app/(public)/PublicHeader";
import { CallToActionBanner } from "@/components/home/CallToActionBanner";
import { Footer } from "@/components/home/Footer";
import { Package, Settings, BookOpen, Newspaper, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/admin/NotificationBell";

const navItems = [
  { href: "/admin/packages",  label: "Paquetes",   icon: Package },
  { href: "/admin/config",    label: "Parámetros", icon: Settings },
  { href: "/admin/bookings",  label: "Reservas",   icon: BookOpen },
  { href: "/admin/cartelera", label: "Cartelera",  icon: Newspaper },
  { href: "/admin/users",     label: "Usuarios",   icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, nombre, role } = useAuth();
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">

        {/* Header con video */}
        <div className="relative h-[180px] md:h-[220px] bg-gray-900 overflow-hidden flex-shrink-0">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{ backgroundImage: "url('/resources/hero_cartelera.png')" }}
          />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <iframe
              src="https://player.vimeo.com/video/1178920147?background=1&autoplay=1&loop=1&muted=1&autopause=0"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77vh] min-w-full min-h-full h-[100%] md:h-[56.25vw] opacity-100"
              allow="autoplay; fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              title="hero-alexis"
              aria-hidden="true"
            />
          </div>
          <div className="absolute inset-0 bg-black/40" />
          <PublicHeader />
          {/* Nombre + rol bottom-right */}
          {nombre && (
            <div className="absolute bottom-4 right-6 md:right-12 z-20 flex items-center gap-3">
              <NotificationBell />
              <span className="text-white font-semibold text-sm drop-shadow">
                {nombre} — {role === "admin" ? "Admin" : "Vendedor/a"}
              </span>
            </div>
          )}
        </div>

        {/* Layout principal: card centrada sobre fondo celeste */}
        <div className="flex-1 bg-[#B8D9EA] flex items-start justify-center py-10 px-4 md:px-8 relative">
          <div className="w-full max-w-[1440px] flex rounded-2xl overflow-hidden shadow-xl min-h-[520px]">

            {/* Sidebar azul */}
            <aside className="w-52 bg-[#1D5D8C] flex flex-col flex-shrink-0">
              {/* Logo */}
              <Link href="/admin" className="flex justify-center py-8">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 relative hover:border-white/70 transition-colors">
                  <Image src="/resources/logo.png" alt="Logo" fill sizes="96px" className="object-cover" />
                </div>
              </Link>

              {/* Nav */}
              <nav className="flex-1 px-3 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors",
                      pathname.startsWith(href)
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Cerrar sesión */}
              <div className="p-4">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </aside>

            {/* Contenido blanco */}
            <main className="flex-1 bg-white overflow-y-auto">
              {children}
            </main>
          </div>

        </div>

        <CallToActionBanner />
        <Footer />
      </div>
    </AuthGuard>
  );
}
