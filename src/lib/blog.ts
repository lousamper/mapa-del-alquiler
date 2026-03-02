import { meta as origenMeta, content as origenContent } from "@/content/blog/origen-mapa-alquiler";

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