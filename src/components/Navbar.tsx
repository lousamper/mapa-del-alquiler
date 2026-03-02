"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";

type Role = "tenant" | "owner" | "admin" | null;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const user: any = useUser();
  const role: Role = (user?.role as Role) ?? null;

  const profileHref = useMemo(() => {
    if (!user) return "/auth";
    if (role === "admin") return "/admin";
    return role === "owner" ? "/owner" : "/profile";
  }, [user, role]);

  const navLinks = useMemo(() => {
    const base = [
      { href: "/map", label: "Ver mapa" },
      { href: "/#contacto", label: "Contacto" },
      { href: "/#faqs", label: "FAQs" },
      { href: "/blog", label: "Blog" }, // 👈 NUEVO LINK
    ];

    const adminOnly = role === "admin" ? [{ href: "/admin", label: "Admin" }] : [];

    const authed = user ? [{ href: profileHref, label: "Mi perfil" }] : [];

    const tenantOnly =
      role === "tenant"
        ? [{ href: "/add-review", label: "Dejar una reseña" }]
        : !user
          ? [{ href: "/auth?role=tenant", label: "Dejar una reseña" }]
          : [];

    const login = !user ? [{ href: "/auth", label: "Iniciar sesión" }] : [];

    const all = [...base, ...adminOnly, ...authed, ...tenantOnly, ...login];

    // ✅ evitar duplicados por href
    return Array.from(new Map(all.map((x) => [x.href, x])).values());
  }, [user, role, profileHref]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-blue text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" onClick={() => setOpen(false)} aria-label="Ir al inicio">
            <Image src="/logo.png" alt="El Mapa del Alquiler" width={180} height={28} priority />
          </Link>

          <button
            className="rounded-md px-3 py-2 hover:bg-white/10"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        className={`fixed right-0 top-0 z-[70] h-dvh w-[280px] max-w-[80vw] bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <span className="font-extrabold text-navy">Menú</span>
          <button
            className="rounded-md px-3 py-2 text-navy hover:bg-black/5"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="px-5 py-5">
          <ul className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 font-semibold text-navy hover:bg-black/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {user && (
            <div className="mt-6 border-t border-black/10 pt-6">
              <button
                onClick={handleLogout}
                className="w-full rounded-full border border-black/10 px-6 py-3 font-semibold text-navy hover:bg-black/5"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}