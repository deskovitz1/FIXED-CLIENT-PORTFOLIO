# 🔐 Vercel Environment Variables Setup

## ⚠️ **CRITICAL: "Server misconfigured" Error**

If you see **"Server misconfigured"** when trying to use admin mode (`Cmd+Shift+A`), it means `ADMIN_PASSWORD` is **NOT SET** in Vercel environment variables.

**Fix**: Add `ADMIN_PASSWORD` to Vercel (see below) and **redeploy**.

---

## Required Environment Variables

Copy these into **Vercel Dashboard → Your Project → Settings → Environment Variables**:

### 1. Admin Password ⚠️ REQUIRED FOR ADMIN MODE
```
ADMIN_PASSWORD=welcometothecircus
```
**Without this, admin mode will show "Server misconfigured" error**

### 2. Blob Storage Token
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_F8ITx2L7pd6t7GMj_7s3uv6C2e3DZzlU9G4eVWd4DejXA9Z
```

### 3. Database Connection
```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19XMWhwOVlmdl9Ya3FBTnhsc1Frb08iLCJhcGlfa2V5IjoiMDFLQUNSRURIRThROTE5Q0VHMjZXWk1YTjkiLCJ0ZW5hbnRfaWQiOiIwNGVlNTEyY2FjMjMwY2ExN2JhODZkZDE5MGY2ZGUxMzgyZGVmZWExMzQ3NzczNTkzYTcwZDhjZWNjZjFhZmQ2IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTA1ZDdkYmUtYTgzYS00MGNiLTg3OTEtOWIyODdhYzNjOGQzIn0.aGTdCmQQ4hBFlfSkKrWlQXOZbI5b2CNXJi2LXo-TYUU
```

```
POSTGRES_URL=$DATABASE_URL
```

## Setup Instructions

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add each variable above:
   - **Name**: Variable name (e.g., `ADMIN_PASSWORD`)
   - **Value**: Variable value (e.g., `welcometothecircus`)
   - **Environment**: Select **Production**, **Preview**, and **Development**
4. Click **Save**
5. **Redeploy** your project after adding variables

## Important Notes

- ⚠️ **ADMIN_PASSWORD** is critical - without it, admin mode won't work
- 🔄 After adding environment variables, trigger a new deployment
- ✅ Build will succeed - Prisma client generates automatically
- 🧪 Test admin mode after deployment: Press `Cmd+Shift+A` (Mac) or `Ctrl+Shift+A` (Windows)

## Quick Deploy Checklist

- [ ] All environment variables added to Vercel
- [ ] Variables set for Production, Preview, and Development
- [ ] Redeploy triggered after adding variables
- [ ] Build completes successfully
- [ ] Admin mode tested (`Cmd+Shift+A` → password)
- [ ] Upload functionality tested
- [ ] Edit/Delete functionality tested

