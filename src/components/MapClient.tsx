"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/lib/supabaseClient";

type ReviewResponse = {
  id: string;
  owner_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type Review = {
  id: string;
  address: string;
  city: string;
  province: string;

  rating: number;
  property_type: "habitacion" | "piso";
  rental_type: "temporal" | "largo_plazo";

  lat: number | null;
  lng: number | null;

  content: string;
  created_at: string;

  // extras (de tu tabla)
  stay_length: "menos_6_meses" | "6_12_meses" | "mas_1_ano";
  lived_from_year: number;
  lived_to_year: number;
  price_monthly_eur: number | null;
  would_recommend: boolean | null;
  noise_level: number | null;
  maintenance_rating: number | null;
  deposit_returned: boolean | null;

  // respuesta owner (join)
  review_responses?: ReviewResponse[]; // viene como array con select anidado
};

function SetView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
}

// Icon fix (Leaflet + bundlers)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function pinColor(rating: number) {
  if (rating >= 4) return "🟢";
  if (rating === 3) return "🟡";
  return "🔴";
}

function formatStayLength(v: Review["stay_length"]) {
  if (v === "menos_6_meses") return "Hasta 6 meses";
  if (v === "6_12_meses") return "6 a 12 meses";
  return "Más de 1 año";
}

function formatBoolNullable(v: boolean | null, yes = "Sí", no = "No") {
  if (v === null) return "Prefiero no decir";
  return v ? yes : no;
}

function formatPropertyType(v: Review["property_type"]) {
  return v === "habitacion" ? "Habitación" : "Piso";
}

function containsPII(text: string) {
  const t = (text ?? "").toLowerCase();

  const email = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
  const phone = /(\+?\d[\d\s().-]{7,}\d)/;
  const url = /\bhttps?:\/\/|www\.|instagram\.com|tiktok\.com|facebook\.com|wa\.me\b/i;
  const contactWords = /\b(whatsapp|wasap|ll[áa]mame|mi n[úu]mero|tel[eé]fono|email|correo)\b/i;

  return email.test(t) || phone.test(t) || url.test(t) || contactWords.test(t);
}

