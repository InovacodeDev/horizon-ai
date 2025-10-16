# Deployment Checklist

Use this checklist to ensure proper deployment of Horizon AI MVP to production.

## Pre-Deployment

### Infrastructure Setup

- [ ] Supabase project created
- [ ] Database connection strings obtained (pooled + direct)
- [ ] Vercel project created and linked to GitHub repository
- [ ] GitHub Actions workflow configured and passing
- [ ] Upstash Redis database created (optional for MVP)

### Environment Variables

- [ ] `DATABASE_URL` configured in Vercel (pooled connection)
- [ ] `DIRECT_DATABASE_URL` configured in Vercel (direct connection)
- [ ] `JWT_ACCESS_SECRET` generated and configured (64 chars)
- [ ] `JWT_REFRESH_SECRET` generated and configured (64 chars)
- [ ] `ENCRYPTION_KEY` generated and configured (32 chars)
- [ ] `NODE_ENV` set to `production`
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] `REDIS_URL` configured (if using cache)
- [ ] `REDIS_TOKEN` configured (if using cache)

### Database

- [ ] Schema pushed to Supabase database (`pnpm db:push`)
- [ ] Database tables verified in Supabase dashboard
- [ ] Indexes created for performance
- [ ] Connection pooling enabled (Transaction mode)

### Security

- [ ] All secrets are unique and randomly generated
- [ ] No secrets committed to repository
- [ ] HTTPS/TLS enabled (automatic with Vercel)
- [ ] Security headers configured in `vercel.json`
- [ ] CORS configured properly

## Deployment

### Initial Deployment

- [ ] Code merged to `main` branch
- [ ] Vercel automatic deployment triggered
- [ ] Build completed successfully
- [ ] No build errors or warnings

### Verification

- [ ] Production URL accessible
- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] API routes responding (test with `/api/health` if implemented)
- [ ] Database connection working

## Post-Deployment

### Smoke Tests

- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads (after authentication)
- [ ] Error pages display correctly (404, 500)

### Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (Sentry or similar)
- [ ] Database monitoring active in Supabase
- [ ] Performance metrics baseline established

### Documentation

- [ ] Production URL documented
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Team notified of deployment

## Rollback Procedure

If issues are detected after deployment:

1. **Immediate Rollback**
   - Go to Vercel Dashboard → Deployments
   - Find last stable deployment
   - Click "..." → "Promote to Production"

2. **Investigate Issue**
   - Check Vercel logs
   - Check Supabase logs
   - Review error tracking
   - Identify root cause

3. **Fix and Redeploy**
   - Fix issue in code
   - Test locally
   - Create PR and merge
   - Monitor new deployment

## Continuous Deployment

### Automatic Deployments

- **Production**: Triggered on merge to `main`
- **Preview**: Triggered on every PR
- **Development**: Local environment only

### Deployment Protection

- [ ] Enable Vercel deployment protection for production
- [ ] Require PR reviews before merge
- [ ] Ensure CI/CD checks pass before merge

## Maintenance

### Regular Tasks

- [ ] Monitor error rates weekly
- [ ] Review performance metrics weekly
- [ ] Check database size and growth monthly
- [ ] Rotate secrets quarterly
- [ ] Update dependencies monthly
- [ ] Review and optimize database queries monthly

### Backup Strategy

- [ ] Supabase automatic backups enabled
- [ ] Backup retention policy configured
- [ ] Restore procedure tested
- [ ] Backup monitoring active

## Emergency Contacts

Document key contacts for production issues:

- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io
- **Team Lead**: [Add contact]
- **On-Call Developer**: [Add contact]

## Notes

- Always test in preview environment before promoting to production
- Keep this checklist updated as infrastructure evolves
- Document any deviations from standard deployment process
