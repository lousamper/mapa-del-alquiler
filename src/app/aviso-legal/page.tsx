import Navbar from "@/components/Navbar";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-black/10 p-6">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      <div className="mt-3 text-sm text-navy/80 space-y-3">{children}</div>
    </section>
  );
}

export default function AvisoLegalPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Aviso legal</h1>
        <p className="mt-2 text-navy/70">
          Información obligatoria y condiciones generales del servicio.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-2xl bg-white border border-black/10 p-6">
            <p className="text-sm font-semibold text-navy">Aviso importante</p>
            <p className="mt-2 text-sm text-navy/80">
              Las opiniones publicadas pertenecen exclusivamente a las personas que las escriben
              y reflejan su experiencia personal. La plataforma no verifica de forma previa la
              veracidad del contenido.
            </p>
            <p className="mt-3 text-sm text-navy/80">
              Esta plataforma no acusa ni certifica comportamientos ilegales. Las reseñas reflejan
              percepciones personales y no constituyen hechos probados.
            </p>
          </div>

          <Card title="Naturaleza del servicio">
            <p>
              El Mapa del Alquiler es una plataforma independiente que permite compartir experiencias
              relacionadas con inmuebles en régimen de alquiler.
            </p>
            <ul className="list-disc pl-5">
              <li>No es una inmobiliaria.</li>
              <li>No intermedia contratos.</li>
              <li>No realiza verificación previa de las reseñas.</li>
            </ul>
          </Card>

          <Card title="Moderación y retirada de contenido">
            <p>
              La plataforma se reserva el derecho de revisar contenidos reportados y retirar aquellos que
              incumplan las normas o puedan vulnerar derechos de terceros.
            </p>
            <p>
              Cualquier persona afectada por una reseña puede solicitar revisión mediante los canales de contacto.
            </p>
          </Card>

                    <Card title="Titularidad del sitio">
            <p>
              En cumplimiento de la Ley 34/2002 (LSSI-CE), se informa de que este sitio web es titularidad de:
            </p>
            <ul className="list-disc pl-5">
              <li><span className="font-semibold">Titular:</span> El mapa del alquiler</li>
              <li><span className="font-semibold">Domicilio:</span> Alicante, España</li>
              <li><span className="font-semibold">Email de contacto:</span> contacto@mapadelalquiler.es</li>
            </ul>
          </Card>

        </div>
      </div>
    </main>
  );
}