export default function MapClient() {
  const [q, setQ] = useState("");
  const [center, setCenter] = useState<[number, number]>([40.4168, -3.7038]); // Madrid default
  const [loading, setLoading] = useState(false);

  // ✅ auth/role (solo para mostrar responder)
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"tenant" | "owner" | null>(null);

  // ✅ toggle filtros
  const [showFilters, setShowFilters] = useState(false);

  // filtros
  const [propertyType, setPropertyType] = useState<"all" | "habitacion" | "piso">("all");
  const [rentalType, setRentalType] = useState<"all" | "temporal" | "largo_plazo">("all");
  const [minRating, setMinRating] = useState<"all" | 1 | 2 | 3 | 4 | 5>("all");

  const [reviews, setReviews] = useState<Review[]>([]);

  // ✅ report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReview, setReportReview] = useState<Review | null>(null);
  const [reportEmail, setReportEmail] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportInfo, setReportInfo] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // ✅ response modal state (owner)
  const [respOpen, setRespOpen] = useState(false);
  const [respReview, setRespReview] = useState<Review | null>(null);
  const [respText, setRespText] = useState("");
  const [respSaving, setRespSaving] = useState(false);
  const [respInfo, setRespInfo] = useState<string | null>(null);
  const [respError, setRespError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const lat = Number(r.lat);
const lng = Number(r.lng);
if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
      if (propertyType !== "all" && r.property_type !== propertyType) return false;
      if (rentalType !== "all" && r.rental_type !== rentalType) return false;
      if (minRating !== "all" && r.rating < minRating) return false;
      return true;
    });
  }, [reviews, propertyType, rentalType, minRating]);

  async function loadReviews() {
    setLoading(true);

    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,address,city,province,rating,property_type,rental_type,lat,lng,content,created_at,
        stay_length,lived_from_year,lived_to_year,price_monthly_eur,would_recommend,noise_level,maintenance_rating,deposit_returned,
        review_responses(id,owner_id,content,created_at,updated_at)
      `
      )
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(500);


    setLoading(false);

    if (error) {
      setReviews([]);
      return;
    }

    setReviews((data ?? []) as any);
  }

  // ✅ cargar auth/role (no rompe si no hay login)
  useEffect(() => {
    async function loadAuth() {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setRole(null);
        return;
      }

      const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).single();
      const r = (prof?.role as any) ?? null;
      setRole(r === "owner" ? "owner" : r === "tenant" ? "tenant" : null);
    }

    loadAuth();
  }, []);

  useEffect(() => {
    loadReviews();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query + ", España")}`);
    const data = await res.json();
    const first = data?.results?.[0];
    if (first?.lat && first?.lng) setCenter([first.lat, first.lng]);
  }

  function openReport(r: Review) {
    setReportInfo(null);
    setReportError(null);
    setReportEmail("");
    setReportReason("");
    setReportDetails("");
    setReportReview(r);
    setReportOpen(true);
  }

  async function submitReport() {
    if (!reportReview) return;

    const reason = reportReason.trim();
    if (!reason) {
      setReportError("Por favor, indica el motivo del reporte.");
      return;
    }

    const email = reportEmail.trim();
    if (!email) {
      setReportError("Por favor, deja tu email para poder avisarte de la resolución del reporte.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setReportError("Email inválido. Revisa y prueba de nuevo.");
      return;
    }

    setReportSending(true);
    setReportInfo(null);
    setReportError(null);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const reporterId = auth.user?.id ?? null;

      // si está logueado, intentamos sacar role (opcional)
      let reporterRole: string | null = null;
      if (reporterId) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", reporterId).single();
        reporterRole = prof?.role ?? null;
      }

      const { error } = await supabase.from("review_reports").insert({
        review_id: reportReview.id,
        reporter_id: reporterId,
        reporter_email: email,
        reporter_role: reporterRole,
        reason,
        details: reportDetails.trim() || null,
      });

      if (error) throw error;

      setReportInfo("Gracias. Recibimos tu reporte y lo revisaremos.");
      setTimeout(() => {
        setReportOpen(false);
        setReportReview(null);
      }, 700);
    } catch (e: any) {
      setReportError(e?.message ?? "No pudimos enviar el reporte.");
    } finally {
      setReportSending(false);
    }
  }

  function openResponse(r: Review) {
    setRespInfo(null);
    setRespError(null);
    setRespReview(r);

    const existing = r.review_responses?.[0] ?? null;
    setRespText(existing?.content ?? "");
    setRespOpen(true);
  }

  async function saveResponse() {
    if (!respReview) return;
    if (role !== "owner" || !userId) return;

    const content = respText.trim();

    // ✅ Bloqueo PII (añadido)
    if (containsPII(content)) {
      setRespError("Por privacidad, no incluyas emails, teléfonos, enlaces ni datos personales en la respuesta.");
      return;
    }

    if (content.length < 10) {
      setRespError("La respuesta es muy corta (mínimo 10 caracteres).");
      return;
    }

    setRespSaving(true);
    setRespInfo(null);
    setRespError(null);

    try {
      const { error } = await supabase
        .from("review_responses")
        .upsert(
          {
            review_id: respReview.id,
            owner_id: userId,
            content,
          },
          { onConflict: "review_id" }
        );

      if (error) throw error;

      setRespInfo("Respuesta guardada.");
      await loadReviews();
      setTimeout(() => {
        setRespOpen(false);
        setRespReview(null);
      }, 500);
    } catch (e: any) {
      setRespError(e?.message ?? "No se pudo guardar la respuesta.");
    } finally {
      setRespSaving(false);
    }
  }

  async function deleteResponse() {
    if (!respReview) return;
    if (role !== "owner" || !userId) return;

    setRespSaving(true);
    setRespInfo(null);
    setRespError(null);

    try {
      const { error } = await supabase
        .from("review_responses")
        .delete()
        .eq("review_id", respReview.id)
        .eq("owner_id", userId);

      if (error) throw error;

      setRespInfo("Respuesta eliminada.");
      await loadReviews();
      setTimeout(() => {
        setRespOpen(false);
        setRespReview(null);
      }, 500);
    } catch (e: any) {
      setRespError(e?.message ?? "No se pudo eliminar la respuesta.");
    } finally {
      setRespSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-6">
      {/* Buscador + filtros */}
      <div className="rounded-2xl bg-white border border-black/10 p-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          {/* ✅ Barra buscadora + botón filtro afuera */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-full items-center gap-2 rounded-full bg-[#f5f5f5] px-4 py-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca una dirección o provincia"
                className="w-full bg-transparent text-navy outline-none placeholder:text-navy/40"
              />

              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-2 font-semibold text-background hover:opacity-90"
              >
                Buscar
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="map-filters"
              className="shrink-0 rounded-full bg-white px-3 py-3 font-semibold text-navy hover:bg-black/5 border border-black/10"
              title="Filtros"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 5h18l-7 8v5l-4 2v-7L3 5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* ✅ Filtros (toggle) */}
          {showFilters && (
            <div id="map-filters" className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as any)}
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
              >
                <option value="all">Vivienda: todas</option>
                <option value="habitacion">Habitación</option>
                <option value="piso">Piso</option>
              </select>

              <select
                value={rentalType}
                onChange={(e) => setRentalType(e.target.value as any)}
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
              >
                <option value="all">Contrato: todos</option>
                <option value="temporal">Temporal</option>
                <option value="largo_plazo">Largo plazo</option>
              </select>

              <select
                value={minRating}
                onChange={(e) =>
                  setMinRating(e.target.value === "all" ? "all" : (Number(e.target.value) as any))
                }
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
              >
                <option value="all">Rating: todos</option>
                <option value={5}>Rating: 5+</option>
                <option value={4}>Rating: 4+</option>
                <option value={3}>Rating: 3+</option>
                <option value={2}>Rating: 2+</option>
                <option value={1}>Rating: 1+</option>
              </select>
            </div>
          )}
        </form>

        {/* Texto debajo */}
        <div className="mt-3 text-sm text-navy/60">
          {loading ? "Cargando reseñas..." : `Mostrando ${filtered.length} reseñas en el mapa`}
        </div>
      </div>

      {/* Mapa */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="h-[72vh] w-full">
          <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
            <SetView center={center} />
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {filtered.map((r) => {
              const response = r.review_responses?.[0] ?? null;
              const canEditResponse = role === "owner" && !!userId && response?.owner_id === userId;

              return (
                <Marker key={r.id} position={[Number(r.lat), Number(r.lng)]}>
                  <Popup>
                    {/* ✅ Contenedor con altura fija + scroll interno */}
                    <div className="w-full max-w-[260px] sm:w-[320px] sm:max-w-none">
                      <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-3">
                        <div className="text-[10px] sm:text-xs text-navy/60">
                          Publicada:{" "}
                          {new Date(r.created_at).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })}
                        </div>

                        {/* ✅ Header: solo rating + tipo vivienda */}
                        <div className="text-[13px] sm:text-sm font-semibold">
                          {pinColor(r.rating)} {r.rating}/5 · {formatPropertyType(r.property_type)}
                        </div>

                        <div className="text-[13px] sm:text-sm">
                          {r.address}, {r.city}, {r.province}
                        </div>

                        {/* ✅ Contrato debajo de la dirección */}
                        <div className="text-[13px] sm:text-sm">
                          <span className="font-semibold">Contrato:</span>{" "}
                          {r.rental_type === "largo_plazo" ? "Largo plazo" : "Temporal"}
                        </div>

                        <div className="text-[13px] sm:text-sm">
                          <span className="font-semibold">Años:</span> {r.lived_from_year}–{r.lived_to_year} ·{" "}
                          <span className="font-semibold">Duración:</span> {formatStayLength(r.stay_length)}
                        </div>

                        {r.price_monthly_eur !== null && (
                          <div className="text-[13px] sm:text-sm">
                            <span className="font-semibold">Precio/mes:</span>{" "}
                            {Number(r.price_monthly_eur).toFixed(0)} €
                          </div>
                        )}

                        <div className="text-[13px] sm:text-sm">
                          <span className="font-semibold">¿Lo recomendaría?</span>{" "}
                          {formatBoolNullable(r.would_recommend)}
                        </div>

                        {(r.noise_level !== null ||
                          r.maintenance_rating !== null ||
                          r.deposit_returned !== null) && (
                          <div className="text-[13px] sm:text-sm space-y-1">
                            {r.noise_level !== null && (
                              <div>
                                <span className="font-semibold">Ruido:</span> {r.noise_level}/5
                              </div>
                            )}
                            {r.maintenance_rating !== null && (
                              <div>
                                <span className="font-semibold">Mantenimiento:</span> {r.maintenance_rating}/5
                              </div>
                            )}
                            {r.deposit_returned !== null && (
                              <div>
                                <span className="font-semibold">Fianza devuelta:</span>{" "}
                                {formatBoolNullable(r.deposit_returned)}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-[13px] sm:text-sm opacity-90 whitespace-pre-wrap">
                          {r.content}
                        </div>

                        {/* ✅ Respuesta del propietario (si existe) */}
                        {response && (
                          <div className="mt-2 rounded-xl border border-black/10 bg-[#f5f5f5] p-3">
                            <div className="text-[13px] sm:text-sm font-semibold">Respuesta del propietario</div>
                            <div className="mt-1 text-[13px] sm:text-sm whitespace-pre-wrap">
                              {response.content}
                            </div>

                            {canEditResponse && (
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openResponse(r)}
                                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-black/5"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRespReview(r);
                                    setRespText(response.content);
                                    setRespInfo(null);
                                    setRespError(null);
                                    setRespOpen(true);
                                  }}
                                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-black/5"
                                >
                                  Gestionar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ✅ Botones fuera del scroll */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReport(r)}
                          className="flex-1 inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-black/5"
                        >
                          Reportar
                        </button>

                        {role === "owner" && (
                          <button
                            type="button"
                            onClick={() => openResponse(r)}
                            className="flex-1 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
                          >
                            Responder
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* ✅ Modal Responder (owner) */}
      {respOpen && respReview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRespOpen(false)} aria-hidden="true" />
          <div className="relative z-[90] w-full max-w-lg rounded-2xl bg-white border border-black/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-navy">Responder reseña</h3>
                <p className="mt-1 text-sm text-navy/70">
                  Dirección: {respReview.address}, {respReview.city}, {respReview.province}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRespOpen(false)}
                className="rounded-md px-3 py-2 text-navy hover:bg-black/5"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Tu respuesta</label>
                <textarea
                  value={respText}
                  onChange={(e) => setRespText(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none"
                  placeholder="Escribe una respuesta respetuosa."
                />
              </div>

              {respInfo && <p className="text-sm text-green-700">{respInfo}</p>}
              {respError && <p className="text-sm text-red-700">{respError}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={respSaving}
                  onClick={saveResponse}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90 disabled:opacity-60"
                >
                  {respSaving ? "Guardando..." : "Guardar"}
                </button>

                {/* borrar solo si existe y es tuya */}
                {(() => {
                  const existing = respReview.review_responses?.[0] ?? null;
                  const canDelete = role === "owner" && !!userId && existing?.owner_id === userId;
                  if (!canDelete) return null;

                  return (
                    <button
                      type="button"
                      disabled={respSaving}
                      onClick={deleteResponse}
                      className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 font-semibold text-navy hover:bg-black/5 disabled:opacity-60"
                    >
                      Borrar
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal Reporte */}
      {reportOpen && reportReview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReportOpen(false)} aria-hidden="true" />
          <div className="relative z-[90] w-full max-w-lg rounded-2xl bg-white border border-black/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-navy">Reportar reseña</h3>
                <p className="mt-1 text-sm text-navy/70">
                  Dirección: {reportReview.address}, {reportReview.city}, {reportReview.province}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-md px-3 py-2 text-navy hover:bg-black/5"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Tu email</label>
                <input
                  type="email"
                  required
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none"
                  placeholder="Tu email (obligatorio para avisarte sobre el estado de tu reporte)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Motivo</label>
                <input
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none"
                  placeholder="Ej: contiene datos personales / es ofensiva / es falsa…"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy">Detalles</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-navy outline-none"
                  placeholder="Danos toda la información que creas relevante para revisar el caso"
                />
              </div>

              {reportInfo && <p className="text-sm text-green-700">{reportInfo}</p>}
              {reportError && <p className="text-sm text-red-700">{reportError}</p>}

              <button
                type="button"
                disabled={reportSending}
                onClick={submitReport}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90 disabled:opacity-60"
              >
                {reportSending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}