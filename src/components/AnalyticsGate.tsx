"use client";

import { useEffect, useState } from "react";
import GoogleAnalytics from "@/components/GoogleAnalytics";

type Consent = "unknown" | "essential" | "all";
const STORAGE_KEY = "cookie_consent";

export default function AnalyticsGate({ id }: { id: string }) {
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

  if (!id) return null;

  // Solo cargamos GA si aceptaron "all"
  if (consent !== "all") return null;

  return <GoogleAnalytics id={id} />;
}
