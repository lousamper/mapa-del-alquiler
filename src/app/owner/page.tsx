"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  role: "tenant" | "owner";
  alias: string;
};

type ReviewResponse = {
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
  content: string;
  created_at: string;
  review_responses?: ReviewResponse[]; // join
};

// ✅ nuevo tipo: “respuesta + reseña”
type OwnerResponseRow = {
  id: string;
  review_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  reviews: Review | null; // join
};

type NeighborhoodReview = {
  id: string;
  created_at: string;
  neighborhood: string;
  city: string;
  province: string;
  country: string;
  lat: number;
  lng: number;
  lived_from_year: number;
  lived_to_year: number;
  rating: number;
  environment_rating: number;
  noise_rating: number;
  safety_rating: number;
  cleanliness_rating: number;
  price_rating: number;
  content: string | null;
};

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

function containsPII(text: string) {
  const t = (text ?? "").toLowerCase();

  const email = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
  const phone = /(\+?\d[\d\s().-]{7,}\d)/;
  const url = /\bhttps?:\/\/|www\.|instagram\.com|tiktok\.com|facebook\.com|wa\.me\b/i;
  const contactWords = /\b(whatsapp|wasap|ll[áa]mame|mi n[úu]mero|tel[eé]fono|email|correo)\b/i;

  return email.test(t) || phone.test(t) || url.test(t) || contactWords.test(t);
}

function neighborhoodLevelLabel(
  value: number,
  type: "environment" | "noise" | "safety" | "cleanliness" | "price"
) {
  if (type === "environment") {
    if (value >= 4) return "Bueno";
    if (value <= 2) return "Malo";
    return "Normal";
  }

  if (type === "noise") {
    if (value >= 4) return "Alto";
    if (value <= 2) return "Bajo";
    return "Medio";
  }

  if (type === "safety") {
    if (value >= 4) return "Alta";
    if (value <= 2) return "Baja";
    return "Media";
  }

  if (type === "cleanliness") {
    if (value >= 4) return "Buena";
    if (value <= 2) return "Mala";
    return "Normal";
  }

  if (value >= 4) return "Caro";
  if (value <= 2) return "Barato";
  return "Medio";
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ ahora guardamos SOLO respuestas del owner
  const [responses, setResponses] = useState<OwnerResponseRow[]>([]);

  const [info, setInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [neighborhoodReviews, setNeighborhoodReviews] = useState<NeighborhoodReview[]>([]);
const [neighborhoodReviewsLoading, setNeighborhoodReviewsLoading] = useState(true);

const [editingNeighborhoodId, setEditingNeighborhoodId] = useState<string | null>(null);
const [editNeighborhoodForm, setEditNeighborhoodForm] = useState<Partial<NeighborhoodReview>>({});
const [savingNeighborhoodEdit, setSavingNeighborhoodEdit] = useState(false);
const [deletingNeighborhoodId, setDeletingNeighborhoodId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/auth?role=owner");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, alias")
        .eq("id", auth.user.id)
        .single();

      if (error || !data) {
        router.push("/");
        return;
      }

      if (data.role !== "owner") {
        router.push("/profile");
        return;
      }

      setProfile(data);

      // ✅ cargar SOLO las respuestas del owner (y traer la reseña asociada)
      const { data: respData, error: respErr } = await supabase
        .from("review_responses")
        .select(
          `
          id, review_id, content, created_at, updated_at,
          reviews(id,address,city,province,rating,property_type,rental_type,content,created_at)
        `
        )
        .eq("owner_id", data.id)
        .order("updated_at", { ascending: false })
        .limit(200);

      if (respErr) {
  setErrorMsg(respErr.message);
} else {
  setResponses((respData ?? []) as any);
}

// ✅ cargar reseñas de barrio del owner
setNeighborhoodReviewsLoading(true);
const { data: neighborhoodData, error: neighborhoodErr } = await supabase
  .from("neighborhood_reviews")
  .select(
    "id, created_at, neighborhood, city, province, country, lat, lng, lived_from_year, lived_to_year, rating, environment_rating, noise_rating, safety_rating, cleanliness_rating, price_rating, content"
  )
  .eq("author_id", data.id)
  .order("created_at", { ascending: false });

if (neighborhoodErr) {
  setErrorMsg(neighborhoodErr.message);
} else {
  setNeighborhoodReviews((neighborhoodData ?? []) as NeighborhoodReview[]);
}

setNeighborhoodReviewsLoading(false);
setLoading(false);
    }

    load();
  }, [router]);

  function startNeighborhoodEdit(r: NeighborhoodReview) {
  setInfo(null);
  setErrorMsg(null);
  setEditingNeighborhoodId(r.id);
  setEditNeighborhoodForm({ ...r });
}

