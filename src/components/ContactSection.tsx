"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInfo(null);
    setError(null);

    // Honeypot: si lo completan bots → ignorar
    if (website) {
      setInfo("¡Gracias! Recibimos tu mensaje.");
      setName("");
      setEmail("");
      setMessage("");
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setInfo("¡Gracias! Recibimos tu mensaje y responderemos pronto.");
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <section id="contacto" className="scroll-mt-10 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-navy">
            ¿Tienes dudas o quieres dejarnos un mensaje?
          </h2>
          <p className="mt-3 text-navy/70">
            Puedes hacerlo aquí, te respondemos lo antes posible.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-[#f5f5f5] border border-black/10 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot invisible */}
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="space-y-2 text-left">
              <label className="text-sm font-semibold text-navy">Tu nombre</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-sm font-semibold text-navy">Tu correo</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                placeholder="tucorreo@email.com"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-sm font-semibold text-navy">Tu mensaje</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-navy outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                placeholder="Cuéntanos en qué podemos ayudarte ✨"
              />
            </div>

            {info && <p className="text-sm text-green-700">{info}</p>}
            {error && <p className="text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-primary px-10 py-3 font-semibold text-background hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
          <p className="mt-6 text-left text-sm text-navy/70">
  O si lo prefieres, puedes escribirnos directamente a{" "}
  <a
    href="mailto:hola@elmapadelalquiler.es"
    className="font-semibold text-navy underline hover:opacity-80"
  >
    hola@elmapadelalquiler.es
  </a>
</p>
        </div>
      </div>
    </section>
  );
}
