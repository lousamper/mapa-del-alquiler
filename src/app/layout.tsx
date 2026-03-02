import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsGate from "@/components/AnalyticsGate";
import AdsGate from "@/components/AdsGate";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const title = "El Mapa del Alquiler";
const description =
  "Reseñas anónimas de pisos y habitaciones en España para alquilar con más información y menos riesgo.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: title,
  robots: {
    index: true,
    follow: true,
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
        <AdsGate clientId={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ""} />

        {children}
        <Footer />
                {/* ✅ Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
