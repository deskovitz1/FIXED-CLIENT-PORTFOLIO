# GitHub Setup Instructions

## ✅ Git Repository Status

Your project is already a git repository and has been committed locally.

**Current commit:** `a12fc8d` - "chore: initial Circus17 site backup - prepare for Vimeo migration"

## 📋 Steps to Push to GitHub

### 1. Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `circus17-site` (or your preferred name)
4. Description: "Circus17 video portfolio site"
5. Choose **Private** or **Public** (your preference)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

### 2. Add Remote and Push

After creating the repository, GitHub will show you commands. Use these **exact commands** (replace `USERNAME` with your GitHub username):

```bash
cd /Users/dylaneskovitz/Developer/v0-v37-rebuild-main

# Add the remote (replace USERNAME with your actual GitHub username)
git remote add origin git@github.com:USERNAME/circus17-site.git

# Verify the remote was added
git remote -v

# Push to GitHub
git push -u origin main
```

**If you get an error about the remote already existing:**
```bash
# Check current remotes
git remote -v

# If origin exists but points to wrong URL, update it:
git remote set-url origin git@github.com:USERNAME/circus17-site.git

# Then push
git push -u origin main
```

### 3. Verify Push

After pushing, refresh your GitHub repository page. You should see all your files.

## 🔒 Security Notes

✅ **Verified:** No `.env` or `.env.local` files are committed to git  
✅ **Verified:** `.gitignore` properly excludes all environment files  
✅ **Safe:** Your secrets remain only in local `.env.local` file

## 📝 Future Updates

After making changes:

```bash
git add .
git commit -m "Description of your changes"
git push origin main
```

## 🆘 Troubleshooting

**If push fails with authentication error:**
- Make sure you have SSH keys set up: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- Or use HTTPS instead: `git remote set-url origin https://github.com/USERNAME/circus17-site.git`

**If branch name is different:**
- Check your branch: `git branch`
- If it's `master` instead of `main`: `git push -u origin master`

