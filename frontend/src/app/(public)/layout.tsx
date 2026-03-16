import { PlaneTakeoff, Menu, UserCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Navbar Pública */}
      <header className="absolute top-0 w-full z-50 py-4">
        <div className="container mx-auto px-4 lg:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* Logo Placeholder - As in Figma */}
            <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center p-2 shadow-lg border-2 border-brand-primary">
               <PlaneTakeoff className="w-10 h-10 text-brand-primary" />
               <span className="text-[10px] font-bold text-center text-brand-primary leading-tight mt-1">Alexis EVT<br/>Legajo 12712</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link href="/">
              <span className="bg-sky-200 hover:bg-sky-300 text-gray-900 px-6 py-2.5 rounded-xl font-bold transition-colors">Inicio</span>
            </Link>
            <Link href="/quienes-somos">
               <span className="bg-sky-200 hover:bg-sky-300 text-gray-900 px-6 py-2.5 rounded-xl font-bold transition-colors">¿Quiénes somos?</span>
            </Link>
            <Link href="/contacto">
               <span className="bg-sky-200 hover:bg-sky-300 text-gray-900 px-6 py-2.5 rounded-xl font-bold transition-colors">Contacto</span>
            </Link>
          </nav>

          <div className="flex items-center">
            <Link href="/admin/login">
              <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl px-6 py-5 hidden md:flex text-md shadow-md">
                 Iniciar sesión <UserCircle className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10 ml-4">
              <Menu className="w-8 h-8" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-surface-bg w-full">
        {children}
      </main>

      {/* Footer Público */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="bg-brand-primary py-4 px-6 relative overflow-hidden flex flex-col items-center text-center">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 z-10 font-serif italic">Tu próxima aventura empieza acá...</h3>
            <a href="https://wa.me/5491121721486" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#22C55E] hover:bg-[#1ea951] text-white px-8 py-3 rounded-full font-bold shadow-lg z-10 transition-transform hover:scale-105">
                <MessageCircle className="w-5 h-5"/> Enviar WhatsApp
            </a>
            <div className="absolute inset-0 bg-black/10 z-0"></div>
        </div>

        <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
             <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center p-2 mb-4">
               <PlaneTakeoff className="w-8 h-8 text-brand-primary" />
               <span className="text-[8px] font-bold text-center text-brand-primary leading-tight mt-1">Alexis EVT</span>
             </div>
             <p className="text-sm text-gray-400">Mayorista de viajes y turismo. Experiencias únicas por Argentina y el mundo.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-lg tracking-wide uppercase">Mapa del sitio</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link href="/quienes-somos" className="hover:text-white transition-colors">¿Quiénes somos?</Link></li>
              <li><Link href="/cartelera" className="hover:text-white transition-colors">Catálogo Completo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-lg tracking-wide uppercase">Opciones de Viajes</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/cartelera?destino=miniturismo" className="hover:text-white transition-colors">Miniturismo</Link></li>
              <li><Link href="/cartelera?destino=argentina" className="hover:text-white transition-colors">Argentina</Link></li>
              <li><Link href="/cartelera?destino=brasil" className="hover:text-white transition-colors">Brasil</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 pb-6 text-sm text-center flex flex-col items-center justify-center border-t border-gray-800 pt-6">
          <p className="mb-2">Desarrollado por IWEB</p>
          <p className="text-gray-500">© {new Date().getFullYear()} AlexisEVT - Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
