# Testing Guide: Expire Invitations Function

This guide provides comprehensive testing procedures for the Expire Invitations Function.

## Testing Overview

The Expire Invitations Function should be tested in the following scenarios:

1. Manual execution with no expired invitations
2. Manual execution with expired invitations
3. Scheduled execution
4. Error handling and edge cases
5. Performance with large datasets

## Prerequisites

- Function deployed to Appwrite
- Access to Appwrite Console
- Database with `sharing_invitations` collection
- API key with proper permissions

## Test 1: Manual Execution (No Expired Invitations)

**Purpose**: Verify function runs successfully when no invitations need expiring

**Steps**:

1. Ensure all invitations in database have `expires_at` in the future or status != "pending"
2. In Appwrite Console, go to **Functions** > **Expire Invitations**
3. Click **Execute Now**
4. Use empty payload: `{}`
5. Click **Execute**

**Expected Result**:

```json
{
  "success": true,
  "message": "Successfully expired 0 invitation(s)",
  "expiredCount": 0,
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

**Logs Should Show**:

```
[ExpireInvitations] Starting expiration process
[ExpireInvitations] Found 0 expired invitations in batch
[ExpireInvitations] Total invitations expired: 0
```

**Status**: ✅ Pass / ❌ Fail

---

## Test 2: Manual Execution (With Expired Invitations)

**Purpose**: Verify function correctly expires old invitations

### Setup Test Data

Create test invitations with past expiration dates. You can do this via:

#### Option A: Appwrite Console

1. Go to **Databases** > **horizon_ai_db** > **sharing_invitations**
2. Click **Add Document**
3. Create invitation with:
   ```json
   {
     "responsible_user_id": "test-user-123",
     "invited_email": "test1@example.com",
     "token": "test-token-001",
     "status": "pending",
     "expires_at": "2024-01-01T00:00:00.000Z",
     "created_at": "2024-01-01T00:00:00.000Z",
     "updated_at": "2024-01-01T00:00:00.000Z"
   }
   ```
4. Repeat for multiple test invitations (e.g., 5 invitations)

#### Option B: Using Script

Create a test script `test-create-expired-invitations.ts`:

```typescript
import { Client, Databases, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const DATABASE_ID = 'horizon_ai_db';
const COLLECTION_ID = 'sharing_invitations';

async function createTestInvitations() {
  const pastDate = new Date('2024-01-01').toISOString();

  for (let i = 1; i <= 5; i++) {
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      responsible_user_id: 'test-user-123',
      invited_email: `test${i}@example.com`,
      token: `test-token-${String(i).padStart(3, '0')}`,
      status: 'pending',
      expires_at: pastDate,
      created_at: pastDate,
      updated_at: pastDate,
    });
  }

  console.log('Created 5 test invitations with past expiration dates');
}

