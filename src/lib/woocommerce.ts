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

// 清理 slug，将特殊字符替换为安全的 URL 字符
function sanitizeSlug(slug: string): string {
  // 首先解码 URL 编码的字符
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // 解码失败，使用原始 slug
  }
  
  return decoded
    .replace(/³/g, '3')  // 上标3替换为普通3
    .replace(/²/g, '2')  // 上标2替换为普通2
    .replace(/[¹⁴⁵⁶⁷⁸⁹⁰]/g, (c) => {
      // 其他上标数字
      const map: Record<string, string> = {
        '¹': '1', '⁴': '4', '⁵': '5', '⁶': '6',
        '⁷': '7', '⁸': '8', '⁹': '9', '⁰': '0'
      };
      return map[c] || c;
    })
    .replace(/[^a-zA-Z0-9-_]/g, (c) => {
      // 其他非 ASCII 字符尝试转义
      try {
        const encoded = encodeURIComponent(c);
        // 如果编码后是 %xx%xx 形式，替换为 -
        if (encoded.length > 3) return '-';
        return c;
      } catch {
        return '-';
      }
    });
}

function stripProduct(raw: RawWooProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    slug: sanitizeSlug(raw.slug),
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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // 先尝试直接匹配
    let batch = await wcFetch<RawWooProduct[]>('/products', {
      slug,
      status: 'publish',
      per_page: 1,
    });
    // 如果没找到，尝试匹配清理后的版本
    if (batch.length === 0) {
      batch = await wcFetch<RawWooProduct[]>('/products', {
        slug: sanitizeSlug(slug),
        status: 'publish',
        per_page: 1,
      });
    }
    if (batch.length === 0) return null;
    return stripProduct(batch[0]);
  } catch {
    return null;
  }
}

export async function getAllProductSlugs(): Promise<string[]> {
  // 直接获取原始 slug，并返回所有可能的变体
  const slugs: string[] = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const batch = await wcFetch<Pick<RawWooProduct, 'slug'>[]>('/products', {
      per_page: perPage,
      page,
      status: 'publish',
      _fields: 'slug',
    });
    for (const p of batch) {
      const rawSlug = p.slug;
      const cleanSlug = sanitizeSlug(rawSlug);
      
      // 添加清理后的 slug（主要路径）
      slugs.push(cleanSlug);
      
      // 如果原始 slug 与清理后的不同
      if (rawSlug !== cleanSlug) {
        slugs.push(rawSlug);
        // 同时添加解码后的版本（如果 API 返回的是编码后的）
        try {
          const decodedSlug = decodeURIComponent(rawSlug);
          if (decodedSlug !== rawSlug && !slugs.includes(decodedSlug)) {
            slugs.push(decodedSlug);
          }
        } catch {
          // 解码失败，忽略
        }
      }
    }
    if (batch.length < perPage) break;
    page += 1;
  }
  return [...new Set(slugs)];
}
