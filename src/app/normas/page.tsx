import Navbar from "@/components/Navbar";
import Link from "next/link";

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-black/10 p-6">
      <div className="text-sm text-navy/80 space-y-3">{children}</div>
    </div>
  );
}

export default function NormasPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Normas de la comunidad</h1>
        <p className="mt-2 text-navy/70">
          Queremos un espacio útil, justo y respetuoso para inquilinos y propietarios.
        </p>

        <div className="mt-8 space-y-6">
          <Box>
            <p className="font-semibold text-navy">Qué está permitido</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Compartir experiencias reales vividas en un inmueble.</li>
              <li>Describir hechos desde una perspectiva personal (“en mi experiencia…”).</li>
              <li>Opinar de forma respetuosa.</li>
            </ul>
          </Box>

          <Box>
            <p className="font-semibold text-navy">Qué NO está permitido</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Insultos, amenazas o lenguaje vejatorio.</li>
              <li>Datos personales de terceros (nombre completo, DNI, teléfono, email, etc.).</li>
              <li>Acusaciones de delitos o afirmaciones legales sin base.</li>
              <li>Contenido falso, inventado o con ánimo de dañar.</li>
            </ul>
            <p className="mt-3">
              Evita expresiones como <span className="font-semibold">“estafa confirmada”</span>,{" "}
              <span className="font-semibold">“fraude”</span> o <span className="font-semibold">“ilegal”</span>.
              Describe hechos y tu vivencia.
            </p>
          </Box>

          <Box>
            <p className="font-semibold text-navy">Reportes y moderación</p>
            <p className="mt-2">
              Puedes reportar una reseña si crees que incumple estas normas. Revisamos los casos reportados y
              podremos retirar contenido cuando corresponda.
            </p>
            <p className="mt-2">
              Los propietarios/gestores podrán responder de forma pública y respetuosa para aportar contexto.
            </p>
          </Box>

          <div className="rounded-2xl bg-[#f5f5f5] border border-black/10 p-6">
            <p className="text-sm text-navy/80">
              Revisa también el{" "}
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
