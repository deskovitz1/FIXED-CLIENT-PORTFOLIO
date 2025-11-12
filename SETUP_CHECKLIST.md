# Setup Checklist

Use this checklist to set up your video management system:

## ✅ Step 1: Vercel Blob Storage
- [ ] Go to Vercel Dashboard → Your Project → Storage → Blob
- [ ] Create Blob store
- [ ] Create token in Settings → Tokens
- [ ] Copy token to clipboard

## ✅ Step 2: Vercel Postgres Database
- [ ] Go to Vercel Dashboard → Your Project → Storage → Postgres
- [ ] Create Postgres database
- [ ] Note: Connection strings are auto-added

## ✅ Step 3: Environment Variables
- [ ] Create `.env.local` file in project root
- [ ] Add `BLOB_READ_WRITE_TOKEN=your_token_here`
- [ ] Verify Postgres URLs are available (check Vercel Dashboard)

## ✅ Step 4: Database Migration
- [ ] Go to Postgres database → SQL Editor
- [ ] Copy SQL from `lib/db/schema.sql`
- [ ] Paste and run in SQL Editor
- [ ] Verify table was created

## ✅ Step 5: Start Server
- [ ] Run `pnpm dev`
- [ ] Server starts at http://localhost:3000
- [ ] No errors in console

## ✅ Step 6: Test Upload
- [ ] Go to http://localhost:3000/admin
- [ ] Upload a test video
- [ ] Verify success message
- [ ] Video appears in list

## ✅ Step 7: Test Display
- [ ] Go to http://localhost:3000
- [ ] Click "RECENT WORK" button
- [ ] Videos appear in grid
- [ ] Click video to play
- [ ] Video plays in player

## ✅ Step 8: Test Delete
- [ ] Go to http://localhost:3000/admin
- [ ] Click delete on a video
- [ ] Verify video is removed
- [ ] Verify video disappears from grid

## 🎉 You're Done!

If all steps are checked, your video management system is ready to use!

**Admin Panel**: http://localhost:3000/admin
**Homepage**: http://localhost:3000

