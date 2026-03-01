import type { MetadataRoute } from "next";

function siteUrl() {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  return env.replace(/\/$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/map", priority: 0.9, changeFrequency: "daily" as const },

    { path: "/aviso-legal", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/privacidad", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/terminos", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/normas", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/cookies", priority: 0.4, changeFrequency: "yearly" as const },
  ];

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}