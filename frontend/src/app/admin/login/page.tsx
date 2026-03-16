"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { PlaneTakeoff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";

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
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      login(response.access_token, response.rol);
      router.push("/admin"); 
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Background Image Blurred (Figma Spec) */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop')" }} />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-0" />
      
      {/* Logo Floating */}
      <div className="z-10 bg-white/90 p-3 rounded-full shadow-2xl mb-8 border border-white/40">
        <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center p-2 border-2 border-brand-primary">
            <PlaneTakeoff className="w-10 h-10 text-brand-primary" />
            <span className="text-[10px] font-bold text-center text-brand-primary leading-tight mt-1">Alexis EVT<br/>Legajo 12712</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 w-[90%]">
        <div className="bg-white/95 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/50">
          <h2 className="text-center text-4xl font-extrabold text-gray-900 mb-8 font-sans tracking-tight">
            Iniciar sesión
          </h2>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="bg-gray-100/50 border-gray-200 h-14 rounded-2xl px-5 text-lg placeholder:text-gray-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
               <div className="mt-1">
                 <Input
                   id="password"
                   name="password"
                   type="password"
                   autoComplete="current-password"
                   required
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Contraseña"
                   className="bg-gray-100/50 border-gray-200 h-14 rounded-2xl px-5 text-lg placeholder:text-gray-400 focus:bg-white transition-colors"
                 />
               </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl h-14 text-lg font-bold shadow-lg transition-transform hover:scale-[1.02]" disabled={loading}>
                {loading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : "Ingresar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