function cancelNeighborhoodEdit() {
  setEditingNeighborhoodId(null);
  setEditNeighborhoodForm({});
}

async function saveNeighborhoodEdit() {
  if (!editingNeighborhoodId) return;

  setSavingNeighborhoodEdit(true);
  setErrorMsg(null);
  setInfo(null);

  const fromYear = Number(editNeighborhoodForm.lived_from_year);
  const toYear = Number(editNeighborhoodForm.lived_to_year);

  if (!editNeighborhoodForm.neighborhood?.trim()) {
    setErrorMsg("El barrio no puede estar vacío.");
    setSavingNeighborhoodEdit(false);
    return;
  }

  if (!editNeighborhoodForm.city?.trim()) {
    setErrorMsg("La ciudad no puede estar vacía.");
    setSavingNeighborhoodEdit(false);
    return;
  }

  if (!editNeighborhoodForm.province?.trim()) {
    setErrorMsg("La provincia no puede estar vacía.");
    setSavingNeighborhoodEdit(false);
    return;
  }

  if (!Number.isFinite(fromYear) || !Number.isFinite(toYear)) {
    setErrorMsg("Revisa los años.");
    setSavingNeighborhoodEdit(false);
    return;
  }

  if (toYear < fromYear) {
    setErrorMsg("El año final no puede ser menor al año inicial.");
    setSavingNeighborhoodEdit(false);
    return;
  }

  if (
    editNeighborhoodForm.content?.trim() &&
    editNeighborhoodForm.content.trim().length > 0 &&
    editNeighborhoodForm.content.trim().length < 20
  ) {
    setErrorMsg("Si añades un comentario, debe tener al menos 20 caracteres.");
    setSavingNeighborhoodEdit(false);
    return;
  }

  if (editNeighborhoodForm.content?.trim() && containsPII(editNeighborhoodForm.content)) {
    setErrorMsg("Por privacidad, no incluyas emails, teléfonos, enlaces ni datos personales en la reseña.");
    setSavingNeighborhoodEdit(false);
    return;
  }

  const full = [
    editNeighborhoodForm.neighborhood?.trim(),
    editNeighborhoodForm.city?.trim(),
    editNeighborhoodForm.province?.trim(),
    "España",
  ]
    .filter(Boolean)
    .join(", ");

  const geo = await geocodeAddress(full);

  const { error } = await supabase
    .from("neighborhood_reviews")
    .update({
      neighborhood: editNeighborhoodForm.neighborhood?.trim(),
      city: editNeighborhoodForm.city?.trim(),
      province: editNeighborhoodForm.province?.trim(),
      lived_from_year: fromYear,
      lived_to_year: toYear,
      rating: Number(editNeighborhoodForm.rating),
      environment_rating: Number(editNeighborhoodForm.environment_rating),
      noise_rating: Number(editNeighborhoodForm.noise_rating),
      safety_rating: Number(editNeighborhoodForm.safety_rating),
      cleanliness_rating: Number(editNeighborhoodForm.cleanliness_rating),
      price_rating: Number(editNeighborhoodForm.price_rating),
      content: editNeighborhoodForm.content?.trim() ? editNeighborhoodForm.content.trim() : null,
      lat: geo?.lat ?? editNeighborhoodForm.lat,
      lng: geo?.lng ?? editNeighborhoodForm.lng,
    })
    .eq("id", editingNeighborhoodId);

  setSavingNeighborhoodEdit(false);

  if (error) {
    setErrorMsg(error.message);
    return;
  }

  setNeighborhoodReviews((prev) =>
    prev.map((r) =>
      r.id === editingNeighborhoodId
        ? ({
            ...(r as any),
            ...(editNeighborhoodForm as any),
            lat: geo?.lat ?? editNeighborhoodForm.lat ?? r.lat,
            lng: geo?.lng ?? editNeighborhoodForm.lng ?? r.lng,
            content: editNeighborhoodForm.content?.trim() ? editNeighborhoodForm.content.trim() : null,
          } as NeighborhoodReview)
        : r
    )
  );

  setInfo("Reseña de barrio actualizada.");
  cancelNeighborhoodEdit();
}

