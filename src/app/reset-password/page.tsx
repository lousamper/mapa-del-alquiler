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

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {
      // Si falla, no bloqueamos UI; updateUser mostrará el error.
    });
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setInfo("Contraseña actualizada. Ya puedes continuar.");
      setTimeout(() => router.push("/auth"), 800);
    }

    setLoading(false);
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
          />

          {info && <p className="text-sm text-green-700">{info}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-background disabled:opacity-60"
          >
            Guardar contraseña
          </button>
        </form>
      </div>
    </main>
  );
}