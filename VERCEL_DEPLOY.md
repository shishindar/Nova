# Vercel Deployment Guide

This project is configured to deploy from the repository root.

## Before You Start

Make sure these files are present in the repo root:

- `package.json`
- `vercel.json`
- `api/index.js`

They are already added in this repo.

## What To Choose In The Vercel Dashboard

### 1. Import Project

In Vercel:

1. Click `Add New...`
2. Click `Project`
3. Import this Git repository

### 2. Configure Project

Use these settings:

- `Framework Preset`: `Other`
- `Root Directory`: `/`
- `Build Command`: leave empty
- `Output Directory`: leave empty
- `Install Command`: leave empty

Why:

- This is a Node/Express serverless deployment, not a Next.js/Vite static build.
- Vercel will use `vercel.json` and the root `package.json`.

### 3. Node Version

In `Project Settings -> General`, use:

- `Node.js Version`: `20.x`

This matches the runtime declared in `vercel.json`.

## Environment Variables

In `Project Settings -> Environment Variables`, add:

### Minimum recommended demo setup

- `SESSION_SECRET` = a long random secret string
- `USE_DUMMY_AUTH` = `true`

This is the safest setup for a first successful deploy.

### If you want real database mode

Add these only if you have a live MySQL database reachable from Vercel:

- `USE_DUMMY_AUTH` = `false`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### If you want email sending enabled

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

## Recommended First Deploy

For the first deployment, use:

- `SESSION_SECRET` = your generated secret
- `USE_DUMMY_AUTH` = `true`

Do not enable DB mode until you have confirmed the app is live and working.

## What Happens On Vercel

- All routes are served through `api/index.js`
- Static assets from `smartbuspass/public/` are bundled with the function
- Authentication uses signed HTTP-only cookies
- Cron jobs and the bus simulator do not run on Vercel

That last point is expected. Vercel serverless functions are request-driven, not long-running app servers.

## Deploy Steps

1. Push the latest code to your Git provider
2. Import the repo into Vercel
3. Choose `Other` as the framework preset
4. Keep root directory as `/`
5. Add environment variables
6. Click `Deploy`

## What To Test After Deploy

Open the deployed URL and verify:

1. Landing page loads
2. Register page works
3. Login works with:
   `admin@smartbus.com / password`
4. `/api/auth/me` stays authenticated after login
5. Admin dashboard loads
6. Routes, applications, and reports pages open without errors

## Default Demo Credentials

- Admin: `admin@smartbus.com` / `password`
- Driver: `driver@smartbus.com` / `password`

These work when `USE_DUMMY_AUTH=true`.

## If Deployment Fails

Check these first in Vercel:

- `Framework Preset` is `Other`
- `Root Directory` is `/`
- `SESSION_SECRET` is set
- `USE_DUMMY_AUTH` is set
- The deployment is using the repo root, not `smartbuspass/`

## If Login Fails After Deploy

Check:

- `SESSION_SECRET` exists
- You redeployed after adding env vars
- You are using the latest deployment URL, not an old preview

## If DB Mode Fails

Likely causes:

- MySQL is not publicly reachable from Vercel
- DB firewall does not allow Vercel IPs
- DB credentials are wrong
- `USE_DUMMY_AUTH` is set to `false` without a working DB

## Suggested Secret Value

Generate one locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
