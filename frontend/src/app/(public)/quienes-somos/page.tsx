import Image from "next/image";
import Link from "next/link";

const valores = [
  {
    emoji: "🌎",
    titulo: "Confianza y transparencia",
    desc: "trabajamos con proveedores confiables y con la seguridad de un servicio registrado.",
  },
  {
    emoji: "🧳",
    titulo: "Atención personalizada",
    desc: "cada cliente recibe acompañamiento en la planificación, reserva y desarrollo de su viaje.",
  },
  {
    emoji: "💬",
    titulo: "Cercanía y comunicación",
    desc: "nos destacamos por un trato directo, claro y cordial, siempre disponibles en WhatsApp, mail y redes.",
  },
  {
    emoji: "🚌",
    titulo: "Experiencia y profesionalismo",
    desc: "más de 20 años en el sector nos permiten ofrecer un servicio integral y eficiente.",
  },
];

export default function QuienesSomosPage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero con video ─────────────────────────────────────────────────── */}
      <section className="relative h-[480px] md:h-[560px] bg-gray-900 overflow-hidden flex-shrink-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-90"
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
        <div className="absolute inset-0 bg-black/40" />

        {/* Título bottom-left */}
        <div className="absolute bottom-10 left-8 md:left-16 z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-lg leading-tight">
            ¿Quienes somos?
          </h1>
        </div>

        {/* Links bottom-right */}
        <div className="absolute bottom-10 right-8 md:right-16 z-10 flex flex-col items-end gap-2 font-bold text-white text-lg drop-shadow">
          <Link href="/" className="hover:underline">Inicio</Link>
          <Link href="/contacto" className="hover:underline">Contacto</Link>
        </div>
      </section>

      {/* ── Texto institucional ────────────────────────────────────────────── */}
      <section className="bg-[#F5F5F5] py-16 px-6 md:px-16">
        <div className="max-w-3xl mx-auto text-center space-y-8 text-lg md:text-xl leading-relaxed text-gray-800">
          <p>
            Somos una agencia de viajes con una trayectoria de más de veinte años
            de experiencia en la elaboración de <strong>experiencias únicas.</strong>{" "}
            Hemos forjado relaciones duraderas con <strong>hoteles</strong>, <strong>operadores</strong> y{" "}
            <strong>contactos</strong> en destinos nacionales y ofrecemos servicio personalizado
            tanto para viajes nacionales como internacionales. Nuestro enfoque se
            basa en la <strong>personalización</strong>, garantizando que cada viaje sea adaptado a
            los <strong>intereses y deseos</strong> de nuestros clientes.
          </p>
          <p>
            Ya sea un viaje breve o una aventura prolongada, nuestro compromiso
            con la <strong>calidad</strong>, el <strong>servicio</strong> y la <strong>atención al cliente</strong> hace de cada viaje
            una <strong>experiencia memorable.</strong>
          </p>
        </div>
      </section>

      {/* ── Banner avión ───────────────────────────────────────────────────── */}
      <section className="relative bg-[#2055A4] w-full overflow-hidden" style={{ minHeight: "220px" }}>
        {/* Estrellas / puntos decorativos */}
        {[
          { top: "18%", left: "5%" }, { top: "40%", left: "12%" },
          { top: "70%", left: "8%" }, { top: "25%", left: "55%" },
          { top: "60%", left: "75%" }, { top: "15%", left: "85%" },
          { top: "80%", left: "92%" },
        ].map((pos, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/60 rounded-full"
            style={{ top: pos.top, left: pos.left }}
          />
        ))}

        {/* Silueta ciudad (SVG inline simple) */}
        <svg
          className="absolute bottom-0 left-0 w-[35%] md:w-[25%] opacity-90"
          viewBox="0 0 400 160"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Torre Eiffel simplificada */}
          <polygon points="80,160 95,80 105,80 120,160" />
          <polygon points="90,80 105,20 110,20 115,80" />
          <rect x="86" y="60" width="28" height="4" />
          <rect x="82" y="90" width="36" height="4" />
          {/* Edificios */}
          <rect x="140" y="100" width="30" height="60" />
          <rect x="175" y="120" width="20" height="40" />
          <rect x="200" y="90" width="25" height="70" />
          <rect x="230" y="110" width="18" height="50" />
          <rect x="255" y="130" width="22" height="30" />
          <rect x="0" y="140" width="80" height="20" />
        </svg>

        {/* Avión */}
        <div className="absolute right-4 md:right-12 bottom-0 w-[55%] md:w-[42%] max-w-[520px]">
          <Image
            src="/resources/avion.png"
            alt="Avión"
            width={520}
            height={300}
            className="object-contain w-full h-auto"
          />
        </div>
      </section>

      {/* ── Nuestros valores ───────────────────────────────────────────────── */}
      <section className="bg-[#F5F5F5] py-16 px-6 md:px-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8">Nuestros valores.</h2>
          <ul className="space-y-6">
            {valores.map((v, i) => (
              <li key={i} className="flex items-start gap-3 text-lg md:text-xl text-gray-800 leading-relaxed">
                <span className="text-2xl mt-0.5 flex-shrink-0">{v.emoji}</span>
                <span>
                  <strong>{v.titulo}:</strong> {v.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </div>
  );
}
