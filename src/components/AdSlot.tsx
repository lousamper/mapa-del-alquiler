"use client";

import { useEffect } from "react";

type Consent = "unknown" | "essential" | "all";
const STORAGE_KEY = "cookie_consent";

export default function AdSlot({
  slot,
  className = "",
}: {
  slot: string; // tu ad slot id (NO el client)
  className?: string;
}) {
  useEffect(() => {
    // Solo intentar renderizar si aceptaron "all"
    const consent = (localStorage.getItem(STORAGE_KEY) as Consent) || "unknown";
    if (consent !== "all") return;

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // si falla (adblock, etc), no pasa nada
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}