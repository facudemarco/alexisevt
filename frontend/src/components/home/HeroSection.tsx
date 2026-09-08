"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth-provider";

const DEFAULT_VIDEO_URL = "https://player.vimeo.com/video/1178920147?background=1&autoplay=1&loop=1&muted=1&autopause=0";
const DEFAULT_POSTER_URL = "/resources/hero_cartelera.png";

function formatVimeoEmbedUrl(url?: string): string {
  if (!url || url.trim() === "") return DEFAULT_VIDEO_URL;
  const trimmed = url.trim();

  // Si es un ID numérico ej: "1178920147"
  if (/^\d+$/.test(trimmed)) {
    return `https://player.vimeo.com/video/${trimmed}?background=1&autoplay=1&loop=1&muted=1&autopause=0`;
  }

  // Si es enlace estándar vimeo.com/1178920147 o con query params
  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}?background=1&autoplay=1&loop=1&muted=1&autopause=0`;
  }

  // Si ya es player.vimeo.com aseguramos los parámetros de fondo en loop
  if (trimmed.includes("player.vimeo.com")) {
    if (!trimmed.includes("background=1")) {
      const sep = trimmed.includes("?") ? "&" : "?";
      return `${trimmed}${sep}background=1&autoplay=1&loop=1&muted=1&autopause=0`;
    }
    return trimmed;
  }

  return trimmed;
}

export function HeroSection() {
  const { isAuthenticated, role, nombre } = useAuth();
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [posterUrl, setPosterUrl] = useState<string>(DEFAULT_POSTER_URL);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    fetch(`${apiUrl}/config/home-banner`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.video_url) {
          const mobile = window.matchMedia("(max-width: 767px)").matches;
          setVideoUrl(formatVimeoEmbedUrl(mobile && data.mobile_video_url ? data.mobile_video_url : data.video_url));
        }
        if (data?.poster_url) {
          setPosterUrl(data.poster_url);
        }
      })
      .catch((err) => {
        setVideoUrl(DEFAULT_VIDEO_URL);
        console.warn("No se pudo cargar el banner personalizado de la Home, usando default:", err);
      });
  }, []);

  const isDirectVideo =
    videoUrl.endsWith(".mp4") ||
    videoUrl.endsWith(".webm") ||
    videoUrl.endsWith(".mov") ||
    videoUrl.includes(".mp4?");

  return (
    <section className="relative h-[650px] flex items-center bg-gray-900 overflow-hidden px-8 md:px-24">
      {/* 
        Background Poster: Shows immediately while Vimeo loads 
      */}
      <div id="inicio"
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url('${posterUrl}')` }}
      />

      {/* 
        Video Background with Object-Cover Effect:
        - We make the video/iframe always 16:9 and at least 100% of the container.
        - Using transform translate to center it.
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isDirectVideo ? (
          <video
            key={videoUrl}
            src={videoUrl}
            poster={posterUrl}
            preload="auto"
            onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77vh] min-w-full min-h-full h-[100%] md:h-[56.25vw] object-cover opacity-100"
          />
        ) : videoUrl ? (
          <iframe
            src={videoUrl}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77vh] min-w-full min-h-full h-[100%] md:h-[56.25vw] opacity-100"
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            title="hero-alexis"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Top Right: login / mi cuenta / panel */}
      <div className="hidden md:block absolute top-8 right-8 md:top-12 md:right-12 z-20">
        {isAuthenticated && role === "admin" ? (
          <Link href="/admin">
            <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-2 px-4 rounded-md shadow-lg flex items-center gap-2">
              Panel de control <User className="w-4 h-4" />
            </Button>
          </Link>
        ) : isAuthenticated && role === "vendedor" ? (
          <Link href="/mi-cuenta">
            <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-2 px-4 rounded-md shadow-lg flex items-center gap-2">
              Mi cuenta <User className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/admin/login">
            <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-2 px-4 rounded-md shadow-lg flex items-center gap-2">
              Iniciar sesión <User className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Center/Left Content */}
      <div className="relative z-20 text-left w-full max-w-3xl mt-16 md:mt-0">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg leading-tight tracking-tight">
          Descubrí tu <br /> próxima aventura
        </h1>
        <Button
          className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-6 px-8 rounded-lg text-lg mt-2 shadow-lg w-fit"
          onClick={() => document.getElementById("periodos")?.scrollIntoView({ behavior: "smooth" })}
        >
          Ver opciones
        </Button>
      </div>

      {/* Bottom Left: Logo */}
      <div className="hidden md:block absolute bottom-8 left-8 md:bottom-12 md:left-24 z-20">
        <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden">
          <Image src="/resources/logo.png" alt="Alexis EVT Logo" fill sizes="120px" priority className="object-cover scale-110 mix-blend-multiply" />
        </div>
      </div>

      {/* Bottom Right: Links + optional username */}
      <div className="hidden md:flex absolute bottom-6 right-8 md:bottom-12 md:right-12 z-20 flex-col items-end gap-3 font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pr-4">
        {isAuthenticated && nombre && (
          <span className="text-base font-bold text-white/90 tracking-wide">
            {nombre} — {role === "admin" ? "Administrador" : "Vendedor/a"}
          </span>
        )}
        <Link href="/cartelera" className="text-lg md:text-xl hover:text-gray-200 transition-colors tracking-wide bg-black/20 px-3 py-1 rounded-md border border-transparent hover:border-white/20">Cartelera</Link>
        <Link href="/quienes-somos" className="text-lg md:text-xl hover:text-gray-200 transition-colors tracking-wide bg-black/20 px-3 py-1 rounded-md border border-transparent hover:border-white/20">¿Quiénes somos?</Link>
        <Link href="/contacto" className="text-lg md:text-xl hover:text-gray-200 transition-colors tracking-wide bg-black/20 px-3 py-1 rounded-md border border-transparent hover:border-white/20">Contacto</Link>
      </div>
    </section>
  );
}
