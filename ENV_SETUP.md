# Environment Variables Setup Guide

This guide ensures your Blob token and Postgres credentials are properly configured across all environments.

## Required Environment Variables

### 1. Vercel Blob Storage

**Variable**: `BLOB_READ_WRITE_TOKEN`

**How to get it:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** → **Blob**
4. Click on your blob store (or create one)
5. Go to **Settings** → **Tokens**
6. Click **Create Token**
7. Name it (e.g., "video-upload-token")
8. Copy the token (starts with `vercel_blob_rw_`)

### 2. Vercel Postgres

**Variables**:
- `POSTGRES_URL` (required)
- `POSTGRES_PRISMA_URL` (optional, recommended)
- `POSTGRES_URL_NON_POOLING` (optional, recommended)

**How to get them:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** → **Postgres**
4. Click on your database (or create one)
5. Go to **Settings** → **Connection String**
6. Copy the connection strings

**Note**: Vercel automatically adds these to your project's environment variables, but you may need them for local development.

## Setting Up Environment Variables

### For Local Development

1. Create a `.env.local` file in the project root:

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here

# Vercel Postgres
POSTGRES_URL=postgres://user:password@host:port/database
POSTGRES_PRISMA_URL=postgres://user:password@host:port/database?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://user:password@host:port/database
```

2. **Never commit `.env.local`** - it's already in `.gitignore`

### For Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Your blob token
   - **Environment**: Production, Preview, Development (select all)
5. Repeat for Postgres URLs

**Important**: 
- Set variables for **all environments** (Production, Preview, Development)
- Vercel automatically adds Postgres URLs when you create the database
- You still need to manually add `BLOB_READ_WRITE_TOKEN`

## Verifying Configuration

### Option 1: Use the Verification Script

```bash
pnpm tsx scripts/verify-env.ts
```

This script will:
- ✅ Check if all required variables are set
- ✅ Test database connection
- ✅ Test blob storage connection
- ✅ Verify table exists

### Option 2: Manual Verification

1. **Check Vercel Dashboard**:
   - Go to **Settings** → **Environment Variables**
   - Verify all variables are present

2. **Test locally**:
   ```bash
   # Check if variables are loaded
   node -e "console.log(process.env.BLOB_READ_WRITE_TOKEN ? '✅ Blob token set' : '❌ Blob token missing')"
   node -e "console.log(process.env.POSTGRES_URL ? '✅ Postgres URL set' : '❌ Postgres URL missing')"
   ```

3. **Test in Vercel**:
   - Deploy your project
   - Check deployment logs for any environment variable errors
   - Test video upload functionality

## Common Issues

### ❌ "BLOB_READ_WRITE_TOKEN is not defined"

**Solution**:
1. Verify token is set in Vercel Dashboard → Environment Variables
2. Make sure it's set for the correct environment (Production/Preview/Development)
3. Redeploy after adding the variable

### ❌ "Postgres connection failed"

**Solution**:
1. Verify Postgres database is created in Vercel
2. Check that `POSTGRES_URL` is set correctly
3. Ensure database is in the same region as your deployment
4. Run the migration: `vercel db execute lib/db/schema.sql`

### ❌ "Blob storage connection failed"

**Solution**:
1. Verify blob store is created in Vercel
2. Check that `BLOB_READ_WRITE_TOKEN` is correct
3. Ensure token has read/write permissions
4. Verify token hasn't expired (create a new one if needed)

## Security Best Practices

1. ✅ **Never commit** `.env.local` or any `.env*` files
2. ✅ **Use different tokens** for different environments if possible
3. ✅ **Rotate tokens** periodically
4. ✅ **Use Vercel's built-in environment variables** for production
5. ✅ **Limit token permissions** to only what's needed

## Quick Reference

| Variable | Required | Where to Get It |
|----------|----------|----------------|
| `BLOB_READ_WRITE_TOKEN` | ✅ Yes | Vercel Dashboard → Storage → Blob → Settings → Tokens |
| `POSTGRES_URL` | ✅ Yes | Vercel Dashboard → Storage → Postgres → Connection String |
| `POSTGRES_PRISMA_URL` | ⚠️ Optional | Vercel Dashboard → Storage → Postgres → Connection String |
| `POSTGRES_URL_NON_POOLING` | ⚠️ Optional | Vercel Dashboard → Storage → Postgres → Connection String |

## Next Steps

After setting up environment variables:

1. ✅ Run verification script: `pnpm tsx scripts/verify-env.ts`
2. ✅ Test video upload in admin panel
3. ✅ Verify videos appear on homepage
4. ✅ Check Vercel deployment logs for any errors



