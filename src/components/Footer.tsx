"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-lg font-extrabold text-navy">El Mapa del Alquiler</p>
            <p className="mt-3 text-sm text-navy/70">
              Opiniones anónimas sobre habitaciones y pisos para alquilar con más
              información y menos sorpresas.
            </p>

            <p className="mt-4 text-xs text-navy/60">
              © {new Date().getFullYear()} El Mapa del Alquiler. Todos los derechos reservados.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-sm font-extrabold text-navy">Legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link className="text-navy/80 underline hover:opacity-80" href="/privacidad">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link className="text-navy/80 underline hover:opacity-80" href="/terminos">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link className="text-navy/80 underline hover:opacity-80" href="/aviso-legal">
                  Aviso legal
                </Link>
              </li>
              <li>
                <Link className="text-navy/80 underline hover:opacity-80" href="/normas">
                  Normas de la comunidad
                </Link>
              </li>
              <li>
                <Link className="text-navy/80 underline hover:opacity-80" href="/cookies">
                  Política de cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety / Disclaimer */}
          <div>
            <p className="text-sm font-extrabold text-navy">Información importante</p>
            <p className="mt-3 text-sm text-navy/70">
              Las reseñas reflejan percepciones personales y no constituyen hechos probados.
              Se refieren a inmuebles, no a personas concretas.
              ¿Ves un contenido inadecuado? Podrás reportarlo desde cada reseña.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
