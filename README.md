# EthicsLabs Platform (Vite + Supabase)

This repository is deployed as a single Vite SPA on Vercel and reads/writes data directly from Supabase.

## Local development

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Start the app:
   - `npm run dev`

## Build and deploy

- Production build: `npm run build`
- Preview build locally: `npm run preview`
- Vercel output directory: `dist`

## Required production setup

1. In Supabase Auth settings, add your Vercel URL to:
   - Site URL
   - Redirect URLs
2. In Vercel project settings, add env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. If users on other devices cannot access the site, disable Vercel deployment protection or share an access link.
