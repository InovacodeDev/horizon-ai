# Expire Invitations Function

Appwrite Function to automatically mark old pending invitations as expired.

## Overview

This function runs on a daily schedule to find all pending invitations that have passed their expiration date and updates their status to "expired". This ensures that the invitation system stays clean and users cannot accept invitations that are no longer valid.

## Functionality

1. **Automatic Expiration**: Runs daily at midnight (00:00 UTC) to check for expired invitations
2. **Pagination Support**: Handles large datasets by processing invitations in batches of 100
3. **Error Handling**: Continues processing even if individual invitation updates fail
4. **Detailed Logging**: Provides comprehensive logs for monitoring and debugging

## Configuration in Appwrite Console

### 1. Create the Function

1. Access the Appwrite Console
2. Go to **Functions** > **Create Function**
3. Configure:
   - **Name**: Expire Invitations
   - **Runtime**: Node.js 20.x (or higher)
   - **Entrypoint**: `src/index.ts`
   - **Build Commands**: `npm install && npm run build`

### 2. Configure Environment Variables

Add the following environment variables to the function:

```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key
```

**Note**: The API key must have permissions to read and update documents in the invitations collection.

### 3. Configure Schedule Trigger

Configure a schedule to run daily at midnight:

```
Cron Expression: 0 0 * * *
Timezone: UTC (or your preferred timezone)
```

This will execute the function every day at 00:00 to expire old invitations.

### 4. Deploy

#### Option A: Via Appwrite Console (Recommended)

1. Build the function locally:

   ```bash
   cd functions/expire-invitations
   npm install
   npm run build
   ```

2. Package the function:

   ```bash
   tar -czf expire-invitations.tar.gz src/ dist/ package.json package-lock.json tsconfig.json
   ```

3. In Appwrite Console:
   - Go to **Functions** > **Expire Invitations** > **Deployments**
   - Click **Create Deployment**
   - Upload the `expire-invitations.tar.gz` file
   - Set entrypoint to `dist/index.js` (or `src/index.ts` if using ts-node)
   - Wait for the build to complete

4. Activate the deployment once build succeeds

#### Option B: Via Appwrite CLI

```bash
cd functions/expire-invitations

# Initialize Appwrite CLI (first time only)
appwrite login

# Deploy the function
appwrite functions create \
  --functionId expire-invitations \
  --name "Expire Invitations" \
  --runtime node-20.0 \
  --execute any \
  --events "schedule" \
  --schedule "0 0 * * *" \
  --timeout 300

# Create deployment
appwrite functions createDeployment \
  --functionId expire-invitations \
  --entrypoint src/index.ts \
  --code .
```

#### Option C: Using Deploy Script

A deployment script is provided for convenience:

```bash
cd functions/expire-invitations
chmod +x deploy.sh
./deploy.sh
```

### 5. Test

#### Manual Test via Appwrite Console

1. Go to **Functions** > **Expire Invitations** > **Execute**
2. Leave the payload empty or use:

   ```json
   {}
   ```

3. Click **Execute**
4. Check the response:

   ```json
   {
     "success": true,
     "message": "Successfully expired 5 invitation(s)",
     "expiredCount": 5,
     "timestamp": "2025-11-12T10:30:00.000Z"
   }
   ```

#### Test with Sample Data

1. **Create test invitations** with past expiration dates:

   ```bash
   # Using Appwrite CLI
   appwrite databases createDocument \
     --databaseId your-database-id \
     --collectionId invitations \
     --documentId unique() \
     --data '{
       "email": "test@example.com",
       "status": "pending",
       "expires_at": "2025-01-01T00:00:00.000Z",
       "user_id": "test-user-id"
     }'
   ```

2. **Execute the function** manually via Console

3. **Verify the results**:
   - Check that invitation status changed to "expired"
   - Review function logs for execution details
   - Confirm `updated_at` timestamp was updated

#### Test Script

A test script is provided for local testing:

```bash
cd functions/expire-invitations
npm install
npm run test

# Or run the test script directly
npx ts-node test-function.ts
```

#### Integration Test

Test the complete flow:

1. **Create pending invitation** with future expiration date
2. **Wait for schedule** or manually trigger function
3. **Verify invitation remains pending** (not expired yet)
4. **Update expiration date** to past date
5. **Trigger function again**
6. **Verify invitation is now expired**

