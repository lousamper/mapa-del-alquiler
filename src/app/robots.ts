// src/app/robots.ts
import type { MetadataRoute } from "next";

function siteUrl() {
  // En local: http://localhost:3000
  // En Vercel: VERCEL_URL suele venir sin https
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  // Normaliza sin slash final
  return env.replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      // ✅ Crawlers normales (Google/Bing/etc.)
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Si no quieres que indexen estas rutas de auth/privadas, déjalo así.
          // Si te da igual, puedes borrar estas líneas.
          "/auth",
          "/reset-password",
          "/profile",
          "/owner",
          "/add-review",
        ],
      },

      // ✅ Crawlers de IA (permitidos)
      // Si quieres “gestionar” IA, aquí puedes añadir disallow a alguno.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
