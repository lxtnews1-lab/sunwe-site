/**
 * WooCommerce REST API client.
 * All product payloads intentionally omit any price-related fields.
 */

const WC_BASE = `${import.meta.env.WP_API_URL || 'https://sunwevehicle.com'}/wp-json/wc/v3`;

function getAuthHeader(): string {
  const key = import.meta.env.WC_KEY;
  const secret = import.meta.env.WC_SECRET;
  const token = `${key}:${secret}`;
  if (typeof Buffer !== 'undefined') {
    return `Basic ${Buffer.from(token, 'utf8').toString('base64')}`;
  }
  return `Basic ${btoa(token)}`;
}

async function wcFetch<T>(path: string, searchParams?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${WC_BASE}${path}`);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== undefined && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: getAuthHeader(),
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WooCommerce API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
}

export interface WooProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooProductAttribute {
  id: number;
  name: string;
  slug: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WooProductCategoryRef {
  id: number;
  name: string;
  slug: string;
}

/**
 * Product shape used in the app — no price fields.
 */
export interface Product {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  images: WooProductImage[];
  attributes: WooProductAttribute[];
  categories: WooProductCategoryRef[];
}

interface RawWooProduct {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  images: WooProductImage[];
  attributes: WooProductAttribute[];
  categories: WooProductCategoryRef[];
}

function stripProduct(raw: RawWooProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    short_description: raw.short_description ?? '',
    description: raw.description ?? '',
    images: Array.isArray(raw.images) ? raw.images : [],
    attributes: Array.isArray(raw.attributes) ? raw.attributes : [],
    categories: Array.isArray(raw.categories) ? raw.categories : [],
  };
}

export async function getCategories(): Promise<WooCategory[]> {
  const all: WooCategory[] = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const batch = await wcFetch<WooCategory[]>('/products/categories', {
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

export async function getProducts(perPage: number): Promise<Product[]> {
  const raw = await wcFetch<RawWooProduct[]>('/products', {
    per_page: perPage,
    status: 'publish',
  });
  return raw.map(stripProduct);
}

export async function getProductsByCategory(categoryId: number, perPage: number): Promise<Product[]> {
  const raw = await wcFetch<RawWooProduct[]>('/products', {
    per_page: perPage,
    status: 'publish',
    category: categoryId,
  });
  return raw.map(stripProduct);
}

export async function getProduct(id: number): Promise<Product | null> {
  try {
    const raw = await wcFetch<RawWooProduct>(`/products/${id}`);
    return stripProduct(raw);
  } catch {
    return null;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const out: Product[] = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const batch = await wcFetch<RawWooProduct[]>('/products', {
      per_page: perPage,
      page,
      status: 'publish',
    });
    out.push(...batch.map(stripProduct));
    if (batch.length < perPage) break;
    page += 1;
  }
  return out;
}

export async function getAllProductIds(): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const batch = await wcFetch<Pick<RawWooProduct, 'id'>[]>('/products', {
      per_page: perPage,
      page,
      status: 'publish',
      _fields: 'id',
    });
    for (const p of batch) ids.push(p.id);
    if (batch.length < perPage) break;
    page += 1;
  }
  return ids;
}
