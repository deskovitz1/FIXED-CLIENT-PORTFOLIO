#!/bin/bash
# Quick script to check if environment variables are set in Vercel
# This helps verify that blob token and postgres are configured

echo "🔍 Checking Vercel Environment Variables..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "   Install it with: npm i -g vercel"
    exit 1
fi

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "⚠️  Project not linked to Vercel"
    echo "   Run: vercel link"
    exit 1
fi

echo "📋 Pulling environment variables from Vercel..."
vercel env pull .env.vercel.check 2>/dev/null

if [ -f ".env.vercel.check" ]; then
    echo ""
    echo "✅ Environment Variables Status:"
    echo ""
    
    # Check for blob token
    if grep -q "BLOB_READ_WRITE_TOKEN" .env.vercel.check; then
        echo "   ✅ BLOB_READ_WRITE_TOKEN: Set"
    else
        echo "   ❌ BLOB_READ_WRITE_TOKEN: Missing"
    fi
    
    # Check for postgres URLs
    if grep -q "POSTGRES_URL=" .env.vercel.check; then
        echo "   ✅ POSTGRES_URL: Set"
    else
        echo "   ❌ POSTGRES_URL: Missing"
    fi
    
    if grep -q "POSTGRES_PRISMA_URL=" .env.vercel.check; then
        echo "   ✅ POSTGRES_PRISMA_URL: Set"
    else
        echo "   ⚠️  POSTGRES_PRISMA_URL: Optional (recommended)"
    fi
    
    if grep -q "POSTGRES_URL_NON_POOLING=" .env.vercel.check; then
        echo "   ✅ POSTGRES_URL_NON_POOLING: Set"
    else
        echo "   ⚠️  POSTGRES_URL_NON_POOLING: Optional (recommended)"
    fi
    
    # Clean up
    rm .env.vercel.check
    
    echo ""
    echo "💡 To add missing variables:"
    echo "   1. Go to Vercel Dashboard → Settings → Environment Variables"
    echo "   2. Add the missing variables"
    echo "   3. See ENV_SETUP.md for detailed instructions"
else
    echo "❌ Failed to pull environment variables"
    echo "   Make sure you're logged in: vercel login"
fi



