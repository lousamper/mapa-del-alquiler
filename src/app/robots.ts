import type { MetadataRoute } from "next";

function siteUrl() {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  return env.replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/auth",
          "/reset-password",
          "/profile",
          "/owner",
          "/add-review",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}