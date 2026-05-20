# Heirloom — headless furniture store

A furniture storefront built with **Next.js**, **Tailwind**, and **React**.

- **Catalog** (products, prices, images, stock) comes from **Shopware** via its Store API.
- **Editorial content** (homepage hero, navigation menu) comes from **Strapi**, a headless CMS.
- **Cart & checkout** run in the browser against Shopware's Store API.

---

## Run the whole project with Docker

This is the easiest way to run everything. The only thing you need installed is
**[Docker](https://www.docker.com/products/docker-desktop/)** — no Node.js, no
database, no manual setup.

```bash
git clone <repo-url>
cd test_proj
docker compose up --build
```

The first run downloads and builds the images, so it takes a few minutes. When
it finishes you have:

| What          | Open in your browser          |
| ------------- | ----------------------------- |
| The website   | http://localhost:3000         |
| Strapi admin  | http://localhost:1337/admin   |

One `docker compose up` starts three containers: a **Postgres** database, the
**Strapi** CMS, and the **Next.js** website. They are pre-wired to talk to each
other — there is nothing to configure.

> On Linux you may need to prefix commands with `sudo`, or add your user to the
> `docker` group: `sudo usermod -aG docker $USER` (then log out and back in).

### First-time Strapi setup

The website runs immediately, but it shows built-in **placeholder content**
until real content exists in Strapi. A freshly started CMS has an empty
database, so do this once:

1. Open http://localhost:1337/admin and **create your admin account**.
2. Go to **Content Manager** and fill in the content:
   - **Homepage Hero** — the hero text and an optional background image.
   - **Nav Link** — one entry per navigation menu item.

   Press **Publish** on each entry (publishing is separate from saving).
3. Go to **Settings → Users & Permissions → Roles → Public** and tick:
   - `find` and `findOne` on **Homepage-hero**
   - `find` on **Nav-link**

   Then **Save**. (Without this the website cannot read the content.)
4. Refresh http://localhost:3000 — your content now appears.

If a content type is missing in step 2, create it in the **Content-Type
Builder** — the required fields are listed in
[strapi/README.md](strapi/README.md).

### Everyday commands

```bash
docker compose up -d         # start in the background
docker compose down          # stop everything (database is kept)
docker compose down -v       # stop and erase the database
docker compose logs -f web   # watch the website logs
docker compose logs -f strapi
```

---

## Run without Docker (for development)

Requires **Node.js 20–22**.

```bash
npm install
cp .env.example .env         # then fill in the values
npm run dev                  # website at http://localhost:3000
```

With no `STRAPI_URL` set, the site uses placeholder content. To use real
content, run Strapi separately and point `STRAPI_URL` at it.

---

## Configuration

With Docker, all settings are baked into `docker-compose.yml` — **you don't
need to touch anything**. For non-Docker runs, copy `.env.example` to `.env`:

| Variable                          | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SHOPWARE_URL`        | Shopware store URL (used by the page and the browser cart) |
| `NEXT_PUBLIC_SHOPWARE_ACCESS_KEY` | Shopware sales-channel access key (a public credential)  |
| `STRAPI_URL`                      | Strapi base URL, e.g. `http://localhost:1337`            |
| `STRAPI_TOKEN`                    | Optional — only needed if you remove Strapi public access |

---

## Project layout

```
docker-compose.yml       runs everything: database + Strapi + website
Dockerfile               the Next.js website container
src/
  pages/
    index.tsx            homepage (hero + featured products)
    products/index.tsx   full catalog listing
    products/[slug].tsx  product detail page
    cart.tsx             the cart page
  components/            UI components (Layout, Header, ProductCard, …)
  lib/
    shopware.ts          Shopware Store API client (catalog + cart)
    strapi.ts            Strapi client, with placeholder-content fallback
    cart.tsx             cart state, saved in the browser's localStorage
    format.ts            price formatting
strapi/
  app/                   the Strapi CMS project
    Dockerfile           the Strapi container
  README.md              Strapi content-type definitions
scripts/
  rebuild-server.js      optional webhook receiver (advanced — see below)
```

---

## How the pieces fit together

```
   ┌──────────┐   editorial content   ┌─────────────┐
   │  Strapi  │ ─────────────────────►│   Next.js   │
   └──────────┘                       │   website   │
   ┌──────────┐   product catalog     │             │
   │ Shopware │ ─────────────────────►│             │
   └────┬─────┘                       └──────┬──────┘
        │         cart & checkout (browser)  │
        └────────────────────────────────────┘
```

---

## Notes & limitations

- **Checkout** redirects to Shopware's own hosted checkout page. A fully
  headless checkout is intentionally out of scope.
- **No customer accounts** — the cart uses an anonymous Shopware context token
  stored in the browser.
- Product page URLs are derived from Shopware's `productNumber`
  (e.g. `SW10000` → `/products/sw10000/`).
- `scripts/rebuild-server.js` is an optional webhook receiver for setups that
  rebuild the site on every Strapi change. It is not needed for the Docker
  workflow above, where content changes show up on a page refresh.
```
