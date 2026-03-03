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
            {/* TikTok + Instagram + Threads buttons */}
<div className="mb-4 flex items-center gap-3">
  {/* TikTok */}
  <a
    href="https://www.tiktok.com/@elmapadelalquiler"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="TikTok El Mapa del Alquiler"
    className="
      inline-flex h-9 w-9 items-center justify-center
      rounded-full border border-black/10
      text-navy hover:bg-black/5 transition
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M16.5 3a5.5 5.5 0 0 0 5.5 5.5v3a8.4 8.4 0 0 1-5.5-2v7.3a6.2 6.2 0 1 1-6.2-6.2c.3 0 .6 0 .9.1v3.1a3.1 3.1 0 1 0 2.2 3V3h3.1z" />
    </svg>
  </a>

  {/* Instagram */}
  <a
    href="https://www.instagram.com/mapadelalquiler/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram El Mapa del Alquiler"
    className="
      inline-flex h-9 w-9 items-center justify-center
      rounded-full border border-black/10
      text-navy hover:bg-black/5 transition
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 4.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6zm0 2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM17.8 6.2a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0z" />
    </svg>
  </a>

  {/* Threads */}
<a
  href="https://www.threads.com/@mapadelalquiler"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Threads El Mapa del Alquiler"
  className="
    inline-flex h-9 w-9 items-center justify-center
    rounded-full border border-black/10
    text-navy hover:bg-black/5 transition
  "
>
  <img
    src="/threads.png"
    alt="Threads"
    className="h-7 w-7 object-contain"
  />
</a>
</div>

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