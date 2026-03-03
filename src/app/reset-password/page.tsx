"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Para deshabilitar el form si el link es inválido o no hay sesión
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    const run = async () => {
      setError(null);
      setInfo(null);

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      // Si no hay code, NO intentes PKCE
      if (!code) {
        setCanReset(false);
        setError(
          "Este enlace no es válido (falta el código). Vuelve a solicitar la recuperación de contraseña."
        );
        return;
      }

      // Intentamos canjear el code por una sesión (PKCE)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (exchangeError) {
        setCanReset(false);
        setError(
          "El enlace de recuperación es inválido o expiró. Vuelve a solicitarlo e intenta abrir el email en el mismo navegador/dispositivo."
        );
        return;
      }

      // Confirmamos que realmente hay sesión activa (necesaria para updateUser)
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setCanReset(false);
        setError(
          "No se pudo iniciar la sesión de recuperación. Vuelve a solicitar el enlace de recuperación."
        );
        return;
      }

      setCanReset(true);
      setInfo("Listo: ya puedes crear una nueva contraseña.");
    };

    run();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      // Seguridad extra: si por lo que sea no hay sesión, no seguimos
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setCanReset(false);
        setError(
          "Tu sesión de recuperación no está activa. Vuelve a solicitar el enlace e inténtalo de nuevo."
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setInfo("Contraseña actualizada. Ya puedes iniciar sesión.");
      setTimeout(() => router.push("/auth"), 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-2xl font-extrabold text-navy">Nueva contraseña</h1>

        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña (mínimo 6)"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy"
            disabled={!canReset || loading}
          />

          {info && <p className="text-sm text-green-700">{info}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={!canReset || loading}
            className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-background disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>

        {!canReset && (
          <p className="mt-4 text-xs text-navy/60">
            Tip: solicita el reset y abre el email en el mismo dispositivo y navegador (evita “vista previa” del correo).
          </p>
        )}
      </div>
    </main>
  );
}