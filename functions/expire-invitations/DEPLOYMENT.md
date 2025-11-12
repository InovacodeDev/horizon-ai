# Deployment Guide: Expire Invitations Function

This guide provides step-by-step instructions for deploying the Expire Invitations Function to Appwrite.

## Prerequisites

- Appwrite Cloud account or self-hosted Appwrite instance
- Access to Appwrite Console
- Node.js 18+ installed locally (for building)
- Appwrite CLI installed (optional, for CLI deployment)

## Deployment Steps

### Step 1: Build the Function

From the `functions/expire-invitations` directory:

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify build succeeded
ls -la index.js
```

### Step 2: Package for Deployment

Create a deployment archive:

```bash
# Using the deploy script (recommended)
./deploy.sh

# Or manually
tar -czf expire-invitations.tar.gz src/ package.json tsconfig.json index.js index.d.ts
```

This creates `expire-invitations.tar.gz` ready for upload.

### Step 3: Create Function in Appwrite Console

1. Log in to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project
3. Navigate to **Functions** in the left sidebar
4. Click **Create Function**
5. Configure the function:
   - **Name**: `Expire Invitations`
   - **Function ID**: `expire-invitations` (or auto-generate)
   - **Runtime**: `Node.js 20.0` (or latest available)
   - **Entrypoint**: `index.js`
   - **Build Commands**: `npm install && npm run build`
   - **Execute Access**: Select appropriate permissions (typically `any` for scheduled functions)

6. Click **Create**

### Step 4: Configure Environment Variables

In the function settings, add the following environment variables:

| Variable               | Value                          | Description                       |
| ---------------------- | ------------------------------ | --------------------------------- |
| `APPWRITE_ENDPOINT`    | `https://cloud.appwrite.io/v1` | Appwrite API endpoint             |
| `APPWRITE_DATABASE_ID` | `horizon_ai_db`                | Your database ID                  |
| `APPWRITE_API_KEY`     | `your-api-key-here`            | API key with database permissions |

**Important**: The API key must have the following permissions:

- Read access to `sharing_invitations` collection
- Write access to `sharing_invitations` collection

To create an API key:

1. Go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Name it `Expire Invitations Function`
4. Set scopes:
   - `databases.read`
   - `databases.write`
5. Copy the key and add it to the function's environment variables

### Step 5: Configure Schedule Trigger

1. In the function settings, go to **Settings** > **Events**
2. Click **Add Event**
3. Select **Schedule**
4. Configure:
   - **Schedule**: `0 0 * * *` (Daily at midnight)
   - **Timezone**: Select your preferred timezone (e.g., `UTC`, `America/Sao_Paulo`)
5. Click **Create**

### Step 6: Deploy the Function

#### Option A: Via Appwrite Console (Recommended)

1. In the function page, go to **Deployments**
2. Click **Create Deployment**
3. Click **Manual** tab
4. Upload the `expire-invitations.tar.gz` file
5. Wait for the build to complete (this may take 1-2 minutes)
6. Once status shows **Ready**, the function is deployed

#### Option B: Via Appwrite CLI

If you have Appwrite CLI installed:

```bash
# Login to Appwrite
appwrite login

# Deploy the function
appwrite deploy function

# Follow the prompts to select the function
```

### Step 7: Test the Deployment

#### Manual Test

1. In Appwrite Console, go to **Functions** > **Expire Invitations**
2. Click **Execute** (or **Execute Now**)
3. Leave the payload empty or use `{}`
4. Click **Execute**
5. Check the execution logs for:
   ```
   [ExpireInvitations] Starting expiration process
   [ExpireInvitations] Total invitations expired: X
   ```

#### Test with Sample Data

Create a test invitation with a past expiration date:

```bash
# Using Appwrite CLI or Console
# Create an invitation with expires_at in the past
{
  "responsible_user_id": "test-user-id",
  "invited_email": "test@example.com",
  "token": "test-token-123",
  "status": "pending",
  "expires_at": "2024-01-01T00:00:00.000Z",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

Then execute the function manually and verify the invitation status changes to "expired".

### Step 8: Monitor Scheduled Executions

1. Wait for the scheduled time (midnight in your configured timezone)
2. Check **Executions** tab in the function page
3. Verify automatic executions are running successfully
4. Check logs for any errors

## Verification Checklist

- [ ] Function created in Appwrite Console
- [ ] Environment variables configured correctly
- [ ] Schedule trigger configured (`0 0 * * *`)
- [ ] Function deployed successfully (status: Ready)
- [ ] Manual test execution successful
- [ ] Test with sample expired invitation successful
- [ ] Scheduled execution running automatically
- [ ] No errors in execution logs

## Troubleshooting

### Build Fails

**Problem**: Build fails during deployment

**Solutions**:

- Verify `package.json` has correct dependencies
- Check Node.js version compatibility
- Review build logs in Appwrite Console
- Try building locally first: `npm install && npm run build`

### Function Not Executing on Schedule

**Problem**: Function doesn't run at scheduled time

**Solutions**:

- Verify schedule trigger is configured correctly
- Check timezone setting
- Ensure function is not disabled
- Check execution logs for errors

### No Invitations Being Expired

**Problem**: Function runs but doesn't expire invitations

**Solutions**:

- Verify database ID is correct in environment variables
- Check API key has proper permissions
- Verify collection name is `sharing_invitations`
- Check that invitations exist with:
  - `status = "pending"`
  - `expires_at` in the past
- Review function logs for query errors

### Permission Errors

**Problem**: Function fails with permission errors

**Solutions**:

- Verify API key has `databases.read` and `databases.write` scopes
- Check collection permissions allow API key access
- Ensure API key is not expired
- Try creating a new API key with correct permissions

### Timeout Errors

**Problem**: Function times out with large datasets

**Solutions**:

- Current timeout is 900 seconds (15 minutes)
- If needed, increase timeout in function settings
- Verify pagination is working correctly (batch size: 100)
- Check for slow database queries

## Monitoring

### Key Metrics to Monitor

1. **Execution Count**: Number of times function runs (should be once per day)
2. **Success Rate**: Percentage of successful executions
3. **Execution Time**: How long each execution takes
4. **Expired Count**: Number of invitations expired per execution

### Setting Up Alerts

Consider setting up alerts for:

- Failed executions
- Execution time exceeding threshold
- No executions for 24+ hours

## Updating the Function

To update the function code:

1. Make changes to `src/index.ts`
2. Build: `npm run build`
3. Package: `./deploy.sh` or create tar.gz manually
4. Upload new deployment in Appwrite Console
5. Wait for build to complete
6. Test the new version

## Rollback

If a deployment fails or causes issues:

1. Go to **Deployments** tab
2. Find the previous working deployment
3. Click **Redeploy** on that deployment
4. Wait for build to complete

## Related Documentation

- [README.md](./README.md) - Function overview and usage
- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Scheduled Functions](https://appwrite.io/docs/products/functions/scheduled)

## Support

If you encounter issues not covered in this guide:

1. Check Appwrite Console execution logs
2. Review function code for errors
3. Consult Appwrite documentation
4. Contact Appwrite support or community
