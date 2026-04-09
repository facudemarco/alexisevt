import { PackageCard } from "@/components/packages/PackageCard";
import { fetchApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Params {
  params: { slug: string };
}

export default async function CategoryPage({ params }: Params) {
  // Await params object as per next.js 15+ patterns (the current project is Next.js 16)
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const decodedSlug = decodeURIComponent(slug);

  // Derive title from slug (e.g. "miniturismo" -> "Miniturismo")
  const title = decodedSlug.replace(/-/g, " ");

  let paquetes = [];
  try {
    paquetes = await fetchApi(`/packages/by-category/${decodedSlug}`, { cache: "no-store" });
  } catch (error) {
    console.error("Error fetching packages:", error);
    if ((error as Error).message.includes("404")) {
      return notFound();
    }
  }

  // Agrupar paquetes por destino para mostrar subtítulos
  const gruposPorDestino: Record<string, typeof paquetes> = paquetes.reduce(
    (groups: Record<string, any[]>, pkg: any) => {
      const dest = pkg.destino?.nombre ?? "Sin destino";
      if (!groups[dest]) groups[dest] = [];
      groups[dest].push(pkg);
      return groups;
    },
    {}
  );
  const hayMultiplesDestinos = Object.keys(gruposPorDestino).length > 1;

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      {/* Top Header Background Video (behind the fixed navbar) */}
      <div className="w-full h-[160px] md:h-[200px] relative flex-shrink-0 overflow-hidden bg-gray-900">
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
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Main Content Area with faint background image */}
      <div className="relative flex-1 w-full bg-[#FAFAFA]">
        {/* Faint Background Image (Watermark) */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454496522488-7a8e488e8606')] bg-cover bg-fixed bg-center opacity-[0.04] pointer-events-none" 
        />
        
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-8 xl:px-12 py-10 md:py-16">
          {/* Title Section */}
          <h1 className="text-[40px] md:text-[56px] font-serif font-black text-[#1D5D8C] uppercase tracking-wide text-center mb-12 md:mb-16 italic drop-shadow-sm">
            {title}
          </h1>

          {paquetes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h3 className="text-xl text-gray-500 font-medium mb-4">No hay salidas disponibles por el momento para esta categoría.</h3>
              <Link href="/">
                <button className="bg-[#1D5D8C] hover:bg-[#164a70] text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Ver otros destinos
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-14">
              {Object.entries(gruposPorDestino).map(([destino, pkgs]) => {
                const isGroup = pkgs.length > 1;
                return (
                  <section key={destino}>
                    {/* Encabezado de destino: siempre si hay múltiples destinos, o si el destino tiene más de 1 paquete */}
                    {(hayMultiplesDestinos || isGroup) && (
                      <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-2xl md:text-3xl font-black text-[#1D5D8C] uppercase tracking-wide whitespace-nowrap">
                          {destino}
                        </h2>
                        <div className="flex-1 h-[2px] bg-[#1D5D8C]/20 rounded-full" />
                        {isGroup && (
                          <span className="text-sm font-semibold text-[#1D5D8C]/60 whitespace-nowrap">
                            {pkgs.length} opciones
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 xl:gap-14">
                      {pkgs.map((pkg: any) => (
                        <PackageCard key={pkg.id} pkg={pkg} compact={isGroup} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
