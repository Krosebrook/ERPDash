# Deployment Targets

## 1. Cloudflare Pages (Recommended)
- **Build Command**: `None` (Pure ESM)
- **Output Directory**: `.`
- **Environment Variables**: Add `API_KEY`.

## 2. Vercel
- **Framework Preset**: `Other`
- **Root Directory**: `./`
- **Optimization**: Vercel will automatically serve `manifest.json` and `sw.js` with correct MIME types.

## 3. Firebase Hosting
- Initialize with `firebase init`.
- Ensure `public` points to root.
- Add rewrite rules for SPA support if deep linking is introduced.