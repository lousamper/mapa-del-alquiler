"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

const selectClass =
  "w-full rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

const textareaClass =
  "w-full min-h-[120px] rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

// ✅ GEOCODE helper
async function geocodeNeighborhood(full: string) {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(full)}`);
  const data = await res.json();
  const first = data?.results?.[0];

  const lat = first?.lat;
  const lng = first?.lng;

  const latNum = lat === null || lat === undefined ? NaN : Number(lat);
  const lngNum = lng === null || lng === undefined ? NaN : Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;

  return { lat: latNum, lng: lngNum };
}

function normalizeNeighborhoodName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ✅ PII guard
function containsPII(text: string) {
  const t = text.toLowerCase();

  const email = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
  const phone = /(\+?\d[\d\s().-]{7,}\d)/;
  const url = /\bhttps?:\/\/|www\.|instagram\.com|tiktok\.com|facebook\.com|wa\.me\b/i;
  const contactWords = /\b(whatsapp|wasap|ll[áa]mame|mi n[úu]mero|tel[eé]fono|email|correo)\b/i;

  return email.test(t) || phone.test(t) || url.test(t) || contactWords.test(t);
}

export default function AddNeighborhoodReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= 2000; y--) list.push(y);
    return list;
  }, [currentYear]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  // ✅ prefill desde query params (por ejemplo desde el pin)
  const [neighborhood, setNeighborhood] = useState(searchParams.get("neighborhood") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [province, setProvince] = useState(searchParams.get("province") ?? "");

  const [lat, setLat] = useState<string>(searchParams.get("lat") ?? "");
  const [lng, setLng] = useState<string>(searchParams.get("lng") ?? "");

  const [fromYear, setFromYear] = useState<number>(Math.max(2000, currentYear - 5));
  const [toYear, setToYear] = useState<number>(currentYear - 2);

  const [rating, setRating] = useState<number>(5);
  const [environmentRating, setEnvironmentRating] = useState<number>(5);
  const [noiseRating, setNoiseRating] = useState<number>(3);
  const [safetyRating, setSafetyRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(4);
  const [priceRating, setPriceRating] = useState<number>(3);

  const [content, setContent] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ✅ Solo requiere estar logueado (tenant u owner)
  useEffect(() => {
    async function init() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.push("/auth");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", auth.user.id)
        .single();

      if (profileErr || !profile) {
        router.push("/");
        return;
      }

      setUserId(auth.user.id);
      setLoading(false);
    }

    init();
  }, [router]);

  function validate() {
    if (!neighborhood.trim()) return "Completa el nombre del barrio.";
    if (!city.trim()) return "Completa la ciudad.";
    if (!province.trim()) return "Completa la provincia.";

    if (toYear < fromYear) return "El año final no puede ser menor al año inicial.";

    if (content.trim().length > 0 && content.trim().length < 20) {
      return "Si añades un comentario, debe tener al menos 20 caracteres.";
    }

    if (content.trim() && containsPII(content)) {
      return "Por privacidad, no incluyas emails, teléfonos, enlaces ni datos personales en la reseña.";
    }

    const lower = content.toLowerCase();
    const risky = ["estafa confirmada", "fraude", "ilegal"];
    if (content.trim() && risky.some((w) => lower.includes(w))) {
      return "Evita afirmaciones legales (por ejemplo “fraude/ilegal/estafa confirmada”). Describe hechos y tu experiencia.";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    if (!userId) {
      setError("No se detectó usuario. Vuelve a iniciar sesión.");
      return;
    }

    setSubmitting(true);

    try {
      let finalLat: number | null = lat.trim() ? Number(lat) : null;
      let finalLng: number | null = lng.trim() ? Number(lng) : null;

      if (!Number.isFinite(finalLat) || !Number.isFinite(finalLng)) {
        const full = [neighborhood.trim(), city.trim(), province.trim(), "España"].join(", ");
        const geo = await geocodeNeighborhood(full);
        finalLat = geo?.lat ?? null;
        finalLng = geo?.lng ?? null;
      }

      if (!Number.isFinite(finalLat) || !Number.isFinite(finalLng)) {
        throw new Error("No pudimos ubicar ese barrio en el mapa. Revisa el nombre e inténtalo de nuevo.");
      }

      const { error: insertErr } = await supabase.from("neighborhood_reviews").insert({
        author_id: userId,
        neighborhood: normalizeNeighborhoodName(neighborhood),
        city: city.trim(),
        province: province.trim(),
        country: "España",
        lat: finalLat,
        lng: finalLng,
        lived_from_year: fromYear,
        lived_to_year: toYear,
        rating,
        environment_rating: environmentRating,
        noise_rating: noiseRating,
        safety_rating: safetyRating,
        cleanliness_rating: cleanlinessRating,
        price_rating: priceRating,
        content: content.trim() ? content.trim() : null,
      });

      if (insertErr) throw insertErr;

      setInfo("¡Reseña de barrio enviada! Gracias por ayudar a otras personas 🙌");
      setTimeout(() => router.push("/map"), 900);
    } catch (err: any) {
      setError(err?.message ?? "Ocurrió un error al guardar la reseña del barrio.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Deja una reseña del barrio</h1>
        <p className="mt-2 text-navy/70">
          Comparte cómo se siente vivir en esa zona.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Paso 1 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">Ubicación</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <label className="text-sm font-semibold text-navy">Barrio</label>
                <input
  value={neighborhood}
  onChange={(e) => setNeighborhood(normalizeNeighborhoodName(e.target.value))}
                  className={inputClass}
                  placeholder="Ej: Ruzafa"
                />
              </div>

              <div className="space-y-2 sm:col-span-1">
                <label className="text-sm font-semibold text-navy">Ciudad</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Valencia"
                />
              </div>

              <div className="space-y-2 sm:col-span-1">
                <label className="text-sm font-semibold text-navy">Provincia</label>
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Valencia"
                />
              </div>
            </div>

            <p className="text-xs text-navy/60">
              Escribe el barrio en su denominación más habitual en español para ubicarlo mejor en el mapa.
            </p>
          </div>

          {/* Paso 2 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">¿Cuándo viviste en este barrio?</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Desde (año)</label>
                <select
                  value={fromYear}
                  onChange={(e) => setFromYear(Number(e.target.value))}
                  className={selectClass}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Hasta (año)</label>
                <select
                  value={toYear}
                  onChange={(e) => setToYear(Number(e.target.value))}
                  className={selectClass}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">Valoración general</h2>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy">Rating general</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className={selectClass}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} ⭐
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paso 4 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">¿Cómo es vivir en este barrio?</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Ambiente</label>
                <select
                  value={environmentRating}
                  onChange={(e) => setEnvironmentRating(Number(e.target.value))}
                  className={selectClass}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-navy/60">1 muy malo · 5 muy bueno</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Ruido</label>
                <select
                  value={noiseRating}
                  onChange={(e) => setNoiseRating(Number(e.target.value))}
                  className={selectClass}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-navy/60">1 silencioso · 5 muy ruidoso</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Seguridad</label>
                <select
                  value={safetyRating}
                  onChange={(e) => setSafetyRating(Number(e.target.value))}
                  className={selectClass}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-navy/60">1 baja · 5 alta</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Limpieza</label>
                <select
                  value={cleanlinessRating}
                  onChange={(e) => setCleanlinessRating(Number(e.target.value))}
                  className={selectClass}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-navy/60">1 mala · 5 buena</p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-navy">Precios</label>
                <select
                  value={priceRating}
                  onChange={(e) => setPriceRating(Number(e.target.value))}
                  className={selectClass}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-navy/60">1 barato · 5 caro</p>
              </div>
            </div>
          </div>

          {/* Paso 5 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">Comentario opcional</h2>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy">Tu comentario</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={textareaClass}
                placeholder="Ej: zona muy viva pero imposible dormir fines de semana."
                maxLength={400}
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-navy/60">
                  Deja un breve comentario que describa tu experiencia en este barrio, mínimo 20 caracteres.
                </p>
                <p className="text-xs text-navy/60">{content.length}/400</p>
              </div>
            </div>
          </div>

          {info && (
            <div className="rounded-xl bg-white border border-green-200 px-4 py-3 text-sm text-green-700">
              {info}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-white border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Publicar reseña del barrio"}
          </button>
        </form>
      </section>
    </main>
  );
}