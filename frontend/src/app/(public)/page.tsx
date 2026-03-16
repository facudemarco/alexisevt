import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-[#EAEAEA] min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[650px] flex items-center bg-gray-900 overflow-hidden px-8 md:px-24">
        {/* Placeholder para imagen de fondo (Figma) */}
        <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        <div className="relative z-20 text-left pt-24 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg leading-tight tracking-tight">
            Descubrí tu <br/> próxima aventura
          </h1>
          <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-6 px-8 rounded-xl text-lg mt-4 shadow-lg">
             Ver opciones
          </Button>
        </div>
      </section>

      {/* Categorías (Todas Nuestras Opciones) */}
      <section className="py-20 -mt-16 relative z-30 flex flex-col items-center w-full">
        <div className="bg-white/95 backdrop-blur-sm w-full py-16 px-4 md:px-12 shadow-sm rounded-t-[30px]">
           <h2 className="text-sm tracking-[0.2em] font-bold text-center mb-10 text-gray-900 uppercase">Todas nuestras opciones</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             {/* Miniturismo */}
             <div className="group cursor-pointer relative h-[350px] rounded-3xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549880338-65dd4bd82f8b?q=80&w=1470&auto=format&fit=crop')" }} />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center text-white font-black text-3xl tracking-wide uppercase drop-shadow-md">
                   Miniturismo
                </div>
             </div>
             
             {/* Argentina */}
             <div className="group cursor-pointer relative h-[350px] rounded-3xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579737190161-12c82305370f?q=80&w=1506&auto=format&fit=crop')" }} />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center text-white font-black text-3xl tracking-wide uppercase drop-shadow-md">
                   Argentina
                </div>
             </div>
             
             {/* Internacionales */}
             <div className="group cursor-pointer relative h-[350px] rounded-3xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1470&auto=format&fit=crop')" }} />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center text-white font-black text-3xl tracking-wide uppercase drop-shadow-md text-center px-4 leading-tight">
                   Viajes<br/>Internacionales
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* Cartelera Previa */}
      <section className="pb-24 max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center">
            <h2 className="text-4xl text-brand-primary font-serif italic mb-12">Nuestros destinos favoritos...</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
              {[1, 2, 3, 4].map((i) => (
                 <div key={i} className="bg-white rounded-[2rem] p-4 shadow-md flex flex-col hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="w-full h-80 rounded-[1.5rem] bg-gray-200 overflow-hidden relative mb-4">
                       <Image src={`https://images.unsplash.com/photo-1549880338-65dd4bd82f8b?q=80&w=500&auto=format&fit=crop`} alt="Dummy" layout="fill" objectFit="cover" />
                       <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800">12 DIC 2026</div>
                    </div>
                    <div className="px-2">
                      <h4 className="font-bold text-lg text-gray-900 leading-tight">Iguazú Express</h4>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Vuelo Incluido</p>
                      
                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                         <div>
                            <span className="text-xs text-brand-primary font-bold">PRECIO FINAL</span>
                            <div className="text-xl font-black text-gray-900">$250.000</div>
                         </div>
                      </div>
                    </div>
                 </div>
              ))}
            </div>
            
            <Link href="/cartelera" className="mt-12">
               <Button className="bg-white text-brand-primary border-2 border-brand-primary hover:bg-brand-primary hover:text-white rounded-full px-8 py-6 font-bold transition-all shadow-sm">
                 Ver todo el catálogo en Cartelera
               </Button>
            </Link>
        </div>
      </section>
    </div>
  );
}
