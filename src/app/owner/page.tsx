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

export default function OwnerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ ahora guardamos SOLO respuestas del owner
  const [responses, setResponses] = useState<OwnerResponseRow[]>([]);

  const [info, setInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      setLoading(false);
    }

    load();
  }, [router]);

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

          {/* ✅ texto extra (añadido) */}
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
      </div>
    </main>
  );
}
