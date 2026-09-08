"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

type Job = { id: string; status: "queued" | "processing" | "ready" | "error"; message: string; fps?: number; duration?: number };
type Banner = { video_url: string; mobile_video_url?: string; poster_url?: string };

export function VideoBannerTab() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [limits, setLimits] = useState({ max_size_mb: 500, max_duration_seconds: 1800 });
  const busy = uploading || job?.status === "queued" || job?.status === "processing";

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const [current, status] = await Promise.all([
          fetchApi("/config/home-banner"), fetchApi("/config/home-banner/upload-status"),
        ]);
        if (!cancelled) {
          setBanner(current);
          setJob(status.job);
          setLimits(status);
        }
      } catch {
        if (!cancelled) setError("No se pudo consultar el estado. Se volverá a intentar automáticamente.");
      } finally {
        if (!cancelled) timer = setTimeout(refresh, 4000);
      }
    }
    void refresh();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (file.size > limits.max_size_mb * 1024 * 1024) {
      setError(`El archivo supera ${limits.max_size_mb} MB.`);
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      setJob(await fetchApi("/config/home-banner/upload-video", { method: "POST", body }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el video.");
    } finally {
      setUploading(false);
    }
  }

  const legacy = banner?.video_url.includes("vimeo.com");
  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Video del banner</h2>
        <p className="text-sm text-gray-600">Subí un video desde tu dispositivo. Se optimizará para escritorio y celulares y se publicará cuando esté listo. Mientras tanto seguirá visible el banner anterior.</p>
        <p className="text-sm text-gray-600">MP4, MOV, WebM o M4V · Hasta {limits.max_size_mb} MB y {Math.round(limits.max_duration_seconds / 60)} minutos. Recomendamos videos horizontales cortos, de 15 a 45 segundos. Conservamos hasta 60 fps si el original los tiene; el banner se reproduce sin sonido.</p>
        <label className="block text-sm font-semibold text-gray-800">
          Reemplazar video
          <input type="file" accept=".mp4,.mov,.webm,.m4v" disabled={busy} onChange={upload} className="mt-2 block w-full rounded-lg border p-3 disabled:opacity-50" />
        </label>
        <div role="status" aria-live="polite" className="text-sm text-gray-700">
          {uploading ? "Subiendo archivo… Mantené esta pestaña abierta hasta que termine la carga." : job?.message}
          {!uploading && (job?.status === "queued" || job?.status === "processing") && <p className="mt-2">Podés salir del panel: la preparación continuará y el video se publicará automáticamente.</p>}
          {job?.status === "ready" && job.fps && <p>{job.fps.toFixed(2)} fps · {Math.round(job.duration ?? 0)} segundos</p>}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
        <h3 className="font-bold text-gray-900">Banner publicado</h3>
        {!banner ? <p>Cargando vista previa…</p> : legacy ? (
          <p className="text-sm text-gray-600">El banner anterior seguirá activo hasta que subas tu primer video.</p>
        ) : (
          <video key={banner.video_url} src={banner.video_url} poster={banner.poster_url} controls muted playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black" />
        )}
      </div>
    </div>
  );
}
