"use client";

import { useEffect, useState } from "react";

type Consent = "unknown" | "essential" | "all";

const STORAGE_KEY = "cookie_consent";

export default function CookieBanner() {
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

    read(); // lectura inicial
    window.addEventListener("cookie-consent-updated", read);
    return () => window.removeEventListener("cookie-consent-updated", read);
  }, []);

  if (consent !== "unknown") return null;

  function save(value: Consent) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setConsent(value);
    window.dispatchEvent(new Event("cookie-consent-updated"));
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[90] px-4 pb-4">
      <div
        className="
          mx-auto w-full max-w-6xl rounded-2xl border border-black/10 bg-white shadow-sm
          px-5 py-4
          flex flex-col gap-3
          sm:flex-row sm:items-center sm:justify-between sm:gap-4
        "
      >
        <p className="text-[13px] leading-snug text-navy/80 sm:text-sm sm:leading-normal">
          Usamos cookies para analizar el uso y mejorar tu experiencia. Puedes aceptar todas o quedarte solo con las esenciales.
        </p>

        <div className="flex shrink-0 flex-row flex-wrap items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => save("essential")}
            className="
              rounded-full border border-black/10 bg-white
              px-4 py-2 text-xs font-semibold text-navy hover:bg-black/5
              sm:px-6 sm:text-sm
            "
          >
            Rechazar
          </button>

          <button
            type="button"
            onClick={() => save("all")}
            className="
              rounded-full bg-primary
              px-4 py-2 text-xs font-semibold text-background hover:opacity-90
              sm:px-6 sm:text-sm
            "
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}