async function deleteNeighborhoodReview(id: string) {
  setErrorMsg(null);
  setInfo(null);
  setDeletingNeighborhoodId(id);

  const { error } = await supabase.from("neighborhood_reviews").delete().eq("id", id);

  setDeletingNeighborhoodId(null);

  if (error) {
    setErrorMsg(error.message);
    return;
  }

  setNeighborhoodReviews((prev) => prev.filter((r) => r.id !== id));
  setInfo("Reseña de barrio eliminada.");
  if (editingNeighborhoodId === id) cancelNeighborhoodEdit();
}

  if (loading) return null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Panel depropietario</h1>

        <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6">
          <p className="text-sm text-navy/60">
            Alias público: <span className="font-semibold text-navy">{profile?.alias}</span>
          </p>
          <p className="mt-3 text-xs text-navy/60">
            Este alias aparecerá cuando respondas reseñas. Tu email no es visible.
          </p>
        </div>

                <div className="mt-10 rounded-2xl bg-white border border-black/10 p-6">
          <h2 className="text-xl font-extrabold text-navy">Tus respuestas</h2>
          <p className="mt-2 text-navy/70">
            Puedes responder de forma pública y respetuosa. Solo una respuesta por reseña.
          </p>

          <p className="mt-2 text-navy/70">
            Úsalo para aportar contexto, por ejemplo, aclarar malentendidos, explicar mejoras realizadas o detallar
            cambios que hayas hecho desde entonces, siempre con un tono constructivo.
          </p>

          {info && <p className="mt-4 text-sm text-green-700">{info}</p>}
          {errorMsg && <p className="mt-4 text-sm text-red-700">{errorMsg}</p>}

          <div className="mt-6 space-y-4">
            {responses.length === 0 && (
              <p className="text-navy/70 italic">
                Aún no has respondido ninguna reseña.
              </p>
            )}

            {responses.map((resp) => {
              const r = resp.reviews;

              return (
                <div key={resp.id} className="rounded-2xl border border-black/10 bg-white p-6">
                  {r ? (
                    <>
                      <div className="font-semibold text-navy">
                        {r.rating}/5 · {r.property_type} · {r.rental_type}
                      </div>

                      <div className="mt-2 text-sm text-navy/80">
                        {r.address}, {r.city}, {r.province}
                      </div>

                      <div className="mt-3 text-sm text-navy/80 whitespace-pre-wrap">
                        {r.content}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-navy/70">
                      (No pudimos cargar la reseña asociada a esta respuesta.)
                    </p>
                  )}

                  <div className="mt-4 rounded-2xl bg-[#f5f5f5] border border-black/10 p-5">
                    <p className="text-sm font-semibold text-navy">Tu respuesta</p>

                    <div className="mt-2 text-sm text-navy/80 whitespace-pre-wrap">
                      {resp.content}
                    </div>

                    <p className="mt-3 text-xs text-navy/60">
                      Última actualización:{" "}
                      {new Date(resp.updated_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-white border border-black/10 p-6">
          <h2 className="text-xl font-extrabold text-navy">Tus reseñas de barrio</h2>
          <p className="mt-2 text-navy/70">
            Aquí puedes editar o eliminar las reseñas de barrio que hayas publicado.
          </p>

          <div className="mt-6 space-y-4">
            {neighborhoodReviewsLoading ? (
              <p className="text-navy/70">Cargando reseñas de barrio...</p>
            ) : neighborhoodReviews.length === 0 ? (
              <p className="text-navy/70 italic">Aún no has creado ninguna reseña de barrio.</p>
            ) : (
              neighborhoodReviews.map((r) => {
                const isEditing = editingNeighborhoodId === r.id;

                return (
                  <div key={r.id} className="rounded-2xl border border-black/10 bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-navy">Barrio {r.neighborhood}</p>
                        <p className="mt-1 text-xs text-navy/60">
                          {r.city}, {r.province}
                        </p>
                        <p className="mt-1 text-xs text-navy/60">
                          Viviste entre {r.lived_from_year} y {r.lived_to_year}
                        </p>
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startNeighborhoodEdit(r)}
                            className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-black/5"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteNeighborhoodReview(r.id)}
                            disabled={deletingNeighborhoodId === r.id}
                            className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-black/5 disabled:opacity-60"
                          >
                            {deletingNeighborhoodId === r.id ? "Borrando..." : "Borrar"}
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <>
                        {r.content && (
                          <div className="mt-4 text-sm text-navy/80 whitespace-pre-wrap">
                            {r.content}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                            Rating: {r.rating}/5
                          </span>
                          <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                            Ambiente: {r.environment_rating}/5 · {neighborhoodLevelLabel(r.environment_rating, "environment")}
                          </span>
                          <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                            Ruido: {r.noise_rating}/5 · {neighborhoodLevelLabel(r.noise_rating, "noise")}
                          </span>
                          <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                            Seguridad: {r.safety_rating}/5 · {neighborhoodLevelLabel(r.safety_rating, "safety")}
                          </span>
                          <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                            Limpieza: {r.cleanliness_rating}/5 · {neighborhoodLevelLabel(r.cleanliness_rating, "cleanliness")}
                          </span>
                          <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                            Precios: {r.price_rating}/5 · {neighborhoodLevelLabel(r.price_rating, "price")}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Barrio</label>
                            <input
                              value={editNeighborhoodForm.neighborhood ?? ""}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({ ...p, neighborhood: e.target.value }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Ciudad</label>
                            <input
                              value={editNeighborhoodForm.city ?? ""}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({ ...p, city: e.target.value }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Provincia</label>
                            <input
                              value={editNeighborhoodForm.province ?? ""}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({ ...p, province: e.target.value }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Rating general</label>
                            <select
                              value={Number(editNeighborhoodForm.rating ?? r.rating)}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({ ...p, rating: Number(e.target.value) }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            >
                              {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Desde (año)</label>
                            <input
                              value={editNeighborhoodForm.lived_from_year ?? r.lived_from_year}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({
                                  ...p,
                                  lived_from_year: Number(e.target.value),
                                }))
                              }
                              inputMode="numeric"
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Hasta (año)</label>
                            <input
                              value={editNeighborhoodForm.lived_to_year ?? r.lived_to_year}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({
                                  ...p,
                                  lived_to_year: Number(e.target.value),
                                }))
                              }
                              inputMode="numeric"
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Ambiente</label>
                            <select
                              value={Number(editNeighborhoodForm.environment_rating ?? r.environment_rating)}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({
                                  ...p,
                                  environment_rating: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            >
                              {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Ruido</label>
                            <select
                              value={Number(editNeighborhoodForm.noise_rating ?? r.noise_rating)}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({
                                  ...p,
                                  noise_rating: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Seguridad</label>
                            <select
                              value={Number(editNeighborhoodForm.safety_rating ?? r.safety_rating)}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({
                                  ...p,
                                  safety_rating: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            >
                              {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-navy">Limpieza</label>
                            <select
                              value={Number(editNeighborhoodForm.cleanliness_rating ?? r.cleanliness_rating)}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({
                                  ...p,
                                  cleanliness_rating: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            >
                              {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-sm font-semibold text-navy">Precios</label>
                            <select
                              value={Number(editNeighborhoodForm.price_rating ?? r.price_rating)}
                              onChange={(e) =>
                                setEditNeighborhoodForm((p) => ({
                                  ...p,
                                  price_rating: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-6 space-y-2">
                          <label className="text-sm font-semibold text-navy">Comentario</label>
                          <textarea
                            value={editNeighborhoodForm.content ?? r.content ?? ""}
                            onChange={(e) =>
                              setEditNeighborhoodForm((p) => ({ ...p, content: e.target.value }))
                            }
                            className="w-full min-h-[120px] rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                          />
                          <p className="text-xs text-navy/60">
                            Opcional. Si escribes algo, mínimo 20 caracteres.
                          </p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={saveNeighborhoodEdit}
                            disabled={savingNeighborhoodEdit}
                            className="rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90 disabled:opacity-60"
                          >
                            {savingNeighborhoodEdit ? "Guardando..." : "Guardar cambios"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelNeighborhoodEdit}
                            className="rounded-full border border-black/10 px-6 py-3 font-semibold text-navy hover:bg-black/5"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            onClick={async () => {
              const { data: auth } = await supabase.auth.getUser();
              const email = auth.user?.email ?? "";

              if (!email) {
                setErrorMsg("No pudimos detectar tu email. Vuelve a iniciar sesión.");
                return;
              }

              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });

              if (error) setErrorMsg(error.message);
              else setInfo("Te enviamos un email para cambiar tu contraseña.");
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90"
          >
            Cambiar contraseña
          </button>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}