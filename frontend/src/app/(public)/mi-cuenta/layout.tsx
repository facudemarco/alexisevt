"use client";

import { PublicHeader } from "@/app/(public)/PublicHeader";
import { CallToActionBanner } from "@/components/home/CallToActionBanner";
import { Footer } from "@/components/home/Footer";

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Same video hero header as cartelera */}
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
      </div>

      <main className="flex-1 bg-white w-full">
        {children}
      </main>

      <CallToActionBanner />
      <Footer />
    </div>
  );
}
