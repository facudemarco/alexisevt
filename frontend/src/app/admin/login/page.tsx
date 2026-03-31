"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { fetchApi } from "@/lib/api";
import { PublicHeader } from "@/app/(public)/PublicHeader";
import { CallToActionBanner } from "@/components/home/CallToActionBanner";
import { Footer } from "@/components/home/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetchApi("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      login(response.access_token, response.rol, response.nombre);
      window.location.href = response.rol === "admin" ? "/admin" : "/";
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header con video de fondo */}
      <div className="relative h-[200px] md:h-[260px] bg-gray-900 overflow-hidden flex-shrink-0">
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

      {/* Sección del formulario */}
      <main className="flex-1 relative flex flex-col items-center justify-center py-16 px-4">
        {/* Video de fondo muy atenuado */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/resources/hero_cartelera.png')" }}
        />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src="https://player.vimeo.com/video/1178921212?background=1&autoplay=1&loop=1&muted=1&autopause=0"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77vh] min-w-full min-h-full h-[100%] md:h-[56.25vw] opacity-100"
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            title="login-bg-alexis"
            aria-hidden="true"
          />
        </div>
        <div className="absolute inset-0 bg-white/70" />

        {/* Contenido del formulario */}
        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl relative">
            <Image
              src="/resources/logo.png"
              alt="Alexis EVT Logo"
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>

          {/* Título */}
          <h1 className="text-5xl font-black text-gray-900">Iniciar sesión</h1>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
            <input
              type="email"
              placeholder="Correo electrónico"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 px-5 text-lg rounded-lg border-2 border-[#1D5D8C]/40 bg-white/80 placeholder:text-[#1D5D8C]/60 text-gray-800 outline-none focus:border-[#1D5D8C] transition-colors"
            />

            <input
              type="password"
              placeholder="Contraseña"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 px-5 text-lg rounded-lg border-2 border-[#1D5D8C]/40 bg-white/80 placeholder:text-[#1D5D8C]/60 text-gray-800 outline-none focus:border-[#1D5D8C] transition-colors"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100 text-center font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#1D5D8C] hover:bg-[#164a70] text-white text-lg font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Ingresar"}
            </button>
          </form>
        </div>
      </main>

      <CallToActionBanner />
      <Footer />
    </div>
  );
}
