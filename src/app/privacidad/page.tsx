import Navbar from "@/components/Navbar";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-black/10 p-6">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      <div className="mt-3 text-sm text-navy/80 space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Política de privacidad</h1>
        <p className="mt-2 text-navy/70">
          Información sobre datos personales conforme al RGPD y la LOPDGDD.
        </p>

        <div className="mt-8 space-y-6">

          <Section title="Qué datos recopilamos">
            <ul className="list-disc pl-5">
              <li>Email (para registro e inicio de sesión).</li>
              <li>Alias automático (visible públicamente).</li>
              <li>Contenido de reseñas y datos del inmueble (dirección aproximada, ciudad, provincia).</li>
              <li>Datos técnicos mínimos (seguridad, logs básicos).</li>
            </ul>
            <p className="mt-2">
              Tu email no se muestra públicamente. Las reseñas se publican de forma anónima (alias).
            </p>
          </Section>

          <Section title="Finalidades">
            <ul className="list-disc pl-5">
              <li>Gestionar tu cuenta de usuario.</li>
              <li>Permitir la publicación de reseñas anónimas.</li>
              <li>Atender reportes, moderación y seguridad del servicio.</li>
              <li>Atender consultas enviadas por el formulario de contacto.</li>
            </ul>
          </Section>

          <Section title="Base jurídica">
            <ul className="list-disc pl-5">
              <li>Consentimiento (registro, contacto).</li>
              <li>Interés legítimo (seguridad, prevención de abuso y moderación).</li>
            </ul>
          </Section>

          <Section title="Conservación">
            <p>
              Conservaremos los datos mientras mantengas la cuenta activa o durante los plazos necesarios para
              atender obligaciones legales y de seguridad. Podrás solicitar la supresión cuando proceda.
            </p>
          </Section>

          <Section title="Derechos">
            <p>
              Puedes ejercer los derechos de acceso, rectificación, supresión, limitación u oposición escribiendo a{" "}
              <span className="font-semibold">contacto@elmapadelalquiler.es</span>.
              Asimismo, tienes derecho a la portabilidad de tus datos y a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) si consideras que el tratamiento no se ajusta a la normativa vigente.
            </p>
          </Section>

          <Section title="Seguridad">
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger los datos. No obstante, ningún
              sistema es 100% infalible.
            </p>
          </Section>

                    <Section title="Responsable del tratamiento">
            <ul className="list-disc pl-5">
              <li><span className="font-semibold">Responsable:</span> El mapa del alquiler</li>
              <li><span className="font-semibold">Email de contacto:</span> contacto@elmapadelalquiler.es</li>
            </ul>
          </Section>
          
        </div>
      </div>
    </main>
  );
}
