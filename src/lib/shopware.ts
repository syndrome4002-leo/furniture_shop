// Shopware Store API client.
//
// One pair of env vars (NEXT_PUBLIC_SHOPWARE_URL / NEXT_PUBLIC_SHOPWARE_ACCESS_KEY)
// serves both build-time (Node) and browser (cart) calls. NEXT_PUBLIC_ vars are
// readable in both environments, and the Store API access key is a public
// sales-channel credential by design — so a single public pair is correct.

const baseUrl = process.env.NEXT_PUBLIC_SHOPWARE_URL?.replace(/\/$/, "");

const accessKey = process.env.NEXT_PUBLIC_SHOPWARE_ACCESS_KEY;

function requireConfig(): { baseUrl: string; accessKey: string } {
  if (!baseUrl || !accessKey) {
    throw new Error(
      "Missing Shopware config. Set NEXT_PUBLIC_SHOPWARE_URL and NEXT_PUBLIC_SHOPWARE_ACCESS_KEY in .env.",
    );
  }
  return { baseUrl, accessKey };
}

export interface ShopwareImage {
  url: string;
  alt?: string | null;
  width?: number;
  height?: number;
}

export interface ShopwarePrice {
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
}

export interface ShopwareProduct {
  id: string;
  productNumber: string;
  slug: string;
  name: string;
  description: string | null;
  manufacturer: string | null;
  price: ShopwarePrice | null;
  cover: ShopwareImage | null;
  gallery: ShopwareImage[];
}

interface RawCalculatedPrice {
  unitPrice: number;
  totalPrice: number;
  calculatedTaxes?: Array<{ taxRate: number }>;
}

interface RawMedia {
  url?: string;
  alt?: string | null;
  metaData?: { width?: number; height?: number };
}

interface RawCover {
  media?: RawMedia;
}

interface RawProductMedia {
  media?: RawMedia;
}

interface RawProduct {
  id: string;
  productNumber: string;
  name: string;
  description?: string | null;
  manufacturer?: { name?: string } | null;
  calculatedPrice?: RawCalculatedPrice | null;
  cover?: RawCover | null;
  media?: RawProductMedia[] | null;
}

function toSlug(productNumber: string): string {
  return productNumber.toLowerCase();
}

function mapImage(m?: RawMedia): ShopwareImage | null {
  if (!m?.url) return null;
  return {
    url: m.url,
    alt: m.alt ?? null,
    width: m.metaData?.width,
    height: m.metaData?.height,
  };
}

function mapProduct(p: RawProduct): ShopwareProduct {
  return {
    id: p.id,
    productNumber: p.productNumber,
    slug: toSlug(p.productNumber),
    name: p.name,
    description: p.description ?? null,
    manufacturer: p.manufacturer?.name ?? null,
    price: p.calculatedPrice
      ? {
          unitPrice: p.calculatedPrice.unitPrice,
          totalPrice: p.calculatedPrice.totalPrice,
          taxRate: p.calculatedPrice.calculatedTaxes?.[0]?.taxRate,
        }
      : null,
    cover: mapImage(p.cover?.media),
    gallery: (p.media ?? [])
      .map((m) => mapImage(m.media))
      .filter((m): m is ShopwareImage => m !== null),
  };
}

interface SearchResult<T> {
  elements: T[];
  total: number;
}

async function storeApi<T>(
  path: string,
  init: { method?: "GET" | "POST" | "DELETE" | "PATCH"; body?: unknown; contextToken?: string } = {},
): Promise<T> {
  const { baseUrl, accessKey } = requireConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "sw-access-key": accessKey,
  };
  if (init.contextToken) headers["sw-context-token"] = init.contextToken;

  const res = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? "POST",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopware ${res.status} ${res.statusText}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---- Catalog (build-time) ----

const PRODUCT_ASSOCIATIONS = {
  cover: { associations: { media: {} } },
  media: { associations: { media: {} } },
  manufacturer: {},
};

export async function fetchProducts(limit = 50): Promise<ShopwareProduct[]> {
  const result = await storeApi<SearchResult<RawProduct>>("/store-api/product", {
    body: { limit, associations: PRODUCT_ASSOCIATIONS },
  });
  return result.elements.map(mapProduct);
}

export async function fetchProductByNumber(
  productNumber: string,
): Promise<ShopwareProduct | null> {
  const result = await storeApi<SearchResult<RawProduct>>("/store-api/product", {
    body: {
      limit: 1,
      filter: [{ type: "equals", field: "productNumber", value: productNumber }],
      associations: PRODUCT_ASSOCIATIONS,
    },
  });
  const raw = result.elements[0];
  return raw ? mapProduct(raw) : null;
}

// ---- Cart (browser) ----

export interface CartLineItem {
  id: string;
  referencedId: string;
  label: string;
  quantity: number;
  price: { unitPrice: number; totalPrice: number } | null;
  cover: ShopwareImage | null;
}

export interface Cart {
  token: string;
  lineItems: CartLineItem[];
  price: { totalPrice: number; netPrice: number; positionPrice: number } | null;
}

interface RawCartLineItem {
  id: string;
  referencedId: string;
  label: string;
  quantity: number;
  price?: { unitPrice: number; totalPrice: number } | null;
  cover?: RawMedia | null;
}

interface RawCart {
  token: string;
  lineItems: RawCartLineItem[];
  price?: { totalPrice: number; netPrice: number; positionPrice: number } | null;
}

function mapCart(raw: RawCart): Cart {
  return {
    token: raw.token,
    price: raw.price ?? null,
    lineItems: raw.lineItems.map((li) => ({
      id: li.id,
      referencedId: li.referencedId,
      label: li.label,
      quantity: li.quantity,
      price: li.price ?? null,
      cover: mapImage(li.cover ?? undefined),
    })),
  };
}

export async function getCart(contextToken?: string): Promise<Cart> {
  const raw = await storeApi<RawCart>("/store-api/checkout/cart", {
    method: "GET",
    contextToken,
  });
  return mapCart(raw);
}

export async function addLineItem(
  productId: string,
  quantity: number,
  contextToken?: string,
): Promise<Cart> {
  const raw = await storeApi<RawCart>("/store-api/checkout/cart/line-item", {
    method: "POST",
    contextToken,
    body: {
      items: [
        {
          type: "product",
          referencedId: productId,
          quantity,
        },
      ],
    },
  });
  return mapCart(raw);
}

export async function removeLineItem(
  lineItemId: string,
  contextToken: string,
): Promise<Cart> {
  const raw = await storeApi<RawCart>(
    `/store-api/checkout/cart/line-item?ids[]=${encodeURIComponent(lineItemId)}`,
    { method: "DELETE", contextToken },
  );
  return mapCart(raw);
}

export function shopwareCheckoutUrl(): string {
  const { baseUrl } = requireConfig();
  return `${baseUrl}/checkout/cart`;
}
