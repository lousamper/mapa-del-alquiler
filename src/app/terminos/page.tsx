import Navbar from "@/components/Navbar";
import Link from "next/link";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-black/10 p-6">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      <div className="mt-3 text-sm text-navy/80 space-y-3">{children}</div>
    </section>
  );
}

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Términos y condiciones</h1>
        <p className="mt-2 text-navy/70">
          Condiciones de uso del servicio y responsabilidades básicas.
        </p>

        <div className="mt-8 space-y-6">
          <Section title="Aceptación de condiciones">
            <p>
              El acceso y uso de esta plataforma implica la aceptación de estos términos. Si no estás de acuerdo,
              no utilices el servicio.
            </p>
          </Section>

          <Section title="Registro y cuentas">
            <ul className="list-disc pl-5">
              <li>El registro es gratuito.</li>
              <li>Debes mantener la confidencialidad de tus credenciales.</li>
              <li>Las reseñas se publican con alias automático; tu email no es público.</li>
            </ul>
          </Section>

          <Section title="Publicación de reseñas">
            <ul className="list-disc pl-5">
              <li>Solo publica reseñas sobre inmuebles donde hayas residido.</li>
              <li>No publiques datos personales (como nombres, teléfonos, emails, direcciones exactas) ni insultos.</li>
              <li>Evita acusaciones legales, describe hechos y tu experiencia.</li>
            </ul>
            <p>
              Consulta las{" "}
              <Link className="underline hover:opacity-80" href="/normas">
                Normas de la comunidad
              </Link>
              .
            </p>
          </Section>

          <Section title="Respuesta de propietarios">
            <p>
              Las cuentas de propietario/gestor podrán responder reseñas de forma pública y respetuosa. La plataforma
              podrá moderar respuestas que incumplan las normas.
            </p>
          </Section>

          <Section title="Moderación y retirada">
            <p>
              La plataforma se reserva el derecho de revisar reportes y retirar contenido que incumpla normas o pueda
              vulnerar derechos de terceros.
            </p>
          </Section>

          <Section title="Limitación de responsabilidad">
            <p>
              La plataforma actúa como intermediario técnico. No se responsabiliza de la exactitud del contenido
              publicado por terceros ni de decisiones tomadas por otras personas basadas en reseñas.
            </p>
          </Section>

          <div className="rounded-2xl bg-[#f5f5f5] border border-black/10 p-6">
            <p className="text-sm text-navy/80">
              Más información en el{" "}
              <Link className="underline hover:opacity-80" href="/aviso-legal">
                Aviso legal
              </Link>{" "}
              y la{" "}
              <Link className="underline hover:opacity-80" href="/privacidad">
                Política de privacidad
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
