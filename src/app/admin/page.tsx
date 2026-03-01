"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  role: "tenant" | "owner" | "admin";
  alias: string;
};

type Report = {
  id: string;
  created_at: string;
  review_id: string;
  reason: string;
  details: string | null;
  reporter_email: string | null;
  reporter_role: string | null;
  reporter_id: string | null;

  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;

  reviews: {
    id: string;
    address: string;
    city: string;
    province: string;
    content: string;
    created_at: string;
    rating: number;
    property_type: "habitacion" | "piso";
    rental_type: "temporal" | "largo_plazo";
    hidden: boolean;
  } | null;
};

type StatusFilter = "all" | "open" | "resolved";
type SortOrder = "newest" | "oldest";

export default function AdminReportsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<StatusFilter>("open");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [savingId, setSavingId] = useState<string | null>(null);

  /* ======================
     CARGAR REPORTES
  ====================== */
  async function loadReports() {
    setReportsLoading(true);
    setErrorMsg(null);

    const ascending = sort === "oldest";

    let q = supabase
      .from("review_reports")
      .select(
        `
        id, created_at, review_id, reason, details, reporter_email, reporter_role, reporter_id,
        resolved, resolved_at, resolved_by,
        reviews:reviews (
          id, address, city, province, content, created_at,
          rating, property_type, rental_type, hidden
        )
      `
      )
      .order("created_at", { ascending })
      .limit(500);

    if (status === "open") q = q.eq("resolved", false);
    if (status === "resolved") q = q.eq("resolved", true);

    const { data, error } = await q;

    if (error) {
      setErrorMsg(error.message);
      setReports([]);
      setReportsLoading(false);
      return;
    }

    setReports((data ?? []) as any);
    setReportsLoading(false);
  }

  /* ======================
     INIT + AUTH
  ====================== */
  useEffect(() => {
    async function init() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/auth");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, role, alias")
        .eq("id", auth.user.id)
        .single();

      if (!prof || prof.role !== "admin") {
        router.push("/");
        return;
      }

      setProfile(prof);
      setLoading(false);
      await loadReports();
    }

    init();
  }, [router]);

  useEffect(() => {
    if (!profile) return;
    loadReports();
  }, [status, sort, profile?.id]);

  /* ======================
     TOGGLE RESUELTA
  ====================== */
  async function toggleResolved(rep: Report, next: boolean) {
    if (!profile?.id) return;

    setSavingId(rep.id);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from("review_reports")
        .update({
          resolved: next,
          resolved_at: next ? new Date().toISOString() : null,
          resolved_by: next ? profile.id : null,
        })
        .eq("id", rep.id);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) =>
          r.id === rep.id
            ? { ...r, resolved: next, resolved_at: next ? new Date().toISOString() : null }
            : r
        )
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo actualizar el estado.");
    } finally {
      setSavingId(null);
    }
  }

  /* ======================
     OCULTAR / MOSTRAR RESEÑA
  ====================== */
  async function toggleHidden(rep: Report, next: boolean) {
    if (!profile?.id || !rep.reviews?.id) return;

    setSavingId(rep.id);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          hidden: next,
          hidden_at: next ? new Date().toISOString() : null,
          hidden_by: next ? profile.id : null,
        })
        .eq("id", rep.reviews.id);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) =>
          r.id === rep.id
            ? {
                ...r,
                reviews: r.reviews ? { ...r.reviews, hidden: next } : r.reviews,
              }
            : r
        )
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo ocultar/mostrar la reseña.");
    } finally {
      setSavingId(null);
    }
  }

  const countOpen = useMemo(() => reports.filter((r) => !r.resolved).length, [reports]);
  const countResolved = useMemo(() => reports.filter((r) => r.resolved).length, [reports]);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Admin · Reportes</h1>

        {/* CONTROLES */}
        <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6">
          <p className="text-sm text-navy/60">
            Sesión: <span className="font-semibold">{profile?.alias}</span> · admin
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm"
            >
              <option value="open">No resueltos</option>
              <option value="resolved">Resueltos</option>
              <option value="all">Todos</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm"
            >
              <option value="newest">Más nuevos</option>
              <option value="oldest">Más antiguos</option>
            </select>

            <div className="ml-auto text-xs text-navy/60">
              Abiertos: {countOpen} · Resueltos: {countResolved}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 rounded-xl bg-white border border-red-200 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* LISTADO */}
        <div className="mt-8 space-y-4">
          {reportsLoading ? (
            <p>Cargando…</p>
          ) : (
            reports.map((rep) => {
  const rv = rep.reviews;

  return (
    <div key={rep.id} className="rounded-2xl bg-white border p-6">
      <div className="flex justify-between">
        <div>
          <p className="font-semibold">Reporte</p>
          <p className="text-xs">{new Date(rep.created_at).toLocaleString()}</p>
        </div>

        <label className="text-xs flex items-center gap-2">
          <input
            type="checkbox"
            checked={rep.resolved}
            disabled={savingId === rep.id}
            onChange={(e) => toggleResolved(rep, e.target.checked)}
          />
          Resuelta
        </label>
      </div>

      <p className="mt-3 text-sm">
        <strong>Motivo:</strong> {rep.reason}
      </p>

      {rv ? (
        <div className="mt-4 rounded-xl bg-gray-100 p-4">
          <p className="font-semibold">
            {rv.rating}/5 · {rv.property_type}
          </p>
          <p className="text-sm">{rv.content}</p>

          <div className="mt-3 flex items-center gap-2">
            <button
              disabled={savingId === rep.id}
              onClick={() => toggleHidden(rep, !rv.hidden)}
              className="rounded-full border px-4 py-2 text-xs"
            >
              {rv.hidden ? "Mostrar en mapa" : "Ocultar del mapa"}
            </button>

            {rv.hidden && (
              <span className="text-xs font-semibold text-red-700">Oculta</span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
})

          )}
        </div>
      </section>
    </main>
  );
}
