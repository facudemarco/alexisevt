import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    title: "Miniturismo",
    slug: "miniturismo",
    image: "/resources/miniturismo.png",
  },
  {
    title: "Argentina",
    slug: "argentina",
    image: "/resources/argentina.png",
  },
  {
    title: "Brasil",
    slug: "brasil",
    image: "/resources/brasil.png",
  },
  {
    title: "Elegí dónde viajar",
    slug: "elegi-donde-viajar",
    image: "/resources/Individuales.svg",
  },
];

export function CategoryList() {
  return (
    <section id="periodos" className="py-20 -mt-16 relative z-30 flex flex-col items-center w-full">
      <div className="bg-white w-full py-16 px-4 md:px-12 shadow-sm rounded-t-[30px]">
        <h2 className="text-xl md:text-2xl tracking-[0.1em] font-black text-center mb-10 text-gray-900 uppercase">
          Todas nuestras opciones
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {categories.map((cat, idx) => {
            const isCenteredOddCard =
              categories.length % 2 === 1 && idx === categories.length - 1;

            return (
              <Link
                href={`/categorias/${cat.slug}`}
                key={cat.slug}
                className={
                  isCenteredOddCard
                    ? "md:col-span-2 md:w-[calc(50%-1rem)] md:justify-self-center"
                    : undefined
                }
              >
                <div className="group cursor-pointer relative h-[220px] md:h-[260px] w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1 [will-change:transform] [transform:translateZ(0)]">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03] [will-change:transform]"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute inset-0 p-6 flex items-end">
                    <h3 className="text-white text-2xl font-bold uppercase tracking-wider drop-shadow-md">
                      {cat.title}
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
