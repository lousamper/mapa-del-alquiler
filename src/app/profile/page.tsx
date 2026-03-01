"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  role: "tenant" | "owner";
  alias: string;
};

type Review = {
  id: string;
  created_at: string;
  address: string;
  city: string;
  province: string;
  property_type: "habitacion" | "piso";
  rental_type: "temporal" | "largo_plazo";
  price_monthly_eur: number | null;
  lived_from_year: number;
  lived_to_year: number;
  stay_length: "menos_6_meses" | "6_12_meses" | "mas_1_ano";
  rating: number;
  would_recommend: boolean | null;
  noise_level: number | null;
  maintenance_rating: number | null;
  deposit_returned: boolean | null;
  content: string;
};

// ✅ helper geocode (añadido)
async function geocodeAddress(full: string) {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(full)}`);
  const data = await res.json();
  const first = data?.results?.[0];
  if (!first?.lat || !first?.lng) return null;
  return { lat: first.lat, lng: first.lng };
}

// ✅ PII guard (añadido)
function containsPII(text: string) {
  const t = (text ?? "").toLowerCase();

  const email = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
  const phone = /(\+?\d[\d\s().-]{7,}\d)/;
  const url = /\bhttps?:\/\/|www\.|instagram\.com|tiktok\.com|facebook\.com|wa\.me\b/i;
  const contactWords = /\b(whatsapp|wasap|ll[áa]mame|mi n[úu]mero|tel[eé]fono|email|correo)\b/i;

  return email.test(t) || phone.test(t) || url.test(t) || contactWords.test(t);
}

export default function TenantProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Review>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ✅ CP solo para edición (no se guarda en DB por ahora)
  const [editPostalCode, setEditPostalCode] = useState("");

  const accountBtnWidth = useMemo(() => {
    return "w-[14rem]";
  }, []);

  useEffect(() => {
    async function load() {
      setErrorMsg(null);

      // 1) Auth check
      const { data: auth, error: authErr } = await supabase.auth.getUser();

      if (authErr) {
        setErrorMsg(authErr.message);
        setLoading(false);
        return;
      }

      if (!auth.user) {
        router.push("/auth?role=tenant");
        return;
      }

      setUserEmail(auth.user.email ?? null);

      // 2) Load profile
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, alias")
        .eq("id", auth.user.id)
        .single();

      if (error || !data) {
        router.push("/");
        return;
      }

      // 3) Role protection
      if (data.role !== "tenant") {
        router.push("/owner");
        return;
      }

      setProfile(data);
      setLoading(false);

      // 4) Load reviews
      setReviewsLoading(true);
      const { data: userReviews, error: reviewsErr } = await supabase
        .from("reviews")
        .select(
          "id, created_at, address, city, province, property_type, rental_type, price_monthly_eur, lived_from_year, lived_to_year, stay_length, rating, would_recommend, noise_level, maintenance_rating, deposit_returned, content"
        )
        .eq("author_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (reviewsErr) {
        setErrorMsg(reviewsErr.message);
        setReviewsLoading(false);
        return;
      }

      setReviews((userReviews ?? []) as Review[]);
      setReviewsLoading(false);
    }

    load();
  }, [router]);

  async function handleChangePassword() {
    setErrorMsg(null);
    setInfo(null);

    const email = (userEmail ?? "").trim();

    if (!email) {
      setErrorMsg("No pudimos detectar tu email. Vuelve a iniciar sesión.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) setErrorMsg(error.message);
    else setInfo("Te enviamos un email para cambiar tu contraseña.");
  }

  function stayLengthLabel(v: Review["stay_length"]) {
    if (v === "menos_6_meses") return "Hasta 6 meses";
    if (v === "6_12_meses") return "1 año";
    return "Más de 1 año";
  }

  function propertyTypeLabel(v: Review["property_type"]) {
    return v === "habitacion" ? "Habitación" : "Piso";
  }

  function rentalTypeLabel(v: Review["rental_type"]) {
    return v === "temporal" ? "Temporal" : "Largo plazo";
  }

  function startEdit(r: Review) {
    setInfo(null);
    setErrorMsg(null);
    setEditingId(r.id);
    setEditForm({ ...r });
    setEditPostalCode(""); // ✅ lo completas tú (porque no lo tenemos guardado)
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
    setEditPostalCode("");
  }

  async function saveEdit() {
    if (!editingId) return;

    setSavingEdit(true);
    setErrorMsg(null);
    setInfo(null);

    const fromYear = Number(editForm.lived_from_year);
    const toYear = Number(editForm.lived_to_year);

    if (!editForm.address?.trim()) {
      setErrorMsg("La dirección no puede estar vacía.");
      setSavingEdit(false);
      return;
    }
    if (!editForm.city?.trim()) {
      setErrorMsg("La ciudad no puede estar vacía.");
      setSavingEdit(false);
      return;
    }
    if (!editForm.province?.trim()) {
      setErrorMsg("La provincia no puede estar vacía.");
      setSavingEdit(false);
      return;
    }
    if (!Number.isFinite(fromYear) || !Number.isFinite(toYear)) {
      setErrorMsg("Revisa los años.");
      setSavingEdit(false);
      return;
    }
    if (toYear - fromYear < 3) {
      setErrorMsg("El rango debe ser mínimo de 3 años por privacidad.");
      setSavingEdit(false);
      return;
    }
    if (!editForm.content?.trim() || editForm.content.trim().length < 40) {
      setErrorMsg("La reseña debe tener al menos 40 caracteres.");
      setSavingEdit(false);
      return;
    }

    // ✅ Bloqueo de datos personales (añadido)
if (containsPII(editForm.content)) {
  setErrorMsg("Por privacidad, no incluyas emails, teléfonos, enlaces ni datos personales en la reseña.");
  setSavingEdit(false);
  return;
}

    // ✅ Recalcular lat/lng con CP (si lo completaron)
    const full = `${editForm.address.trim()}, ${editPostalCode.trim()}, ${editForm.city.trim()}, ${editForm.province.trim()}, España`;
    const geo = await geocodeAddress(full);

    const { error } = await supabase
      .from("reviews")
      .update({
        address: editForm.address?.trim(),
        city: editForm.city?.trim(),
        province: editForm.province?.trim(),
        property_type: editForm.property_type,
        rental_type: editForm.rental_type,
        price_monthly_eur:
          editForm.price_monthly_eur === null || editForm.price_monthly_eur === ("" as any)
            ? null
            : Number(editForm.price_monthly_eur),
        lived_from_year: fromYear,
        lived_to_year: toYear,
        stay_length: editForm.stay_length,
        rating: Number(editForm.rating),
        would_recommend: editForm.would_recommend ?? null,
        noise_level:
          editForm.noise_level === null || editForm.noise_level === ("" as any)
            ? null
            : Number(editForm.noise_level),
        maintenance_rating:
          editForm.maintenance_rating === null || editForm.maintenance_rating === ("" as any)
            ? null
            : Number(editForm.maintenance_rating),
        deposit_returned: editForm.deposit_returned ?? null,
        content: editForm.content?.trim(),

        // ✅ actualizar pin
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
      })
      .eq("id", editingId);

    setSavingEdit(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setReviews((prev) =>
      prev.map((r) => (r.id === editingId ? ({ ...(r as any), ...(editForm as any) } as Review) : r))
    );
    setInfo("Reseña actualizada.");
    cancelEdit();
  }

  async function deleteReview(id: string) {
    setErrorMsg(null);
    setInfo(null);
    setDeletingId(id);

    const { error } = await supabase.from("reviews").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== id));
    setInfo("Reseña eliminada.");
    if (editingId === id) cancelEdit();
  }

  if (loading) return null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Tu perfil</h1>

        <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6">
          <p className="text-sm text-navy/60">
            Alias público: <span className="font-semibold text-navy">{profile?.alias}</span>
          </p>

          <p className="mt-3 text-xs text-navy/60">
            Este es el nombre que aparecerá en tus reseñas. Tu email nunca es visible.
          </p>
        </div>

        {info && (
          <div className="mt-6 rounded-xl bg-white border border-green-200 px-4 py-3 text-sm text-green-700">
            {info}
          </div>
        )}
        {errorMsg && (
          <div className="mt-6 rounded-xl bg-white border border-red-200 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-navy">Tus reseñas</h2>

          <div className="mt-4 space-y-4">
            {reviewsLoading ? (
              <div className="rounded-2xl bg-white border border-black/10 p-6">
                <p className="text-navy/70">Cargando reseñas...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl bg-white border border-black/10 p-6">
                <p className="text-navy/70">Aún no has creado ninguna reseña.</p>

                <button
                  onClick={() => router.push("/add-review")}
                  className="mt-4 rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90"
                >
                  Crear mi primera reseña
                </button>
              </div>
            ) : (
              <>
                {reviews.map((r) => {
                  const isEditing = editingId === r.id;

                  return (
                    <div key={r.id} className="rounded-2xl bg-white border border-black/10 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-navy">
                            {r.city}, {r.province}
                          </p>
                          <p className="mt-1 text-xs text-navy/60">
                            {propertyTypeLabel(r.property_type)} · {rentalTypeLabel(r.rental_type)} ·{" "}
                            {r.price_monthly_eur != null
                              ? `${r.price_monthly_eur}€ / mes`
                              : "Precio no indicado"}
                          </p>
                          <p className="mt-1 text-xs text-navy/60">
                            Viviste entre {r.lived_from_year} y {r.lived_to_year} ·{" "}
                            {stayLengthLabel(r.stay_length)}
                          </p>
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(r)}
                              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-black/5"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteReview(r.id)}
                              disabled={deletingId === r.id}
                              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-black/5 disabled:opacity-60"
                            >
                              {deletingId === r.id ? "Borrando..." : "Borrar"}
                            </button>
                          </div>
                        )}
                      </div>

                      {!isEditing ? (
                        <>
                          <div className="mt-4">
                            <p className="text-sm text-navy/80 whitespace-pre-line">{r.content}</p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                              Rating: {r.rating}/5
                            </span>
                            <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                              Recomendaría:{" "}
                              {r.would_recommend == null ? "—" : r.would_recommend ? "Sí" : "No"}
                            </span>
                            <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                              Ruido: {r.noise_level ?? "—"}
                            </span>
                            <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                              Mantenimiento: {r.maintenance_rating ?? "—"}
                            </span>
                            <span className="rounded-full border border-black/10 px-3 py-1 text-navy/80">
                              Fianza:{" "}
                              {r.deposit_returned == null
                                ? "—"
                                : r.deposit_returned
                                  ? "Devuelta"
                                  : "No devuelta"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Dirección</label>
                              <input
                                value={editForm.address ?? ""}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, address: e.target.value }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              />
                            </div>

                            {/* ✅ NUEVO: CP */}
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Código postal</label>
                              <input
                                value={editPostalCode}
                                onChange={(e) => setEditPostalCode(e.target.value)}
                                inputMode="numeric"
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                                placeholder="Ej: 46001"
                              />
                              <p className="text-xs text-navy/60">
                              </p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Precio / mes (€)</label>
                              <input
                                value={editForm.price_monthly_eur ?? ""}
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    price_monthly_eur:
                                      e.target.value === "" ? null : Number(e.target.value),
                                  }))
                                }
                                inputMode="decimal"
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Ciudad</label>
                              <input
                                value={editForm.city ?? ""}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, city: e.target.value }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Provincia</label>
                              <input
                                value={editForm.province ?? ""}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, province: e.target.value }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Vivienda</label>
                              <select
                                value={(editForm.property_type ?? r.property_type) as any}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, property_type: e.target.value as any }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              >
                                <option value="habitacion">Habitación</option>
                                <option value="piso">Piso</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Contrato</label>
                              <select
                                value={(editForm.rental_type ?? r.rental_type) as any}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, rental_type: e.target.value as any }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              >
                                <option value="temporal">Temporal</option>
                                <option value="largo_plazo">Largo plazo</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Desde (año)</label>
                              <input
                                value={editForm.lived_from_year ?? r.lived_from_year}
                                onChange={(e) =>
                                  setEditForm((p) => ({
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
                                value={editForm.lived_to_year ?? r.lived_to_year}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, lived_to_year: Number(e.target.value) }))
                                }
                                inputMode="numeric"
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Duración</label>
                              <select
                                value={(editForm.stay_length ?? r.stay_length) as any}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, stay_length: e.target.value as any }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              >
                                <option value="menos_6_meses">Hasta 6 meses</option>
                                <option value="6_12_meses">1 año</option>
                                <option value="mas_1_ano">Más de 1 año</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Rating general</label>
                              <select
                                value={Number(editForm.rating ?? r.rating)}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, rating: Number(e.target.value) }))
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
                              <label className="text-sm font-semibold text-navy">¿Lo recomendarías?</label>
                              <select
                                value={
                                  editForm.would_recommend === null
                                    ? "na"
                                    : editForm.would_recommend === true
                                      ? "yes"
                                      : "no"
                                }
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    would_recommend:
                                      e.target.value === "na" ? null : e.target.value === "yes",
                                  }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              >
                                <option value="na">Prefiero no decir</option>
                                <option value="yes">Sí</option>
                                <option value="no">No</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Ruido (1–5)</label>
                              <select
                                value={editForm.noise_level ?? ""}
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    noise_level: e.target.value === "" ? null : Number(e.target.value),
                                  }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              >
                                <option value="">(Opcional)</option>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">Mantenimiento (1–5)</label>
                              <select
                                value={editForm.maintenance_rating ?? ""}
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    maintenance_rating:
                                      e.target.value === "" ? null : Number(e.target.value),
                                  }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              >
                                <option value="">(Opcional)</option>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-navy">¿Devolvieron la fianza?</label>
                              <select
                                value={
                                  editForm.deposit_returned === null
                                    ? "na"
                                    : editForm.deposit_returned === true
                                      ? "yes"
                                      : "no"
                                }
                                onChange={(e) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    deposit_returned:
                                      e.target.value === "na" ? null : e.target.value === "yes",
                                  }))
                                }
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                              >
                                <option value="na">Prefiero no decir</option>
                                <option value="yes">Sí</option>
                                <option value="no">No</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-6 space-y-2">
                            <label className="text-sm font-semibold text-navy">Tu reseña</label>
                            <textarea
                              value={editForm.content ?? r.content}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, content: e.target.value }))
                              }
                              className="w-full min-h-[140px] rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
                            />
                          </div>

                          <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={savingEdit}
                              className="rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90 disabled:opacity-60"
                            >
                              {savingEdit ? "Guardando..." : "Guardar cambios"}
                            </button>

                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-full border border-black/10 px-6 py-3 font-semibold text-navy hover:bg-black/5"
                            >
                              Cancelar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-navy">Cuenta</h2>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleChangePassword}
              className={`${accountBtnWidth} inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90`}
            >
              Cambiar contraseña
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className={`${accountBtnWidth} inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90`}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
