import { meta as origenMeta, content as origenContent } from "@/content/blog/origen-mapa-alquiler";
import {
  meta as encontrarMeta,
  content as encontrarContent,
} from "@/content/blog/como-encontrar-piso-en-espana-sin-sustos";
import {
  meta as mercadoMeta,
  content as mercadoContent,
} from "@/content/blog/mercado-inmobiliario-en-espana";
import {
  meta as resenasMeta,
  content as resenasContent,
} from "@/content/blog/por-que-ver-resenas-antes-de-alquilar";

export type BlogPostMeta = {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  tags?: string[];
};

export type BlogPost = {
  slug: string;
  meta: BlogPostMeta;
};

const POSTS = [
  {
    slug: "origen-mapa-alquiler",
    meta: origenMeta as BlogPostMeta,
    content: origenContent,
  },
  {
    slug: "como-encontrar-piso-en-espana-sin-sustos",
    meta: encontrarMeta as BlogPostMeta,
    content: encontrarContent,
  },
  {
  slug: "mercado-inmobiliario-en-espana",
  meta: mercadoMeta as BlogPostMeta,
  content: mercadoContent,
},

{
    slug: "por-que-ver-resenas-antes-de-alquilar",
    meta: resenasMeta as BlogPostMeta,
    content: resenasContent,
  },

];

export function getAllPosts(): BlogPost[] {
  return POSTS.map(({ slug, meta }) => ({ slug, meta })).sort((a, b) =>
    a.meta.date < b.meta.date ? 1 : -1
  );
}

export function getPostBySlug(slug: string) {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) throw new Error(`Post not found: ${slug}`);

  return { meta: post.meta, content: post.content };
}