import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alexis EVT — Viajes y Aventuras",
  description:
    "Descubrí los mejores paquetes de viaje y aventura con Alexis EVT. Miniturismo, destinos nacionales e internacionales. Reservas online simples y seguras.",
  metadataBase: new URL("https://alexis-evt.tur.ar"),
  openGraph: {
    title: "Alexis EVT — Viajes y Aventuras",
    siteName: "Alexis EVT",
    locale: "es_AR",
    type: "website",
  },
};

import { AuthProvider } from "@/components/auth-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
