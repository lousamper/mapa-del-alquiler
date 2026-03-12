import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog · El Mapa del Alquiler",
  description: "La información que necesitas para alquilar con más información y menos sorpresas.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-extrabold text-navy">Blog</h1>
        <p className="mt-2 text-navy/70">
          Noticias y consejos prácticos para alquilar mejor, evitar problemas y tomar decisiones con más datos.
        </p>

        <div className="mt-8 space-y-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block rounded-2xl bg-white border border-black/10 p-6 hover:bg-[#ff8ed1]/50 transition"
            >
              <div className="text-xs text-navy/60">{new Date(p.meta.date).toLocaleDateString("es-ES")}</div>
              <div className="mt-2 text-lg font-extrabold text-navy">{p.meta.title}</div>
              <div className="mt-2 text-sm text-navy/70">{p.meta.description}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}