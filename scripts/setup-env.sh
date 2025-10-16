#!/bin/bash

# Setup script for Horizon AI MVP local environment
# This script helps generate secure secrets for local development

echo "🚀 Horizon AI MVP - Environment Setup"
echo "======================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Copy from example
cp .env.example .env

echo "✅ Created .env file from .env.example"
echo ""

# Generate secrets
echo "🔐 Generating secure secrets..."
echo ""

JWT_ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

echo "Generated secrets:"
echo "  - JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:0:16}..."
echo "  - JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:16}..."
echo "  - ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:16}..."
echo ""

# Update .env file with generated secrets
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET|" .env
    sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
    sed -i '' "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
else
    # Linux
    sed -i "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET|" .env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
fi

echo "✅ Updated .env file with generated secrets"
echo ""

echo "📝 Next steps:"
echo "  1. Add your Supabase DATABASE_URL to .env"
echo "  2. Add your Supabase DIRECT_DATABASE_URL to .env (for migrations)"
echo "  3. (Optional) Add Redis credentials if using cache"
echo "  4. Run 'pnpm db:push' to sync database schema"
echo ""
echo "📖 For detailed setup instructions, see: docs/infrastructure-setup.md"
echo ""
echo "✨ Setup complete!"