#### Expected Behavior

| Scenario             | Status Before | Expires At | Status After | Notes         |
| -------------------- | ------------- | ---------- | ------------ | ------------- |
| Future expiration    | pending       | 2026-12-31 | pending      | Not expired   |
| Past expiration      | pending       | 2024-01-01 | expired      | Expired       |
| Already expired      | expired       | 2024-01-01 | expired      | No change     |
| Accepted invitation  | accepted      | 2024-01-01 | accepted     | Not processed |
| Cancelled invitation | cancelled     | 2024-01-01 | cancelled    | Not processed |

## How It Works

### Expiration Process

1. **Query Pending Invitations**: Fetches all invitations with:
   - `status = "pending"`
   - `expires_at < current_date`

2. **Batch Processing**: Processes invitations in batches of 100 to handle large datasets efficiently

3. **Update Status**: For each expired invitation:
   - Updates `status` to "expired"
   - Updates `updated_at` to current timestamp

4. **Return Results**: Returns count of expired invitations

### Pagination

The function uses pagination to handle large numbers of invitations:

```typescript
- Batch size: 100 invitations per query
- Continues until no more expired invitations are found
- Handles errors gracefully for individual updates
```

## Code Structure

```
functions/expire-invitations/
├── src/
│   └── index.ts         # Main function code
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
├── .gitignore          # Ignored files
└── README.md           # This documentation
```

## Logs

The function generates detailed logs for monitoring:

```
[ExpireInvitations] Starting expiration process
[ExpireInvitations] Found 5 expired invitations in batch
[ExpireInvitations] Expired invitation 123abc
[ExpireInvitations] Total invitations expired: 5
```

## Error Handling

The function includes comprehensive error handling:

- **Query Errors**: Logged and thrown to stop execution
- **Update Errors**: Logged but execution continues for remaining invitations
- **Function Errors**: Returned with 500 status code and error details

## Monitoring

Monitor function executions in Appwrite Console:

1. **Functions** > **Expire Invitations** > **Executions**
2. Check execution logs for:
   - Number of invitations expired
   - Any errors during processing
   - Execution time and performance

## Troubleshooting

### Function Not Executing

**Check:**

- Schedule trigger is configured correctly (`0 0 * * *`)
- Timezone is set appropriately
- Function is deployed and active

### No Invitations Being Expired

**Check:**

- Invitations exist with `status = "pending"`
- Invitations have `expires_at` dates in the past
- Database ID and collection name are correct
- API key has proper permissions

### Partial Failures

**Check:**

- Function logs for specific error messages
- Database permissions for the API key
- Individual invitation data integrity

## Maintenance

### Update the Function

1. Modify code in `src/index.ts`
2. Create a new deployment in Appwrite Console
3. Wait for build to complete
4. Test the new version

### Performance Optimization

If processing large numbers of invitations:

- Consider increasing batch size (currently 100)
- Monitor execution time in Appwrite Console
- Adjust schedule frequency if needed

## Integration with UI

The UI should automatically reflect expired invitations through Appwrite Realtime subscriptions. When this function updates invitation statuses, connected clients will receive real-time updates.

Example React hook:

```typescript
import { client } from '@/lib/appwrite/client';

function useInvitations(userId: string) {
  useEffect(() => {
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.invitations.documents`, (response) => {
      if (response.events.includes('databases.*.collections.invitations.documents.*.update')) {
        // Handle invitation status update
        const updatedInvitation = response.payload;
        if (updatedInvitation.status === 'expired') {
          // Update UI to show expired status
        }
      }
    });

    return () => unsubscribe();
  }, [userId]);
}
```

## References

- [Appwrite Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Scheduled Functions](https://appwrite.io/docs/products/functions/scheduled)
- [Appwrite Database Queries](https://appwrite.io/docs/products/databases/queries)
- [Appwrite Realtime](https://appwrite.io/docs/apis/realtime)

## Related Documentation

- [Serverless Architecture Design](../../.kiro/specs/serverless-architecture-refactor/design.md)
- [Serverless Architecture Requirements](../../.kiro/specs/serverless-architecture-refactor/requirements.md)
- [Balance Sync Function](../balance-sync/README.md)
