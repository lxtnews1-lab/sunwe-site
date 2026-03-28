/**
 * WordPress REST API (public posts & categories).
 */

const WP_BASE = `${import.meta.env.WP_API_URL || 'https://sunwevehicle.com'}/wp-json/wp/v2`;

export interface WpCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface WpPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

async function wpFetch<T>(path: string, searchParams?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${WP_BASE}${path}`);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== undefined && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WordPress API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function getPosts(perPage: number): Promise<WpPost[]> {
  return wpFetch<WpPost[]>('/posts', {
    per_page: perPage,
    status: 'publish',
    _embed: 1,
    orderby: 'date',
    order: 'desc',
  });
}

export async function getAllPosts(): Promise<WpPost[]> {
  const all: WpPost[] = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const batch = await wpFetch<WpPost[]>('/posts', {
      per_page: perPage,
      page,
      status: 'publish',
      _embed: 1,
      orderby: 'date',
      order: 'desc',
    });
    all.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return all;
}

export async function getPost(slug: string): Promise<WpPost | null> {
  const list = await wpFetch<WpPost[]>('/posts', {
    per_page: 1,
    slug,
    status: 'publish',
    _embed: 1,
  });
  return list[0] ?? null;
}

export async function getPostCategories(): Promise<WpCategory[]> {
  const all: WpCategory[] = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const batch = await wpFetch<WpCategory[]>('/categories', {
      per_page: perPage,
      page,
      hide_empty: 0,
    });
    all.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPostsByCategory(categoryId: number, perPage: number): Promise<WpPost[]> {
  return wpFetch<WpPost[]>('/posts', {
    per_page: perPage,
    status: 'publish',
    categories: categoryId,
    _embed: 1,
    orderby: 'date',
    order: 'desc',
  });
}

export async function getAllPostSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const batch = await wpFetch<Array<{ slug: string }>>('/posts', {
      per_page: perPage,
      page,
      status: 'publish',
      _fields: 'slug',
    });
    for (const p of batch) slugs.push(p.slug);
    if (batch.length < perPage) break;
    page += 1;
  }
  return slugs;
}

export function getFeaturedImageUrl(post: WpPost): string | null {
  const embedded = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  return embedded ?? null;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
