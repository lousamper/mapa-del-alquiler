import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  const key = process.env.OPENCAGE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing OPENCAGE_API_KEY" }, { status: 500 });
  }

  // Sesgo a España para mejores resultados
  const url =
    "https://api.opencagedata.com/geocode/v1/json" +
    `?q=${encodeURIComponent(q)}` +
    `&key=${encodeURIComponent(key)}` +
    `&countrycode=es` +
    `&language=es` +
    `&limit=5`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  // Devuelve solo lo que necesitas
  const results =
    data?.results?.map((r: any) => ({
      formatted: r.formatted,
      lat: r.geometry?.lat,
      lng: r.geometry?.lng,
      // componentes útiles si luego quieres autocompletar provincia/ciudad
      components: r.components,
    })) ?? [];

  return NextResponse.json({ results });
}
