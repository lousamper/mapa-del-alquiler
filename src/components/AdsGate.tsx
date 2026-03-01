"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type Consent = "unknown" | "essential" | "all";
const STORAGE_KEY = "cookie_consent";

export default function AdsGate({ clientId }: { clientId: string }) {
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

  if (!clientId) return null;
  if (consent !== "all") return null;

  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}