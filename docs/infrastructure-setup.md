# Infrastructure Setup Guide

This guide covers the infrastructure setup for Horizon AI MVP, including Supabase PostgreSQL, Vercel deployment, and CI/CD configuration.

## Prerequisites

- GitHub account with repository access
- Vercel account
- Supabase account

## 1. Provisionar Banco PostgreSQL no Supabase

### Steps:

1. **Create Supabase Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Fill in project details:
     - Name: `horizon-ai-mvp`
     - Database Password: Generate a strong password (save it securely)
     - Region: Choose closest to your users (e.g., `South America (São Paulo)`)
   - Click "Create new project"

2. **Get Database Connection Strings**
   - Navigate to Project Settings → Database
   - Copy the following connection strings:
     - **Connection pooling** (for application): Use "Transaction" mode
       ```
       postgresql://postgres.[project-ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
       ```
     - **Direct connection** (for migrations):
       ```
       postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
       ```

3. **Configure Database Settings**
   - Ensure connection pooling is enabled (PgBouncer)
   - Set pool mode to "Transaction" for optimal performance
   - Note: Connection pooling is recommended for serverless environments like Vercel

## 2. Configurar Integração Vercel + Supabase

### Steps:

1. **Import Project to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository: `horizon-ai-mvp`

2. **Install Supabase Integration (Optional but Recommended)**
   - In Vercel project settings, go to "Integrations"
   - Search for "Supabase"
   - Click "Add Integration"
   - Select your Supabase project
   - This automatically syncs environment variables

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`
   - Node.js Version: 20.x

## 3. Configurar Variáveis de Ambiente na Vercel

### Steps:

1. **Navigate to Environment Variables**
   - Go to your Vercel project
   - Click "Settings" → "Environment Variables"

2. **Add Required Variables**

   Add the following environment variables for all environments (Production, Preview, Development):

   **Database:**

   ```
   DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

   **Authentication:**

   ```
   JWT_ACCESS_SECRET=<generate-random-64-char-string>
   JWT_REFRESH_SECRET=<generate-random-64-char-string>
   ```

   **Encryption:**

   ```
   ENCRYPTION_KEY=<generate-random-32-char-string>
   ```

   **Redis Cache (Upstash):**

   ```
   REDIS_URL=<upstash-redis-url>
   REDIS_TOKEN=<upstash-redis-token>
   ```

   **Environment:**

   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

3. **Generate Secure Secrets**

   Use the following commands to generate secure secrets:

   ```bash
   # Generate JWT secrets (64 characters)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Generate encryption key (32 characters)
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

4. **Environment-Specific Variables**
   - **Production**: Use production database and URLs
   - **Preview**: Can use same database or separate preview database
   - **Development**: Use local values (not required in Vercel)

## 4. CI/CD Pipeline (GitHub Actions)

### Configuration

The CI/CD pipeline is configured in `.github/workflows/validate.yml` and includes:

- **Trigger**: On pull requests and pushes to main branch
- **Steps**:
  1. Checkout code
  2. Install pnpm
  3. Setup Node.js 20
  4. Install dependencies
  5. Run linting
  6. Run type checking
  7. Build project

### GitHub Secrets (Optional)

If you need to run tests that require database access in CI:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `DATABASE_URL`: Test database connection string
   - `JWT_ACCESS_SECRET`: Test secret
   - `JWT_REFRESH_SECRET`: Test secret
   - `ENCRYPTION_KEY`: Test key

### Vercel Deployment

Vercel automatically deploys:

- **Production**: When code is merged to `main` branch
- **Preview**: For every pull request

## 5. Database Migrations

### Initial Setup

After configuring environment variables:

1. **Create local .env file**

   ```bash
   cp .env.example .env
   ```

2. **Add your Supabase credentials to .env**

   ```
   DATABASE_URL=<your-pooled-connection-string>
   DIRECT_DATABASE_URL=<your-direct-connection-string>
   ```

3. **Generate and push schema**

   ```bash
   # Generate migration files
   pnpm db:generate

   # Push schema to database
   pnpm db:push
   ```

4. **Verify in Supabase**
   - Go to Supabase Dashboard → Table Editor
   - Verify tables are created

### Future Migrations

When schema changes:

```bash
# Generate new migration
pnpm db:generate

# Apply to database
pnpm db:push
```

## 6. Upstash Redis Setup (Optional for MVP, Required for Production)

### Steps:

1. **Create Upstash Account**
   - Go to https://upstash.com
   - Sign up or log in

2. **Create Redis Database**
   - Click "Create Database"
   - Name: `horizon-ai-cache`
   - Region: Choose closest to your Vercel deployment
   - Type: Regional (for better latency)

3. **Get Connection Details**
   - Copy `UPSTASH_REDIS_REST_URL` → Use as `REDIS_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN` → Use as `REDIS_TOKEN`

4. **Add to Vercel Environment Variables**
   - Add `REDIS_URL` and `REDIS_TOKEN` to Vercel

## 7. Verification Checklist

- [ ] Supabase project created and accessible
- [ ] Database connection strings obtained
- [ ] Vercel project created and connected to GitHub
- [ ] All environment variables configured in Vercel
- [ ] GitHub Actions workflow file created
- [ ] CI/CD pipeline runs successfully on PR
- [ ] Automatic deployment to Vercel works
- [ ] Database schema can be pushed successfully
- [ ] Redis cache configured (if using)

## 8. Monitoring and Maintenance

### Vercel Dashboard

- Monitor deployments
- Check build logs
- View runtime logs
- Monitor performance metrics

### Supabase Dashboard

- Monitor database performance
- Check connection pooling stats
- View query performance
- Set up database backups

### GitHub Actions

- Monitor workflow runs
- Check for failed builds
- Review PR checks

## Troubleshooting

### Build Fails in Vercel

- Check environment variables are set correctly
- Verify DATABASE_URL format
- Check build logs for specific errors

### Database Connection Issues

- Verify connection string format
- Check if IP is whitelisted (Supabase allows all by default)
- Ensure using pooled connection for serverless

### CI/CD Pipeline Fails

- Check GitHub Actions logs
- Verify pnpm version compatibility
- Ensure all dependencies are in package.json

## Security Best Practices

1. **Never commit secrets to repository**
2. **Use different secrets for each environment**
3. **Rotate secrets periodically**
4. **Enable Vercel deployment protection**
5. **Use Supabase Row Level Security (RLS) when needed**
6. **Monitor access logs regularly**

## Next Steps

After infrastructure setup:

1. Implement database schema (Task 3)
2. Deploy initial version to Vercel
3. Test end-to-end deployment flow
4. Set up monitoring and alerts
