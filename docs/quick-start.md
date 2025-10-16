# Quick Start Guide

Get Horizon AI MVP running locally in minutes.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account
- Git

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd horizon-ai-mvp

# Install dependencies
pnpm install
```

### 2. Environment Setup

**Option A: Automated (Recommended)**

```bash
# Run setup script
./scripts/setup-env.sh
```

**Option B: Manual**

```bash
# Copy environment template
cp .env.example .env

# Generate secrets manually
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"  # ENCRYPTION_KEY
```

### 3. Configure Database

Add your Supabase credentials to `.env`:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 4. Initialize Database

```bash
# Push schema to database
pnpm db:push

# (Optional) Open Drizzle Studio to view database
pnpm db:studio
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## Available Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript type checking

# Database
pnpm db:generate      # Generate migration files
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
```

## Project Structure

```
horizon-ai-mvp/
├── .github/
│   └── workflows/
│       └── validate.yml      # CI/CD pipeline
├── docs/                     # Documentation
│   ├── infrastructure-setup.md
│   ├── deployment-checklist.md
│   └── quick-start.md
├── scripts/                  # Utility scripts
│   └── setup-env.sh
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── db/
│       │   ├── index.ts      # Database client
│       │   └── schema.ts     # Drizzle schema
│       └── utils.ts
├── .env.example              # Environment template
├── drizzle.config.ts         # Drizzle configuration
├── next.config.ts            # Next.js configuration
├── vercel.json               # Vercel deployment config
└── package.json
```

## Common Issues

### Database Connection Error

**Problem**: Cannot connect to database

**Solution**:

- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure IP is whitelisted (Supabase allows all by default)

### Build Fails

**Problem**: Build fails with environment variable errors

**Solution**:

- Ensure all required env vars are set
- Check `.env` file exists
- Verify secrets are properly formatted

### Type Errors

**Problem**: TypeScript errors in IDE

**Solution**:

```bash
# Regenerate types
pnpm typecheck

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## Next Steps

1. ✅ Complete infrastructure setup (Task 2)
2. 📝 Implement database schema (Task 3)
3. 🔐 Implement authentication system (Task 4)
4. 🎨 Build frontend pages (Task 5)

## Resources

- [Full Infrastructure Setup Guide](./infrastructure-setup.md)
- [Deployment Checklist](./deployment-checklist.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Supabase Documentation](https://supabase.com/docs)

## Getting Help

- Check documentation in `docs/` directory
- Review requirements in `.kiro/specs/horizon-ai-mvp/`
- Open an issue on GitHub
- Contact team lead

---

**Happy coding! 🚀**
