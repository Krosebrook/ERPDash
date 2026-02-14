# PWA Technical Specification

## Offline Strategy
The dashboard uses a **Service Worker (sw.js)** to enable reliable performance and offline access.

### Caching Tiers
1.  **Static UI Core (Precache)**: `index.html`, Tailwind, and Fonts are cached on first load.
2.  **External Libraries (SWR)**: `esm.sh` dependencies are handled with a **Stale-While-Revalidate** strategy.
3.  **Real-time Data (Network-Only)**: Gemini API calls (`googleapis.com`) and telemetry feeds are **never cached** to ensure data integrity and security.

## Installability
- **Manifest**: Located at `/public/manifest.json`.
- **Requirements**: Served over HTTPS with a valid service worker.
- **Form Factor**: Optimized for wide displays (Wide screenshot provided for store entries).

## Update Strategy
- The Service Worker triggers `skipWaiting()` on install.
- New versions are activated immediately upon page refresh.
- Cache versioning is handled via the `CACHE_NAME` constant in `sw.js`.