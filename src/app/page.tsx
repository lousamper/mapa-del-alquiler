import Link from "next/link";
import Navbar from "@/components/Navbar";
import ContactSection from "@/components/ContactSection";


export default function Home() {
  return (
    <main className="flex flex-col">
      <Navbar />

      {/* SCROLL 1: HERO */}
      <section className="relative min-h-[82vh] w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/hero-map.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "50% 35%",
          }}
        />
        <div className="absolute inset-0 bg-white/55" />

        <div className="relative mx-auto flex min-h-[82vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-black tracking-tight text-navy md:text-5xl md:font-extrabold">
            EXPLORA RESEÑAS
            <br />
            DE PISOS Y HABITACIONES EN TU CIUDAD
          </h1>

          <form
            className="mt-5 flex w-full max-w-xl items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm"
            action="/map"
            method="GET"
          >
            <input
              name="q"
              placeholder="Dirección o provincia"
              className="w-full bg-transparent text-navy outline-none placeholder:text-navy/40"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2 font-semibold text-background hover:opacity-90"
            >
              Buscar
            </button>
          </form>

          {/* NUEVO CTA debajo del buscador */}
          <div className="mt-4 flex flex-col items-center">
            <p className="text-sm font-semibold text-navy md:text-base">
              ¿Viviste en un piso en España?
            </p>

            <Link
  href="/add-review"
  className="mt-0.70 text-sm font-semibold text-navy underline underline-offset-4 hover:opacity-70"
>
  Comparte tu experiencia
