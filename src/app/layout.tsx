import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsGate from "@/components/AnalyticsGate";
import AdsGate from "@/components/AdsGate";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.elmapadelalquiler.es";

const title = "El Mapa del Alquiler | Reseñas de pisos y habitaciones de alquiler en España";
const description =
  "Lee y comparte opiniones anónimas reales de pisos en España, también Reseñas de barrios para saber cómo es realmente vivir en cada zona. Alquila con más información.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: title,


  alternates: {
    canonical: siteUrl,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
     },

  openGraph: {
    title,
    description,
    type: "website",
    url: siteUrl,
    siteName: title,
    locale: "es_ES",
    images: [
      {
        url: "/og.png", // crea/publica esta imagen en /public/og.png
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  other: {
    "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "",
  },

  
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CookieBanner />
        <AnalyticsGate id={process.env.NEXT_PUBLIC_GA_ID ?? ""} />

        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? (
  <Script
    async
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
    crossOrigin="anonymous"
    strategy="afterInteractive"
  />
) : null}

        <AdsGate clientId={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ""} />

        <Script
  id="schema-website"
  type="application/ld+json"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "El Mapa del Alquiler",
      url: siteUrl,
      description,
      inLanguage: "es-ES",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/map?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }),
  }}
/>

<Script
    id="schema-organization"
    type="application/ld+json"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "El Mapa del Alquiler",
        url: siteUrl,
        logo: `${siteUrl}/og.png`,
        sameAs: [
          "https://www.linkedin.com/company/mapadelalquiler",
          "https://www.tiktok.com/@elmapadelalquiler",
          "https://www.instagram.com/mapadelalquiler",
          "https://x.com/mapadelalquiler"
        ],
      }),
    }}
  />

        {children}
        <Footer />
                {/* ✅ Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
