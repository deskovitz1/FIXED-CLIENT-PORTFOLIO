# Blob Token & Postgres Configuration Summary

This document ensures your Blob token and Postgres credentials are properly synchronized across all environments.

## ✅ Current Configuration Status

### Code Implementation
- ✅ **Blob Storage**: Uses `@vercel/blob` package with automatic token detection
- ✅ **Postgres**: Uses `@vercel/postgres` package with automatic connection string detection
- ✅ **Environment Variables**: All credentials are loaded from environment variables
- ✅ **No Hardcoded Values**: All sensitive data comes from environment variables

### How It Works

1. **Blob Storage** (`app/api/videos/route.ts`):
   - Uses `put()` from `@vercel/blob`
   - Automatically reads `BLOB_READ_WRITE_TOKEN` from environment
   - No manual configuration needed in code

2. **Postgres Database** (`lib/db.ts`):
   - Uses `sql` from `@vercel/postgres`
   - Automatically reads `POSTGRES_URL` from environment
   - No manual connection string needed in code

## 🔧 Setup Checklist

### Step 1: Vercel Blob Storage
- [ ] Create blob store in Vercel Dashboard → Storage → Blob
- [ ] Create token in Blob store → Settings → Tokens
- [ ] Copy token (starts with `vercel_blob_rw_`)
- [ ] Add to Vercel: Settings → Environment Variables → `BLOB_READ_WRITE_TOKEN`
- [ ] Add to local `.env.local` for development

### Step 2: Vercel Postgres
- [ ] Create database in Vercel Dashboard → Storage → Postgres
- [ ] Connection strings are **automatically added** to environment variables
- [ ] Verify in Vercel: Settings → Environment Variables
- [ ] For local dev: Copy URLs to `.env.local`

### Step 3: Verify Configuration

**Option A: Use verification script**
```bash
pnpm verify-env
```

**Option B: Check Vercel directly**
```bash
pnpm check-vercel-env
```

**Option C: Manual check**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all variables are present
3. Check they're set for all environments (Production, Preview, Development)

## 📋 Required Environment Variables

| Variable | Source | Required For |
|----------|--------|--------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Blob → Tokens | Video uploads |
| `POSTGRES_URL` | Auto-added by Vercel | Database queries |
| `POSTGRES_PRISMA_URL` | Auto-added by Vercel | Prisma (if used) |
| `POSTGRES_URL_NON_POOLING` | Auto-added by Vercel | Migrations |

## 🔄 Synchronization

### Local Development
1. Create `.env.local` with all variables
2. Variables are loaded automatically by Next.js
3. Never commit `.env.local` (already in `.gitignore`)

### Vercel Deployment
1. Variables set in Vercel Dashboard are automatically available
2. No code changes needed
3. Variables are injected at build/runtime

### Keeping in Sync
- **Local → Vercel**: Manually add variables in Vercel Dashboard
- **Vercel → Local**: Use `vercel env pull .env.local` (if using Vercel CLI)
- **Verification**: Run `pnpm verify-env` to check both

## 🚨 Common Issues & Solutions

### Issue: "BLOB_READ_WRITE_TOKEN is not defined"
**Solution:**
1. Check Vercel Dashboard → Environment Variables
2. Ensure variable is set for correct environment
3. Redeploy after adding variable

### Issue: "Postgres connection failed"
**Solution:**
1. Verify Postgres database exists in Vercel
2. Check `POSTGRES_URL` is set correctly
3. Ensure database region matches deployment region

### Issue: "Blob upload fails"
**Solution:**
1. Verify blob store exists
2. Check token hasn't expired
3. Ensure token has read/write permissions

## 📚 Related Documentation

- **Detailed Setup**: See `ENV_SETUP.md`
- **Workflow Guide**: See `GITHUB_VERCEL_WORKFLOW.md`
- **Quick Start**: See `QUICKSTART.md`

## ✅ Verification Commands

```bash
# Verify all environment variables
pnpm verify-env

# Check Vercel environment variables
pnpm check-vercel-env

# Pull Vercel env vars locally (if using Vercel CLI)
vercel env pull .env.local
```

## 🎯 Next Steps

1. ✅ Run `pnpm verify-env` to check current status
2. ✅ Add any missing variables in Vercel Dashboard
3. ✅ Test video upload functionality
4. ✅ Verify videos appear in database
5. ✅ Check deployment logs for any errors

---

**Remember**: All credentials are managed through environment variables. Never hardcode tokens or connection strings in your code!



