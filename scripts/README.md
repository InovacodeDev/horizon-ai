# Scripts

This directory contains utility scripts for the Horizon AI MVP project.

## Available Scripts

### setup-env.sh

Automated environment setup script that:

- Creates `.env` file from `.env.example`
- Generates secure random secrets for JWT and encryption
- Updates the `.env` file with generated secrets

**Usage:**

```bash
./scripts/setup-env.sh
```

**What it generates:**

- `JWT_ACCESS_SECRET`: 64-character hex string for access token signing
- `JWT_REFRESH_SECRET`: 64-character hex string for refresh token signing
- `ENCRYPTION_KEY`: 32-character hex string for encrypting Open Finance tokens

**After running:**

1. Add your Supabase `DATABASE_URL` to `.env`
2. Add your Supabase `DIRECT_DATABASE_URL` to `.env`
3. (Optional) Add Redis credentials
4. Run `pnpm db:push` to sync database schema

## Manual Secret Generation

If you prefer to generate secrets manually:

```bash
# Generate JWT secrets (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Security Notes

- Never commit `.env` files to version control
- Use different secrets for each environment (development, staging, production)
- Rotate secrets periodically
- Store production secrets securely in Vercel environment variables
