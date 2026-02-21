# EPB Dashboard Pro – Deployment Guide

## Repo Inventory

| Item | Value |
|---|---|
| App type | Vite / React 19 SPA (TypeScript) |
| Package manager | npm |
| Build command | `npm run build` |
| Output directory | `dist/` |
| Dev server | `npm run dev` (port 3000) |
| Preview | `npm run preview` |
| Node requirement | ≥ 20 (see `.nvmrc`) |
| Runtime | Static files only – no SSR, no server process |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key. Baked into the JS bundle at build time. Restrict this key to your deployed origin in Google Cloud Console. |

Copy `.env.example` → `.env` for local development.

> ⚠️ **Security note:** Because this is a fully client-side app, the API key will be visible in the compiled JavaScript bundle. Mitigate this by restricting the key to your exact deployment origin via Google Cloud Console → "API restrictions" → HTTP referrers.

---

## A) Vercel (Recommended)

### Dashboard settings

| Setting | Value |
|---|---|
| Framework Preset | **Other** (or leave as auto-detected Vite) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |
| Node.js Version | **20.x** |

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

```
GEMINI_API_KEY = <your key>
```

### Routing & headers
`vercel.json` in the repo root handles:
- SPA fallback: all non-asset paths → `/index.html`
- Security headers (CSP report-only, X-Frame-Options, etc.)
- `Cache-Control: immutable` for hashed assets in `/assets/`
- `no-cache` for `sw.js`

### Local Vercel verification

```bash
npm install -g vercel
vercel dev            # starts local dev with Vercel edge config
# OR
npm run build && npx serve dist -l 4173
```

---

## B) Cloudflare Pages

### Dashboard settings (Pages → Create application → Connect to Git)

| Setting | Value |
|---|---|
| Framework Preset | **None** |
| Build Command | `npm run build` |
| Build Output Directory | `dist` |
| Node.js Version | **20** (set in Settings → Environment Variables as `NODE_VERSION=20`) |

### Environment Variables (Pages → Settings → Environment variables)

```
GEMINI_API_KEY = <your key>    (Production + Preview)
```

### Routing & headers
- `public/_redirects` → SPA fallback (all routes → `index.html 200`)
- `public/_headers` → security headers + cache rules

These files are copied into `dist/` by Vite (from the `public/` directory).

### Local Cloudflare verification

```bash
npm install -g wrangler
npm run build
npx wrangler pages dev dist --port 8788
```

---

## C) Self-hosted / Docker (alternative)

```bash
npm ci
npm run build
# Serve dist/ with any static file server (nginx, caddy, etc.)
# Set X-Frame-Options, CSP, and Cache-Control in your server config.
```

---

## Smoke Test (runs typecheck + build)

```bash
npm run smoke
# Equivalent to: npm run typecheck && npm run build
```

### Full local preview with health check

```bash
# Build and preview
npm run build
npm run preview          # starts on http://localhost:4173

# In a second terminal:
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/
# Expected: 200
```

---

## Deployment Checklist

### Pre-deploy
- [ ] `npm run smoke` passes (typecheck + build)
- [ ] `GEMINI_API_KEY` set in platform environment variables
- [ ] API key restricted to deployed origin in Google Cloud Console

### Post-deploy
- [ ] App loads at production URL (HTTP 200)
- [ ] No console errors in browser DevTools
- [ ] Gemini features work (AI Insights, Playground)
- [ ] PWA service worker registered (DevTools → Application → Service Workers)
- [ ] Response headers include `X-Content-Type-Options: nosniff`

---

## Rollback Plan

### Vercel
1. Go to **Deployments** in the Vercel dashboard.
2. Find the last known-good deployment.
3. Click **Promote to Production** (instant, no rebuild).

### Cloudflare Pages
1. Go to **Pages → your project → Deployments**.
2. Find the last known-good deployment.
3. Click **⋮ → Rollback to this deployment** (instant).

---

## Observability / Logs

| Platform | Where to view logs |
|---|---|
| Vercel | Dashboard → Deployments → select deployment → **Logs** tab (build) or **Functions** tab (runtime) |
| Cloudflare Pages | Dashboard → Pages → project → **Deployments** → select deployment → **Build log** |
| Browser | DevTools → Console. Structured errors logged via `console.error` in `ErrorBoundary`. |

---

## Performance Notes

- **Bundle size**: ~796 KB (231 KB gzipped). Large bundle is expected given React 19 + Recharts + Gemini SDK.
- **Quick wins**: Lazy-load route-level views (`React.lazy` + `Suspense`) or use Vite's `manualChunks` to split Recharts and `@google/genai` into separate chunks.
- **CDN assets**: Tailwind CSS and Google Fonts are still loaded from CDN. Consider self-hosting fonts and using the Tailwind Vite plugin for full offline support.
- **Vite hashing**: `dist/assets/index-[hash].js` gets `Cache-Control: immutable` via `vercel.json` / `_headers`.
