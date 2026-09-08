import Image from "next/image";
import Link from "next/link";

interface CategoryItem {
  id: number;
  nombre: string;
  slug?: string;
  imagen_url?: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 1,
    nombre: "Miniturismo",
    slug: "miniturismo",
    imagen_url: "/resources/miniturismo.png",
  },
  {
    id: 2,
    nombre: "Argentina",
    slug: "argentina",
    imagen_url: "/resources/argentina.png",
  },
  {
    id: 3,
    nombre: "Brasil",
    slug: "brasil",
    imagen_url: "/resources/brasil.png",
  },
  {
    id: 4,
    nombre: "Elegí dónde viajar",
    slug: "elegi-donde-viajar",
    imagen_url: "/resources/Individuales.svg",
  },
];

const DEFAULT_IMAGES_BY_SLUG: Record<string, string> = {
  miniturismo: "/resources/miniturismo.png",
  argentina: "/resources/argentina.png",
  brasil: "/resources/brasil.png",
  "otros-internacionales": "/resources/internacionales.png",
  internacional: "/resources/internacionales.png",
  "elegi-cuando-viajar": "/resources/Individuales.svg",
  "elegi-donde-viajar": "/resources/Individuales.svg",
  individuales: "/resources/Individuales.svg",
};

function resolveImageUrl(url?: string | null, slug?: string): string {
  const normalizedSlug = (slug || "").toLowerCase().trim();
  const fallback = DEFAULT_IMAGES_BY_SLUG[normalizedSlug] || "/resources/miniturismo.png";

  if (!url || url.trim() === "") return fallback;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";
  return `${apiBase}/${url}`;
}

async function getCategories(): Promise<CategoryItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${apiUrl}/config/categorias/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Error fetching categories");
    const data: CategoryItem[] = await res.json();
    return data && data.length > 0 ? data : DEFAULT_CATEGORIES;
  } catch (err) {
    console.error("Error fetching categories from API, using fallback:", err);
    return DEFAULT_CATEGORIES;
  }
}

export async function CategoryList() {
  const categories = await getCategories();

  return (
    <section id="periodos" className="py-20 -mt-16 relative z-30 flex flex-col items-center w-full">
      <div className="bg-white w-full py-16 px-4 md:px-12 shadow-sm rounded-t-[30px]">
        <h2 className="text-xl md:text-2xl tracking-[0.1em] font-black text-center mb-10 text-gray-900 uppercase">
          Todas nuestras opciones
        </h2>

        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-6">
          {categories.map((cat) => {
            const cardSlug = cat.slug || cat.nombre.toLowerCase().replace(/\s+/g, "-");
            const imageUrl = resolveImageUrl(cat.imagen_url, cardSlug);

            return (
              <Link
                href={`/categorias/${cardSlug}`}
                key={cat.id || cardSlug}
                className="group relative block aspect-[3/4] w-full max-w-[340px] overflow-hidden rounded-2xl bg-slate-900 shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#1D5D8C] motion-reduce:transform-none motion-reduce:transition-none sm:w-[calc(50%-0.75rem)] sm:max-w-none lg:w-[calc(25%-1.125rem)]"
              >
                <Image
                  src={imageUrl}
                  alt={cat.nombre}
                  fill
                  sizes="(max-width: 639px) 340px, (max-width: 1023px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
                  unoptimized={imageUrl.startsWith("http")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 space-y-3 p-6">
                  <div className="h-0.5 w-9 bg-white/70" />
                  <h3 className="break-words text-2xl font-black uppercase leading-tight tracking-wide text-white drop-shadow-md">
                    {cat.nombre}
                  </h3>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                    Ver opciones <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
