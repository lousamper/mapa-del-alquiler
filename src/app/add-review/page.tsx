"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

type Role = "tenant" | "owner";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

const selectClass =
  "w-full rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

const textareaClass =
  "w-full min-h-[140px] rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]";

// ✅ GEOCODE helper (FIX)
async function geocodeAddress(full: string) {
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

// ✅ PII guard (añadido)
function containsPII(text: string) {
  const t = text.toLowerCase();

  const email = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
  const phone = /(\+?\d[\d\s().-]{7,}\d)/;
  const url = /\bhttps?:\/\/|www\.|instagram\.com|tiktok\.com|facebook\.com|wa\.me\b/i;
  const contactWords = /\b(whatsapp|wasap|ll[áa]mame|mi n[úu]mero|tel[eé]fono|email|correo)\b/i;

  return email.test(t) || phone.test(t) || url.test(t) || contactWords.test(t);
}

export default function AddReviewPage() {
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= 2000; y--) list.push(y);
    return list;
  }, [currentYear]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  // Form fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [propertyType, setPropertyType] = useState<"habitacion" | "piso">("piso");
  const [rentalType, setRentalType] = useState<"temporal" | "largo_plazo">("largo_plazo");
  const [priceMonthly, setPriceMonthly] = useState<string>(""); // string para input

  const [fromYear, setFromYear] = useState<number>(Math.max(2000, currentYear - 5));
  const [toYear, setToYear] = useState<number>(currentYear - 2);

  const [stayLength, setStayLength] = useState<"menos_6_meses" | "6_12_meses" | "mas_1_ano">(
    "6_12_meses"
  );

  const [rating, setRating] = useState<number>(5);
  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "no" | "na">("na");

  const [content, setContent] = useState("");

  const [noiseLevel, setNoiseLevel] = useState<number | "">("");
  const [maintenanceRating, setMaintenanceRating] = useState<number | "">("");
  const [depositReturned, setDepositReturned] = useState<"yes" | "no" | "na">("na");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Proteger ruta: solo tenant
  useEffect(() => {
    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/auth?role=tenant");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (profileErr || !profile) {
        router.push("/");
        return;
      }

      if ((profile.role as Role) !== "tenant") {
        router.push("/owner");
        return;
      }

      setUserId(auth.user.id);
      setLoading(false);
    }

    init();
  }, [router]);

  function validate() {
    if (!address.trim()) return "Completa la dirección.";
    if (!city.trim()) return "Completa la ciudad.";
    if (!province.trim()) return "Completa la provincia.";
    const cp = postalCode.trim();
    if (cp && !/^\d{5}$/.test(cp)) {
      return "El código postal debe tener 5 números (ej: 28004).";
    }

    const price = priceMonthly.trim() ? Number(priceMonthly) : null;
    if (priceMonthly.trim() && (!Number.isFinite(price) || (price as number) <= 0)) {
      return "El precio mensual debe ser un número mayor a 0.";
    }

    if (toYear < fromYear) return "El año final no puede ser menor al año inicial.";

    // Anonimato: rango mínimo 1 años
    if (toYear - fromYear < 1) {
      return "Para proteger tu anonimato, indica un periodo de al menos 1 año (por ejemplo 2022–2023).";
    }

    if (content.trim().length < 40) {
      return "Cuéntanos un poco más: mínimo 40 caracteres.";
    }

    // ✅ Bloqueo de datos personales (añadido)
    if (containsPII(content)) {
      return "Por privacidad, no incluyas emails, teléfonos, enlaces ni datos personales en la reseña.";
    }

    // “Guardrails” básicos (bloquea)
    const lower = content.toLowerCase();
    const risky = ["estafa confirmada", "fraude", "ilegal"];
    if (risky.some((w) => lower.includes(w))) {
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
      const price = priceMonthly.trim() ? Number(priceMonthly) : null;

      // ✅ Geocode justo antes del insert (FIX: armamos string sin comas vacías)
      const parts = [
        address.trim(),
        postalCode.trim() || null,
        city.trim(),
        province.trim(),
        "España",
      ].filter(Boolean) as string[];
      const full = parts.join(", ");
      const geo = await geocodeAddress(full);

      const { error: insertErr } = await supabase.from("reviews").insert({
        author_id: userId,
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        rating,
        content: content.trim(),

        property_type: propertyType,
        rental_type: rentalType,
        price_monthly_eur: price,

        lived_from_year: fromYear,
        lived_to_year: toYear,
        stay_length: stayLength,

        would_recommend: wouldRecommend === "na" ? null : wouldRecommend === "yes",

        noise_level: noiseLevel === "" ? null : noiseLevel,
        maintenance_rating: maintenanceRating === "" ? null : maintenanceRating,
        deposit_returned: depositReturned === "na" ? null : depositReturned === "yes",

        // ✅ lat/lng
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,

        // country: default "España"
      });

      if (insertErr) throw insertErr;

      setInfo("¡Reseña enviada! Gracias por ayudar a otras personas 🙌");
      setTimeout(() => router.push("/profile"), 800);
    } catch (err: any) {
      setError(err?.message ?? "Ocurrió un error al guardar la reseña.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Deja tu reseña</h1>
        <p className="mt-2 text-navy/70">
          Comparte tu experiencia de forma responsable. Evita acusaciones, describe hechos y tu vivencia.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Paso 1 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">Ubicación</h2>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy">Dirección y código postal</label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                    placeholder="Ej: Calle X 10, 1"
                  />
                </div>

                <div>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={inputClass}
                    placeholder="Ej: 28004"
                    inputMode="numeric"
                    maxLength={5}
                  />
                </div>
              </div>

              <p className="text-xs text-navy/60">
                Puedes indicar el número de piso (1º, 2º, 3º…), pero no el número de puerta o apartamento.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Ciudad</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Valencia"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Provincia</label>
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Valencia"
                />
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">Tipo de alquiler y precio</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Tipo de vivienda</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as any)}
                  className={selectClass}
                >
                  <option value="habitacion">Habitación</option>
                  <option value="piso">Piso</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Tipo de contrato</label>
                <select
                  value={rentalType}
                  onChange={(e) => setRentalType(e.target.value as any)}
                  className={selectClass}
                >
                  <option value="temporal">Temporal</option>
                  <option value="largo_plazo">Largo plazo</option>
                </select>
                <p className="text-xs text-navy/60">Siendo "Temporal" un contrato de menos de 11 meses.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Precio / mes (€)</label>
                <input
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: 850"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy"> Tiempo</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                <p className="text-xs text-navy/60">Para proteger el anonimato: selecciona un rango de mínimo 1 año (por ejemplo 2022–2023).</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">¿Cuánto tiempo viviste allí?</label>
                <select
                  value={stayLength}
                  onChange={(e) => setStayLength(e.target.value as any)}
                  className={selectClass}
                >
                  <option value="menos_6_meses">Hasta 6 meses</option>
                  <option value="6_12_meses">1 año</option>
                  <option value="mas_1_ano">Más de 1 año</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paso 4 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">Experiencia</h2>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy">Tu reseña</label>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={textareaClass}
                placeholder="Describe tu experiencia (hechos, comunicación, estado del piso, etc.). Hazlo con respeto."
                maxLength={1200}
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-navy/60"></p>

                <p className="text-xs text-navy/60">{content.length}/1200</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Rating general</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className={selectClass}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} ⭐
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">¿Lo recomendarías?</label>
                <select
                  value={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.value as any)}
                  className={selectClass}
                >
                  <option value="na">Prefiero no decir</option>
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paso 5 */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-navy">Detalles opcionales</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Ruido (1–5)</label>
                <select
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(e.target.value === "" ? "" : Number(e.target.value))}
                  className={selectClass}
                >
                  <option value="">(Opcional)</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-navy/60">1 silencioso · 5 muy ruidoso</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Mantenimiento (1–5)</label>
                <select
                  value={maintenanceRating}
                  onChange={(e) => setMaintenanceRating(e.target.value === "" ? "" : Number(e.target.value))}
                  className={selectClass}
                >
                  <option value="">(Opcional)</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-navy/60">
                  1 malo · 5 excelente (estado del piso + respuesta ante problemas)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">¿Te devolvieron la fianza?</label>
                <select
                  value={depositReturned}
                  onChange={(e) => setDepositReturned(e.target.value as any)}
                  className={selectClass}
                >
                  <option value="na">Prefiero no decir</option>
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                </select>
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
            {submitting ? "Enviando..." : "Publicar reseña"}
          </button>
        </form>
      </section>
    </main>
  );
}