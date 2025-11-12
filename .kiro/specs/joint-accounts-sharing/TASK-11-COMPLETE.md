# Task 11 Complete: Cron Job for Invitation Expiration

## Summary

Implemented a cron job system to automatically expire old pending invitations that have passed their 7-day expiration period.

## What Was Implemented

### 1. Cron Endpoint (`app/api/cron/expire-invitations/route.ts`)

Created a secure API endpoint that:

- Authenticates requests using `CRON_SECRET` environment variable
- Calls `InvitationService.expireOldInvitations()` to process expired invitations
- Returns count of expired invitations and timestamp
- Includes proper error handling and logging

**Authentication:**

- Requires `Authorization: Bearer <CRON_SECRET>` header
- Returns 401 Unauthorized if secret doesn't match
- Returns 500 if CRON_SECRET is not configured

**Response Format:**

```json
{
  "success": true,
  "data": {
    "expired_count": 5,
    "timestamp": "2025-11-11T00:00:00.000Z",
    "message": "Successfully expired 5 invitation(s)"
  }
}
```

### 2. Vercel Cron Configuration (`vercel.json`)

Added cron job configuration to run daily at midnight (00:00 UTC):

```json
{
  "crons": [
    {
      "path": "/api/cron/process-recurring",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/expire-invitations",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule:** `0 0 * * *` (daily at midnight UTC)

## How It Works

1. **Vercel Cron** triggers the endpoint daily at midnight
2. **Authentication** verifies the request using CRON_SECRET
3. **InvitationService** queries all pending invitations with `expires_at < now`
4. **Status Update** marks each expired invitation as 'expired'
5. **Response** returns count of processed invitations

## Environment Variables

The `CRON_SECRET` environment variable is already documented in `.env.example`:

```bash
# ============================================
# Cron Jobs Configuration
# ============================================
# Secret key for protecting cron endpoints
# Generate using: openssl rand -hex 32
CRON_SECRET=your-cron-secret-key-change-this-in-production
```

## Deployment Notes

### For Vercel Deployment:

1. **Set Environment Variable:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add `CRON_SECRET` with a secure random value
   - Generate using: `openssl rand -hex 32`

2. **Cron Jobs:**
   - Vercel automatically configures cron jobs from `vercel.json`
   - No additional setup required
   - Vercel injects the `CRON_SECRET` automatically in cron requests

3. **Monitoring:**
   - View cron job logs in Vercel Dashboard → Deployments → Functions
   - Check for successful executions and error logs

### For Local Testing:

Test the endpoint manually:

```bash
# Set CRON_SECRET in .env
CRON_SECRET=your-test-secret

# Test the endpoint
curl -X GET http://localhost:3000/api/cron/expire-invitations \
  -H "Authorization: Bearer your-test-secret"
```

## Requirements Satisfied

✅ **Requirement 2.5:** "WHEN a Pending_Invitation expires after 7 days without action, THE System SHALL automatically mark it as expired and prevent acceptance"

- Cron job runs daily to check for expired invitations
- Invitations with `expires_at < now` are marked as 'expired'
- Expired invitations cannot be accepted (validation in InvitationService)

## Integration with Existing System

- Uses existing `InvitationService.expireOldInvitations()` method
- Follows same authentication pattern as `process-recurring` cron job
- Consistent error handling and response format
- No changes required to existing invitation logic

## Testing

To verify the implementation:

1. **Create a test invitation** with a past expiration date
2. **Trigger the cron endpoint** manually
3. **Verify** the invitation status changed to 'expired'
4. **Attempt to accept** the expired invitation (should fail)

## Next Steps

The cron job is now configured and ready for deployment. When deployed to Vercel:

- Cron jobs will run automatically at midnight UTC
- Expired invitations will be processed daily
- No manual intervention required
