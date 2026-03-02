"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

type Role = "tenant" | "owner";
type Mode = "login" | "signup";

function generateAlias(role: Role) {
  const random = Math.floor(1000 + Math.random() * 9000);
  return role === "tenant" ? `anonimo-${random}` : `propietario-${random}`;
}

export default function AuthClient() {
  const router = useRouter();
  const params = useSearchParams();

  const defaultRoleFromQuery = (params.get("role") as Role | null) ?? null;

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>(defaultRoleFromQuery ?? "tenant");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const title = useMemo(() => {
    if (mode === "login") return "Inicia sesión";
    return "Crea tu cuenta";
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signup") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const { data, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role }, // <-- esto lo lee el trigger
    emailRedirectTo: `${siteUrl}/account`,
  },
});
if (signUpError) throw signUpError;

  const userId = data.user?.id;
  if (!userId) {
    throw new Error(
      "No se pudo completar el registro. Revisa tu email por si requiere verificación."
    );
  }


  setMode("login");
  setEmail("");
  setPassword("");
  setInfo(
    "Te enviamos un email para confirmar tu cuenta. Revisa tu bandeja y luego inicia sesión."
  );
  return;
}

      // LOGIN
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;

      const userId = data.user?.id;
      if (!userId) throw new Error("No se pudo iniciar sesión.");

      const { data: profile, error: profileReadError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileReadError) throw profileReadError;

      // ✅ redirección por rol (admin -> /admin)
      if (profile.role === "admin") router.push("/admin");
      else router.push(profile.role === "tenant" ? "/profile" : "/owner");
    } catch (err: any) {
  console.error(err);

  const rawMsg = err?.message ?? "";
  const msg = rawMsg.toLowerCase();

  if (msg.includes("row-level security")) {
    setError(
      "Estamos teniendo un problema creando tu perfil. Intenta de nuevo en unos segundos."
    );
  } else if (msg.includes("invalid login credentials")) {
    setError(
      "No encontramos una cuenta con ese email o la contraseña no es correcta. Si no tienes cuenta, regístrate."
    );
  } else if (msg.includes("email not confirmed")) {
    setError(
      "Tu cuenta aún no está confirmada. Revisa tu email para activarla."
    );
  } else {
    // fallback genérico (mejor que mostrar errores técnicos)
    setError("Ocurrió un error. Intenta de nuevo.");
  }
} finally {
  setLoading(false);
}
  }

  async function handleForgotPassword() {
  setError(null);
  setInfo(null);

  if (!email) {
    setError("Introduce tu email para recuperar la contraseña.");
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) setError(error.message);
  else setInfo("Te enviamos un email para recuperar tu contraseña.");
}

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />

      <section className="mx-auto w-full max-w-xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">{title}</h1>
        <p className="mt-2 text-navy/70">
          Tu email nunca se mostrará públicamente. En el mapa aparecerás como{" "}
          <span className="font-semibold">anónimo/a</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {mode === "signup" && (
            <div className="rounded-2xl bg-white p-4 border border-black/10">
              <p className="text-sm font-semibold text-navy">¿Qué tipo de cuenta quieres crear?</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRole("tenant")}
                  className={`rounded-xl px-4 py-3 text-left border transition ${
                    role === "tenant"
                      ? "border-navy bg-navy text-white"
                      : "border-black/10 bg-white text-navy hover:bg-black/5"
                  }`}
                >
                  <div className="font-semibold">Inquilino/a</div>
                  <div className="text-xs opacity-80">Podrás dejar reseñas y reportar.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`rounded-xl px-4 py-3 text-left border transition ${
                    role === "owner"
                      ? "border-navy bg-navy text-white"
                      : "border-black/10 bg-white text-navy hover:bg-black/5"
                  }`}
                >
                  <div className="font-semibold">Propietario/a</div>
                  <div className="text-xs opacity-80">Podrás responder y reportar reseñas.</div>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-navy">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy outline-none focus-visible:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-navy">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy outline-none focus-visible:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              placeholder="Mínimo 6 caracteres"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-semibold text-navy underline hover:opacity-80"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

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
            disabled={loading}
            className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-background hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-navy/70">
            {mode === "signup" ? (
              <>
                ¿Ya tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setInfo(null);
                  }}
                  className="font-semibold text-navy underline hover:opacity-80"
                >
                  Inicia sesión
                </button>
              </>
            ) : (
              <>
                ¿No tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                  className="font-semibold text-navy underline hover:opacity-80"
                >
                  Regístrate
                </button>
              </>
            )}
          </p>

          <p className="text-xs text-navy/60 text-left">
            Al continuar, aceptas los{" "}
            <a href="/terminos" className="underline hover:opacity-80">
              términos
            </a>{" "}
            y la{" "}
            <a href="/privacidad" className="underline hover:opacity-80">
              política de privacidad
            </a>
            .
          </p>

          <Link href="/" className="block text-sm font-semibold text-navy hover:opacity-80">
            ← Volver al inicio
          </Link>
        </form>
      </section>
    </main>
  );
}
