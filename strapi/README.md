# Strapi setup

The frontend in `../` works without Strapi — `src/lib/strapi.ts` falls back to
mock content if `STRAPI_URL` is empty. Bring this up when you're ready to edit
content in a CMS.

## 1. Start Strapi locally

```bash
cd strapi
docker compose up -d
```

First boot takes a few minutes (Strapi initializes the project on the volume).
Then open <http://localhost:1337/admin> and create the first admin user.

## 2. Create the content types

In the admin UI, build these two collection types. The frontend `getSiteContent`
query expects this shape exactly.

### Single type: `homepage-hero`

| Field             | Type         |
| ----------------- | ------------ |
| `eyebrow`         | Text (short) |
| `title`           | Text (short) |
| `subtitle`        | Text (long)  |
| `ctaLabel`        | Text (short) |
| `ctaHref`         | Text (short) |
| `backgroundImage` | Media (single)|

### Collection type: `nav-link`

| Field   | Type         |
| ------- | ------------ |
| `label` | Text (short) |
| `href`  | Text (short) |
| `order` | Number       |

After creating each type, go to **Settings → Roles → Public** and grant
`find` (and `findOne` for the single type) on both. Otherwise the frontend
gets 403s.

## 3. Wire env vars

In the root `.env`, set:

```
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=   # optional, only needed if you remove public access
```

Then `npm run build` will pull live content from Strapi.

## 4. Configure the rebuild webhook

In Strapi admin: **Settings → Webhooks → Add new webhook**.

- URL: `http://localhost:8787/rebuild` (or wherever your rebuild server runs)
- Headers: `X-Webhook-Secret: change-me` (match `REBUILD_WEBHOOK_SECRET` in `.env`)
- Events: tick all entry events (`entry.create`, `entry.update`, `entry.publish`,
  etc.) plus media events if you want image edits to trigger rebuilds.

In the project root, run `npm run rebuild-server` to start the receiver.

### Production alternative

Replace the local receiver with a [Vercel Deploy Hook](https://vercel.com/docs/deployments/deploy-hooks)
URL — paste it directly into Strapi's webhook URL field, no shared secret
needed (Vercel deploy hooks are unguessable URLs).