</Link>
          </div>
        </div>
      </section>

      {/* SCROLL 2 */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-navy md:text-5xl">
              ALQUILAR A CIEGAS
              <br />
              YA NO VA MÁS
            </h2>

            <p className="mt-6 max-w-md text-navy/70">
              Esta página existe para que puedas saber dónde te estás metiendo,
              si el precio es justo y si realmente vale la pena antes de firmar
              un contrato.
            </p>

            <p className="mt-4 max-w-md text-navy/70">
              Tu experiencia puede ayudar a otras personas a evitar malas
              decisiones (o a confirmar que un piso sí vale la pena✨).
            </p>

            <div className="mt-10">
              <p className="text-sm font-semibold text-navy">
                ¿Viviste en un piso que debería tener reseña?
              </p>

              <div className="mt-4 flex items-center gap-4">
                <Link
  href="/add-review"
  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90"
>
  DEJA UNA RESEÑA
</Link>

              </div>

              <p className="mt-3 text-xs text-navy/60">
                Anónimo · Gratis · En menos de 3 minutos
              </p>
            </div>
          </div>

          {/* Imagen desktop 623x672 */}
          <div className="flex justify-center md:justify-end">
            <div className="relative w-full max-w-[520px] aspect-[623/672] md:max-w-[560px]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('/scroll2.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SCROLL 3 (mobile: texto arriba, imagen abajo) */}
      <section className="bg-background">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
          {/* Texto primero en mobile, segundo en desktop */}
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-extrabold text-navy md:text-5xl">
              TRANSPARENCIA
              <br />
              PARA TODAS LAS
              <br />
              PARTES
            </h2>

            <p className="mt-6 max-w-md text-navy/70">
              ¿Eres propietario/a? 
              <br />
              ¿Crees que una reseña no refleja la situación
              actual? Puedes responder de forma pública y respetuosa.
            </p>

            <div className="mt-10">
              <Link
  href="/account"
  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90"
>
  CREA UN PERFIL
</Link>
            </div>
          </div>

          {/* Imagen segundo en mobile, primero en desktop */}
          <div className="order-2 flex justify-center md:order-1 md:justify-start">
            <div className="relative w-full max-w-[520px] aspect-[623/672] md:max-w-[560px]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('/scroll3.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>
          </div>
        </div>
      </section>
      {/* SCROLL 4 (contacto) */}

      <ContactSection />

{/* SCROLL 5 (faqs) */}
      <section id="faqs" className="scroll-mt-10 bg-[#f5f5f5]">
  <div className="mx-auto max-w-6xl px-6 py-16">
    <h2 className="text-3xl font-extrabold text-navy">Preguntas frecuentes</h2>
    <p className="mt-2 text-navy/70">
      
    </p>

    <div className="mt-8 space-y-3">
      <details className="rounded-2xl bg-white border border-black/10 p-5">
        <summary className="cursor-pointer list-none font-semibold text-navy">
          ¿Cómo funciona El Mapa del Alquiler?
        </summary>
        <div className="mt-4 space-y-3 text-navy/80">
          <div>
            <p className="font-semibold">1. Busca una dirección o barrio</p>
            <p className="text-sm">Mira qué dice la gente que ya vivió ahí.</p>
          </div>
          <div>
            <p className="font-semibold">2. Lee experiencias reales</p>
            <p className="text-sm">Precio, ruidos, convivencia, problemas ocultos.</p>
          </div>
          <div>
            <p className="font-semibold">3. Decide con información real</p>
            <p className="text-sm">Alquila con menos riesgo y más tranquilidad.</p>
          </div>
        </div>
      </details>

      <details className="rounded-2xl bg-white border border-black/10 p-5">
        <summary className="cursor-pointer list-none font-semibold text-navy">
          ¿Las reseñas son anónimas?
        </summary>
        <p className="mt-3 text-sm text-navy/80">
          Sí. No mostramos datos personales. Tu email nunca es público y tu alias es automático.
        </p>
      </details>

      <details className="rounded-2xl bg-white border border-black/10 p-5">
        <summary className="cursor-pointer list-none font-semibold text-navy">
          ¿Quién puede dejar una reseña?
        </summary>
        <p className="mt-3 text-sm text-navy/80">
          Cualquier persona que haya vivido en ese piso o habitación.
        </p>
      </details>

      <details className="rounded-2xl bg-white border border-black/10 p-5">
        <summary className="cursor-pointer list-none font-semibold text-navy">
          ¿Puedo denunciar una reseña falsa?
        </summary>
        <p className="mt-3 text-sm text-navy/80">
          Sí. Puedes reportarla y revisamos los casos reportados.
        </p>
      </details>

      <details className="rounded-2xl bg-white border border-black/10 p-5">
        <summary className="cursor-pointer list-none font-semibold text-navy">
          ¿Esto es una inmobiliaria?
        </summary>
        <p className="mt-3 text-sm text-navy/80">
          No. Es una plataforma independiente creada para inquilinos.
        </p>
      </details>

      <details className="rounded-2xl bg-white border border-black/10 p-5">
        <summary className="cursor-pointer list-none font-semibold text-navy">
          ¿Tiene algún coste?
        </summary>
        <p className="mt-3 text-sm text-navy/80">
          No. El uso de la plataforma es gratuito.
        </p>
      </details>

        <details className="rounded-2xl bg-white border border-black/10 p-5">
  <summary className="cursor-pointer list-none font-semibold text-navy">
    ¿Por qué existe El Mapa del Alquiler?
  </summary>
  <p className="mt-3 text-sm text-navy/80">
    El Mapa del Alquiler nace para aportar transparencia al mercado del alquiler en España
    y ayudar a inquilinos y propietarios a tomar decisiones con más información.
  </p>
  <p className="mt-2 text-sm text-navy/80">
    Compartir experiencias reales reduce conflictos, expectativas irreales
    y situaciones injustas antes de firmar un contrato.
  </p>
  <p className="mt-3 text-sm font-semibold text-navy">
    <a href="/blog/origen-mapa-alquiler" className="underline hover:opacity-80">
      Leer más
    </a>
  </p>
</details>

<details className="rounded-2xl bg-white border border-black/10 p-5">
  <summary className="cursor-pointer list-none font-semibold text-navy">
    ¿Puedo buscar reseñas de pisos en España?
  </summary>
  <p className="mt-3 text-sm text-navy/80">
    Sí. Puedes buscar reseñas de pisos, habitaciones y barrios en distintas ciudades de España para conocer experiencias reales antes de alquilar.
  </p>
</details>

      
    </div>

    <div className="mt-10 rounded-2xl bg-white border border-black/10 p-6">
      <h3 className="text-lg font-extrabold text-navy">Información importante</h3>
      <p className="mt-3 text-sm text-navy/80">
        Las reseñas reflejan percepciones personales y no constituyen hechos probados.
        Las reseñas se refieren a inmuebles, no a personas concretas.
        Esta plataforma no acusa ni certifica comportamientos ilegales.
      </p>

      <p className="mt-4 text-sm text-navy/80">
        Revisa las{" "}
        <a href="/normas" className="underline hover:opacity-80">
          Normas de la comunidad
        </a>
        , el{" "}
        <a href="/aviso-legal" className="underline hover:opacity-80">
          Aviso legal
        </a>{" "}
        y la{" "}
        <a href="/privacidad" className="underline hover:opacity-80">
          Política de privacidad
        </a>
        .
      </p>

      <p className="mt-3 text-sm font-semibold text-navy">
        Mantengamos un espacio seguro para todos.
      </p>
    </div>
  </div>
</section>

    </main>
  );
}

