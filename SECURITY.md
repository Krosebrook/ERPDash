# Security & Compliance Guide

## Auth Boundaries
- **Gemini API**: Authenticated via `process.env.API_KEY`. This key must be restricted in the Google Cloud Console to specific IP ranges or referrers.
- **PWA Caching**: The Service Worker explicitly ignores any request involving credentials or POST data to prevent local storage of PII.

## Content Security Policy (CSP)
Current dependencies require permissions for:
- `script-src`: `https://cdn.tailwindcss.com`, `https://esm.sh`.
- `connect-src`: `https://generativelanguage.googleapis.com`.
- `style-src`: `https://fonts.googleapis.com`.

## Data Governance
Telemetry data (traces) are transient in this dashboard. No immutable user data is stored in IndexedDB or LocalStorage by default, aligning with "Privacy by Design" principles.