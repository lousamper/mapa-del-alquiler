"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import AdSlot from "@/components/AdSlot";

// 👇 IMPORTANTE: MapClient sin SSR
const MapClient = dynamic(() => import("@/components/MapClient"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Mapa */}
      <MapClient />

      {/* Ad manual debajo del mapa */}
      <div className="mx-auto max-w-6xl px-6 pb-8">
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
          <div className="mb-2 text-xs text-white">Publicidad</div>

          <AdSlot
            slot="1234567890" // 👈 reemplazá por tu AD SLOT REAL de AdSense
            className="min-h-[90px]"
          />
        </div>
      </div>
    </main>
  );
}
