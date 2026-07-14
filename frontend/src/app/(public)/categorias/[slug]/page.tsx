import { PackageCard } from "@/components/packages/PackageCard";
import { fetchApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CustomTripForm } from "@/components/packages/CustomTripForm";

interface Params {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ subperiodo?: string }>;
}

export default async function CategoryPage({ params, searchParams }: Params) {
  // Await params object as per next.js 15+ patterns (the current project is Next.js 16)
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams.slug;
  const decodedSlug = decodeURIComponent(slug);
  const selectedSubperiod = resolvedSearchParams?.subperiodo;

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

  const isMiniturismo = decodedSlug.toLowerCase() === "miniturismo";
  const isArgentina = decodedSlug.toLowerCase() === "argentina";
  const isElegiDondeViajar = decodedSlug.toLowerCase() === "elegi-donde-viajar";

  // Para Argentina, agrupar por subperiodo (campo periodo)
  const gruposPorPeriodo: Record<string, typeof paquetes> = isArgentina
    ? paquetes.reduce(
        (groups: Record<string, any[]>, pkg: any) => {
          const per = pkg.periodo && pkg.periodo.trim() !== "" ? pkg.periodo : "Salidas Generales";
          if (!groups[per]) groups[per] = [];
          groups[per].push(pkg);
          return groups;
        },
        {}
      )
    : {};

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

          {isElegiDondeViajar ? (
            <CustomTripForm />
          ) : paquetes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h3 className="text-xl text-gray-500 font-medium mb-4">No hay salidas disponibles por el momento para esta categoría.</h3>
              <Link href="/">
                <button className="bg-[#1D5D8C] hover:bg-[#164a70] text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Ver otros destinos
                </button>
              </Link>
            </div>
          ) : isMiniturismo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 xl:gap-14">
              {paquetes.map((pkg: any) => (
                <PackageCard key={pkg.id} pkg={pkg} compact={false} />
              ))}
            </div>
          ) : isArgentina ? (
            selectedSubperiod ? (
              // Vista de un subperíodo seleccionado (mosaico de paquetes)
              <div>
                <div className="mb-8 flex justify-start">
                  <Link
                    href="/categorias/argentina"
                    className="flex items-center gap-2 text-sm font-bold text-[#1D5D8C] hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" /> Ver todos los subperíodos de Argentina
                  </Link>
                </div>

                <div className="mb-12 text-center">
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Argentina</p>
                  <h2 className="text-3xl md:text-5xl font-black text-[#1D5D8C] uppercase tracking-wider italic font-serif mt-2">
                    {selectedSubperiod}
                  </h2>
                </div>

                {!(gruposPorPeriodo[selectedSubperiod]?.length > 0) ? (
                  <div className="text-center py-10 text-gray-500 font-medium">
                    No hay salidas disponibles para este subperíodo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 xl:gap-14">
                    {gruposPorPeriodo[selectedSubperiod].map((pkg: any) => (
                      <PackageCard key={pkg.id} pkg={pkg} compact={false} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Vista de selección de subperíodos (una card por subperíodo)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(gruposPorPeriodo).map(([periodo, pkgs]) => {
                  const subperiodBg = pkgs[0]?.imagen_url || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800";
                  return (
                    <Link
                      key={periodo}
                      href={`/categorias/argentina?subperiodo=${encodeURIComponent(periodo)}`}
                      className="group relative w-full h-[300px] rounded-2xl overflow-hidden shadow-lg block transition-all"
                    >
                      <Image
                        src={subperiodBg}
                        alt={periodo}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/40" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                        <h2 className="text-3xl font-bold tracking-wide drop-shadow uppercase">{periodo}</h2>
                        <div className="w-12 h-[2px] bg-white/45 mt-3" />
                        <p className="text-sm font-semibold text-white/80 mt-2">
                          {pkgs.length} {pkgs.length === 1 ? "salida disponible" : "salidas disponibles"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
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
