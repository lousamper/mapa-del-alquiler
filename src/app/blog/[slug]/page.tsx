import Navbar from "@/components/Navbar";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { notFound } from "next/navigation";

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];

  // 1️⃣ cursiva con _texto_
  const italicRegex = /_(.+?)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = italicRegex.exec(text)) !== null) {
    const [full, italicText] = match;
    const start = match.index;

    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push(<em key={`i-${start}`}>{italicText}</em>);
    lastIndex = start + full.length;
  }

  let remaining = text.slice(lastIndex);

  // 2️⃣ negrita con **texto**
  const boldRegex = /\*\*(.+?)\*\*/g;
  lastIndex = 0;

  while ((match = boldRegex.exec(remaining)) !== null) {
    const [full, boldText] = match;
    const start = match.index;

    if (start > lastIndex) parts.push(remaining.slice(lastIndex, start));
    parts.push(<strong key={`b-${start}`}>{boldText}</strong>);
    lastIndex = start + full.length;
  }

  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts;
}

function renderMarkdownBasic(md: string) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");

  const out: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (list.length) {
      out.push(
        <ul key={key} className="my-4 list-disc pl-6 text-navy/80">
          {list}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((rawLine, i) => {
    const line = rawLine.trimEnd();

    // línea vacía
    if (!line.trim()) {
      flushList(`list-${i}`);
      return;
    }

    // separador ---
    if (line.trim() === "---") {
      flushList(`list-${i}`);
      out.push(<hr key={`hr-${i}`} className="my-6 border-black/10" />);
      return;
    }

    // headings
    if (line.startsWith("## ")) {
      flushList(`list-${i}`);
      out.push(
        <h2 key={`h2-${i}`} className="mt-8 text-xl font-bold text-navy">
          {renderInline(line.slice(3))}
        </h2>
      );
      return;
    }

    if (line.startsWith("# ")) {
      flushList(`list-${i}`);
      out.push(
        <h1 key={`h1-${i}`} className="mt-6 text-2xl font-extrabold text-navy">
          {renderInline(line.slice(2))}
        </h1>
      );
      return;
    }

    // blockquote >
    if (line.startsWith("> ")) {
      flushList(`list-${i}`);
      out.push(
        <blockquote
          key={`bq-${i}`}
          className="my-5 rounded-lg border-l-4 border-black/10 bg-black/[0.02] px-4 py-3 text-navy/80"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // list items "- "
    if (line.startsWith("- ")) {
      list.push(
        <li key={`li-${i}`} className="my-1">
          {renderInline(line.slice(2))}
        </li>
      );
      return;
    }

    // párrafo normal
    flushList(`list-${i}`);
    out.push(
      <p key={`p-${i}`} className="my-4 leading-relaxed text-navy/80">
        {renderInline(line)}
      </p>
    );
  });

  flushList("list-end");
  return out;
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  try {
    const { meta } = getPostBySlug(slug);
    return {
      title: `${meta.title} · El Mapa del Alquiler`,
      description: meta.description,
    };
  } catch {
    return {
      title: "Post no encontrado · El Mapa del Alquiler",
      description: "Este artículo no existe o fue movido.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const { meta, content } = post;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <article className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-xs text-navy/60">
          {new Date(meta.date).toLocaleDateString("es-ES")}
        </div>
        <h1 className="mt-2 text-3xl font-extrabold text-navy">{meta.title}</h1>
        <p className="mt-3 text-navy/70">{meta.description}</p>

        <div className="mt-8 rounded-xl bg-white border border-black/10 p-6">
  <div className="text-navy">{renderMarkdownBasic(content)}</div>
</div>
      </article>
    </main>
  );
}