"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ranRef = useRef(false); // ✅ evita doble verify en dev/StrictMode

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function run() {
      try {
        setError(null);
        setInfo(null);

        if (!token_hash || type !== "recovery") {
          setError(
            "Este enlace no es válido. Vuelve a solicitar la recuperación de contraseña."
          );
          setVerifying(false);
          return;
        }

        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash,
        });


        if (verifyError) {
          setError(verifyError.message);
          setVerifying(false);
          return;
        }

        // A veces verifyOtp devuelve session, pero igual verificamos si quedó persistida
        const sessionRes = await supabase.auth.getSession();

        // Si por algún motivo no hay sesión, intentamos setSession cuando venga en data.session
        if (!sessionRes.data.session && data?.session?.access_token && data?.session?.refresh_token) {

          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });


          if (setSessionError) {
            setError(setSessionError.message);
            setVerifying(false);
            return;
          }

          const sessionRes2 = await supabase.auth.getSession();
        }

        setInfo("Enlace verificado. Ahora puedes crear tu nueva contraseña.");
        setVerifying(false);
      } catch (e: any) {
        setError("Ocurrió un error verificando el enlace. Intenta de nuevo.");
        setVerifying(false);
      }
    }

    run();
    // ⚠️ NO pongas searchParams como dependencia si querés evitar re-correr.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {

      const sessionBefore = await supabase.auth.getSession();

      const { data, error: updateError } = await supabase.auth.updateUser({ password });


      if (updateError) {
        setError(updateError.message);
      } else {
        setInfo("Contraseña actualizada. Ya puedes iniciar sesión.");
        setTimeout(() => router.push("/auth"), 800);
      }
    } catch (e: any) {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-2xl font-extrabold text-navy">Nueva contraseña</h1>

        {verifying ? (
          <p className="mt-4 text-sm text-navy/70">Verificando enlace de recuperación…</p>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña (mínimo 6)"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
            />

            {info && <p className="text-sm text-green-700">{info}</p>}
            {error && <p className="text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading || !!error}
              className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-background disabled:opacity-60"
            >
              {loading ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}