createTestInvitations();
```

### Execute Test

1. In Appwrite Console, go to **Functions** > **Expire Invitations**
2. Click **Execute Now**
3. Use empty payload: `{}`
4. Click **Execute**

**Expected Result**:

```json
{
  "success": true,
  "message": "Successfully expired 5 invitation(s)",
  "expiredCount": 5,
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

**Logs Should Show**:

```
[ExpireInvitations] Starting expiration process
[ExpireInvitations] Found 5 expired invitations in batch
[ExpireInvitations] Expired invitation abc123
[ExpireInvitations] Expired invitation def456
...
[ExpireInvitations] Total invitations expired: 5
```

### Verify Results

1. Go to **Databases** > **horizon_ai_db** > **sharing_invitations**
2. Check that all test invitations now have `status: "expired"`
3. Verify `updated_at` timestamp is recent

**Status**: ✅ Pass / ❌ Fail

---

## Test 3: Verify No Duplicate Expiration

**Purpose**: Ensure invitations are not expired multiple times

**Steps**:

1. Using the same test data from Test 2 (now with status "expired")
2. Execute the function again manually
3. Check the result

**Expected Result**:

```json
{
  "success": true,
  "message": "Successfully expired 0 invitation(s)",
  "expiredCount": 0,
  "timestamp": "2025-11-12T10:35:00.000Z"
}
```

**Reason**: Invitations with status "expired" should not be queried again

**Status**: ✅ Pass / ❌ Fail

---

## Test 4: Pagination Test (Large Dataset)

**Purpose**: Verify function handles large numbers of expired invitations

### Setup

Create 250 expired invitations (more than the batch size of 100)

```typescript
// Create 250 test invitations
for (let i = 1; i <= 250; i++) {
  await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    responsible_user_id: 'test-user-123',
    invited_email: `bulk-test${i}@example.com`,
    token: `bulk-token-${String(i).padStart(4, '0')}`,
    status: 'pending',
    expires_at: '2024-01-01T00:00:00.000Z',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  });
}
```

### Execute Test

1. Execute function manually
2. Wait for completion (may take longer)

**Expected Result**:

```json
{
  "success": true,
  "message": "Successfully expired 250 invitation(s)",
  "expiredCount": 250,
  "timestamp": "2025-11-12T10:40:00.000Z"
}
```

**Logs Should Show**:

```
[ExpireInvitations] Starting expiration process
[ExpireInvitations] Found 100 expired invitations in batch
[ExpireInvitations] Found 100 expired invitations in batch
[ExpireInvitations] Found 50 expired invitations in batch
[ExpireInvitations] Total invitations expired: 250
```

**Verify**:

- All 250 invitations have status "expired"
- Function completed without timeout
- No errors in logs

**Status**: ✅ Pass / ❌ Fail

---

## Test 5: Mixed Status Test

**Purpose**: Verify function only expires pending invitations

### Setup

Create invitations with different statuses:

- 3 pending with past expiration (should be expired)
- 2 accepted with past expiration (should NOT be expired)
- 2 rejected with past expiration (should NOT be expired)
- 2 cancelled with past expiration (should NOT be expired)
- 1 already expired (should NOT be expired again)

### Execute Test

Execute function manually

**Expected Result**:

```json
{
  "success": true,
  "message": "Successfully expired 3 invitation(s)",
  "expiredCount": 3,
  "timestamp": "2025-11-12T10:45:00.000Z"
}
```

**Verify**:

- Only the 3 pending invitations changed to expired
- Other invitations remain unchanged

**Status**: ✅ Pass / ❌ Fail

---

## Test 6: Future Expiration Date Test

**Purpose**: Verify function doesn't expire invitations that haven't expired yet

### Setup

Create invitations with future expiration dates:

```json
{
  "status": "pending",
  "expires_at": "2099-12-31T23:59:59.000Z"
}
```

### Execute Test

Execute function manually

**Expected Result**:

```json
{
  "success": true,
  "message": "Successfully expired 0 invitation(s)",
  "expiredCount": 0,
  "timestamp": "2025-11-12T10:50:00.000Z"
}
```

**Verify**:

- Invitations with future dates remain pending
- No invitations were modified

**Status**: ✅ Pass / ❌ Fail

---

## Test 7: Scheduled Execution Test

**Purpose**: Verify function runs automatically on schedule

### Setup

1. Ensure schedule trigger is configured: `0 0 * * *`
2. Create some expired invitations
3. Wait for scheduled execution time (midnight)

### Verify

1. Check **Executions** tab next day
2. Verify automatic execution occurred
3. Check execution logs
4. Verify invitations were expired

**Expected**:

- Execution appears in list with trigger type "schedule"
- Execution was successful
- Expired invitations count matches expected

**Status**: ✅ Pass / ❌ Fail

---

## Test 8: Error Handling Test

**Purpose**: Verify function handles errors gracefully

### Test 8.1: Invalid Database ID

1. Temporarily change `APPWRITE_DATABASE_ID` environment variable to invalid value
2. Execute function
3. Verify error is logged and returned

**Expected Result**:

```json
{
  "success": false,
  "error": "Database not found"
}
```

### Test 8.2: Invalid API Key

1. Temporarily change `APPWRITE_API_KEY` to invalid value
2. Execute function
3. Verify authentication error

**Expected Result**:

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

### Test 8.3: Missing Permissions

1. Use API key without write permissions
2. Execute function
3. Verify permission error

**Expected Result**:

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

**Status**: ✅ Pass / ❌ Fail

---

## Test 9: Performance Test

**Purpose**: Measure function performance

### Metrics to Collect

1. **Execution Time**: How long function takes to run
2. **Memory Usage**: Peak memory consumption
3. **Database Queries**: Number of queries executed

### Test Scenarios

| Expired Invitations | Expected Time | Actual Time | Status |
| ------------------- | ------------- | ----------- | ------ |
| 0                   | < 1 second    |             |        |
| 10                  | < 2 seconds   |             |        |
| 100                 | < 5 seconds   |             |        |
| 500                 | < 15 seconds  |             |        |
| 1000                | < 30 seconds  |             |        |

**Status**: ✅ Pass / ❌ Fail

---

## Test 10: Realtime UI Update Test

**Purpose**: Verify UI updates automatically when invitations expire

### Setup

1. Open application in browser
2. Navigate to invitations page
3. Create expired invitation
4. Execute function

**Expected**:

- Invitation status updates to "expired" in UI automatically
- No page refresh needed
- Update happens within 1-2 seconds

**Status**: ✅ Pass / ❌ Fail

---

## Cleanup

After testing, clean up test data:

```typescript
// Delete all test invitations
const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.startsWith('invited_email', 'test')]);

for (const doc of result.documents) {
  await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
}
```

---

## Test Summary

| Test | Description                  | Status | Notes |
| ---- | ---------------------------- | ------ | ----- |
| 1    | No expired invitations       | ⬜     |       |
| 2    | With expired invitations     | ⬜     |       |
| 3    | No duplicate expiration      | ⬜     |       |
| 4    | Pagination (250 invitations) | ⬜     |       |
| 5    | Mixed status                 | ⬜     |       |
| 6    | Future expiration dates      | ⬜     |       |
| 7    | Scheduled execution          | ⬜     |       |
| 8    | Error handling               | ⬜     |       |
| 9    | Performance                  | ⬜     |       |
| 10   | Realtime UI updates          | ⬜     |       |

**Overall Status**: ⬜ Not Started / 🟡 In Progress / ✅ Passed / ❌ Failed

---

## Troubleshooting Test Failures

### Function Returns Error

1. Check environment variables are set correctly
2. Verify API key has proper permissions
3. Check database and collection names
4. Review function logs for detailed error

### Invitations Not Being Expired

1. Verify query is correct (status = "pending", expires_at < now)
2. Check invitation data format
3. Verify `expires_at` is in ISO 8601 format
4. Check timezone issues

### Performance Issues

1. Check database indexes on `status` and `expires_at`
2. Verify pagination is working (batch size 100)
3. Monitor database query performance
4. Consider increasing function timeout if needed

### Scheduled Execution Not Running

1. Verify schedule trigger is configured
2. Check timezone setting
3. Ensure function is not disabled
4. Check for execution errors in logs

---

## Next Steps

After all tests pass:

1. Document any issues found and resolutions
2. Update function code if needed
3. Monitor production executions
4. Set up alerts for failures
5. Schedule regular testing (monthly)

## Related Documentation

- [README.md](./README.md) - Function overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [Serverless Architecture Design](../../.kiro/specs/serverless-architecture-refactor/design.md)
