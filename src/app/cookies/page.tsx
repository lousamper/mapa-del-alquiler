"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-black/10 p-6">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      <div className="mt-3 text-sm text-navy/80 space-y-3">{children}</div>
    </section>
  );
}

type Consent = "unknown" | "essential" | "all";
const STORAGE_KEY = "cookie_consent";

export default function CookiesPage() {
  const [consent, setConsent] = useState<Consent>("unknown");

  useEffect(() => {
    const read = () => {
      try {
        const saved = (localStorage.getItem(STORAGE_KEY) as Consent) || "unknown";
        setConsent(saved);
      } catch {
        setConsent("unknown");
      }
    };

    read();
    window.addEventListener("cookie-consent-updated", read);
    return () => window.removeEventListener("cookie-consent-updated", read);
  }, []);

  function resetConsent() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.dispatchEvent(new Event("cookie-consent-updated"));
    // opcional: baja al final para ver el banner (está fijo abajo)
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function saveConsent(value: Exclude<Consent, "unknown">) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    window.dispatchEvent(new Event("cookie-consent-updated"));
    setConsent(value);
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Política de cookies</h1>
        <p className="mt-2 text-navy/70">
          Esta política explica qué son las cookies, qué cookies usamos y cómo puedes gestionarlas.
        </p>

        <div className="mt-8 space-y-6">
          <Section title="¿Qué son las cookies?">
            <p>
              Las cookies son pequeños archivos que se descargan en tu dispositivo al acceder a un sitio web. Sirven,
              por ejemplo, para recordar preferencias, mejorar el funcionamiento y obtener estadísticas de uso.
            </p>
          </Section>

          <Section title="Tipos de cookies">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-semibold">Cookies técnicas</span>: necesarias para que el sitio funcione y para
                aplicar medidas básicas de seguridad.
              </li>
              <li>
                <span className="font-semibold">Cookies de analítica</span>: permiten medir el uso del sitio para
                mejorar la experiencia.
              </li>
            </ul>
          </Section>

          <Section title="Cookies utilizadas en este sitio">
            <p>
              <span className="font-semibold">1) Técnicas (necesarias)</span>: el sitio utiliza cookies y/o
              localStorage imprescindibles para recordar tu elección de cookies y permitir el funcionamiento básico
              del servicio.
            </p>

            <div className="rounded-2xl bg-[#f5f5f5] border border-black/10 p-5">
              <p className="text-sm font-semibold text-navy">Gestión del consentimiento</p>
              <p className="mt-2 text-sm text-navy/80">
                Este sitio utiliza un sistema de gestión de consentimiento (CMP) que permite aceptar o rechazar
                cookies no esenciales y guardar tu preferencia para futuras visitas.
              </p>
            </div>

            <p className="mt-3">
              <span className="font-semibold">2) Analítica (opcionales)</span>: únicamente si aceptas las cookies no
              esenciales, utilizamos <span className="font-semibold">Google Analytics 4</span> para medir el uso del
              sitio y mejorar contenidos y navegación.
            </p>

            <div className="rounded-2xl bg-[#f5f5f5] border border-black/10 p-5">
              <p className="text-sm font-semibold text-navy">Google Analytics (GA4)</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-navy/80 space-y-1">
                <li>Finalidad: medición y analítica de uso.</li>
                <li>Proveedor: Google LLC.</li>
                <li>Base legal: consentimiento del usuario.</li>
                <li>Transferencias internacionales: Google puede tratar datos fuera del EEE.</li>
              </ul>
              <p className="mt-2 text-xs text-navy/70">
                La analítica solo se carga tras aceptar cookies no esenciales.
              </p>
            </div>
          </Section>

          <Section title="¿Cómo puedo cambiar o retirar mi consentimiento?">
            <p>
              Puedes modificar o retirar tu consentimiento en cualquier momento desde esta misma página. Si lo
              prefieres, también puedes volver a mostrar el banner de cookies y elegir de nuevo.
            </p>

            <div className="rounded-2xl bg-[#f5f5f5] border border-black/10 p-5">
              <p className="text-sm font-semibold text-navy">Configuración de cookies</p>
              <p className="mt-2 text-sm text-navy/80">
                Elige qué tipo de cookies quieres permitir:
              </p>

              <div className="mt-3 flex flex-row flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => saveConsent("essential")}
                  className="
                    rounded-full border border-black/10 bg-white
                    px-4 py-2 text-xs font-semibold text-navy hover:bg-black/5
                    sm:px-6 sm:text-sm
                  "
                >
                  Solo esenciales
                </button>

                <button
                  type="button"
                  onClick={() => saveConsent("all")}
                  className="
                    rounded-full bg-primary
                    px-4 py-2 text-xs font-semibold text-background hover:opacity-90
                    sm:px-6 sm:text-sm
                  "
                >
                  Aceptar analítica
                </button>

                <button
                  type="button"
                  onClick={resetConsent}
                  className="text-sm font-semibold text-navy underline hover:opacity-80"
                >
                  Volver a mostrar el banner
                </button>
              </div>

              <p className="mt-3 text-xs text-navy/70">
                Estado actual:{" "}
                <span className="font-semibold">
                  {consent === "all"
                    ? "Analítica activada"
                    : consent === "essential"
                    ? "Solo esenciales"
                    : "Sin elección"}
                </span>
              </p>
            </div>
          </Section>

          <Section title="Gestión desde el navegador">
            <p>
              También puedes permitir, bloquear o eliminar cookies desde la configuración del navegador. Ten en
              cuenta que deshabilitar cookies técnicas puede afectar al funcionamiento del sitio.
            </p>
          </Section>

          <div className="rounded-2xl bg-[#f5f5f5] border border-black/10 p-6">
            <p className="text-sm text-navy/80">
              Esta política puede actualizarse si se incorporan nuevas cookies o herramientas.
            </p>
            <p className="text-xs text-navy/60">
  Última actualización: febrero 2026
</p>

          </div>
        </div>
      </div>
    </main>
  );
}
