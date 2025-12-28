# Vercel Deployment Guide

## Prerequisites

- Node.js 18+ (Vercel uses v18+)
- PostgreSQL database set up on Vercel

## Setup Steps

### 1. Environment Variables on Vercel

In your Vercel project settings, add the following environment variables:

```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
NODE_ENV=production
FRONT_END_URL=https://your-frontend-domain.com
BASE_URL=https://your-backend-domain.vercel.app
JWT_SECRET=your-secure-jwt-secret-key
PORT=5000
```

### 2. Get PostgreSQL Connection String from Vercel

1. Go to your Vercel project
2. Navigate to Storage → Database
3. Copy the connection string (looks like `postgresql://...`)
4. Add it as `DATABASE_URL` in environment variables

### 3. Deployment Process

The deployment will automatically:

1. Install dependencies (including `pg` for PostgreSQL)
2. Build the TypeScript code (`npm run build`)
3. Generate Prisma Client (`postinstall` script)
4. Run migrations (`npm run prisma:deploy`)
5. Start the server

### 4. Local Testing Before Deployment

Before deploying to Vercel, test locally with PostgreSQL:

```bash
# Update your .env file with PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/dona_gallery"

# Install dependencies
npm install

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### 5. Troubleshooting

**Migration Failed**

- Ensure DATABASE_URL is correct
- Check that the database exists and is empty
- Verify PostgreSQL is running (for local testing)

**Build Failed**

- Check logs in Vercel dashboard
- Ensure all environment variables are set
- Verify package.json has correct scripts

**Connection Issues**

- Use `pg` package for PostgreSQL (already updated in package.json)
- Ensure firewall allows Vercel IPs to connect to your database

### 6. Model Generation

Models are automatically generated during:

- `postinstall` (after npm install)
- Before build process

To manually regenerate:

```bash
npm run prisma:generate
```

### 7. Database Inspection

To view/manage your database on Vercel:

```bash
npm run prisma:studio
```

## File Changes Made

✅ `prisma/schema.prisma` - Switched to PostgreSQL provider
✅ `prisma/migrations/migration_lock.toml` - Updated to PostgreSQL
✅ `prisma/migrations/20251211154821_init/migration.sql` - PostgreSQL syntax
✅ `package.json` - Replaced mysql2 with pg, added prisma:deploy script
✅ `vercel.json` - Added buildCommand with migration step
✅ `.env.example` - PostgreSQL connection string template
✅ `api/index.ts` - Serverless handler that forwards to Express `app`
✅ `api/health.ts` - Minimal health endpoint used to validate function invocation

## Vercel-specific notes (important)

- For serverless environments, native Prisma query engine binaries can cause crashes. Recommended options:

  - Set `PRISMA_CLIENT_ENGINE_TYPE=wasm` in your Vercel environment variables to use the WASM engine (no native binaries required).
  - Alternatively, use Prisma Data Proxy for production traffic to avoid engine issues entirely.

- Add `PRISMA_CLIENT_ENGINE_TYPE=wasm` in Vercel dashboard (Environment Variables) and redeploy.
- Ensure `DATABASE_URL` is set in the **Build** and **Production** environment scopes (Vercel allows separate values for Build vs Runtime). If `DATABASE_URL` is only set for Production, `prisma migrate deploy` will fail during the build step.

- Verify the serverless function works by hitting the health endpoint:

  - `GET https://<your-vercel-domain>/api/health` should return `{ status: "ok" }`

- If migrations/seed do not run during the build, check the build logs for the markers we added (e.g., `===> running prisma migrate deploy`). These will show any failures and the command output so you can debug connection or permission issues.
