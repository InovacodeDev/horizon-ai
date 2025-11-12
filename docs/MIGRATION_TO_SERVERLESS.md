# Migration to Serverless Architecture

## Overview

This document describes the migration from a monolithic Next.js architecture (where business logic lived in API routes and server actions) to a serverless-first architecture (where business logic is handled by Appwrite Functions).

## What Changed

### Before: Monolithic Architecture

```
Next.js Application
├── API Routes (CRUD + Business Logic)
├── Server Actions (CRUD + Business Logic)
├── Services (CRUD + Calculations)
└── Cron Jobs (Scheduled Tasks)
```

**Problems:**

- Business logic mixed with CRUD operations
- Difficult to scale specific features
- Cron jobs limited by Vercel's constraints
- Manual balance recalculation required
- No automatic UI updates

### After: Serverless Architecture

```
Next.js Application (Presentation Layer)
├── API Routes (CRUD Only)
├── Server Actions (CRUD Only)
└── Realtime Subscriptions (Auto-updates)

Appwrite Functions (Business Logic Layer)
├── Balance Sync (Event + Schedule)
├── Recurring Transactions (Schedule)
└── Expire Invitations (Schedule)
```

**Benefits:**

- Clear separation of concerns
- Independent scaling
- Automatic event-driven processing
- Real-time UI updates
- No manual intervention needed

## Migration Steps

### Phase 1: Verify Existing Functions

#### 1.1 Balance Sync Function

**Status**: ✅ Already exists

**Verification:**

```bash
# Check function exists in Appwrite Console
# Verify event triggers are configured
# Test manual execution
```

**Event Triggers:**

- `databases.*.collections.transactions.documents.*.create`
- `databases.*.collections.transactions.documents.*.update`
- `databases.*.collections.transactions.documents.*.delete`

**Schedule Trigger:**

- `0 20 * * *` (Daily at 20:00)

#### 1.2 Recurring Transactions Function

**Status**: ✅ Already exists

**Verification:**

```bash
# Check function exists in Appwrite Console
# Verify schedule trigger is configured
# Test manual execution
```

**Schedule Trigger:**

- `0 0 1 * *` (1st of month at 00:00)

### Phase 2: Create New Functions

#### 2.1 Expire Invitations Function

**Status**: ✅ Created

**Location**: `functions/expire-invitations/`

**What it does:**

- Queries pending invitations with past expiration dates
- Updates their status to "expired"
- Runs daily at midnight

**Deployment:**

```bash
cd functions/expire-invitations
./deploy.sh
```

### Phase 3: Refactor Next.js Code

#### 3.1 Transaction API Routes

**File**: `app/api/transactions/route.ts`

**Before:**

```typescript
export async function POST(request: NextRequest) {
  const transaction = await transactionService.create(data);

  // ❌ Business logic in API route
  await balanceSyncService.syncAccountBalance(data.accountId);

  return NextResponse.json({ data: transaction });
}
```

**After:**

```typescript
export async function POST(request: NextRequest) {
  const transaction = await transactionService.create(data);

  // ✅ Pure CRUD - balance updated by Appwrite Function
  return NextResponse.json({ data: transaction });
}
```

**Changes Made:**

- Removed `balanceSyncService.syncAccountBalance()` calls
- Removed balance calculation logic
- API route now only performs database INSERT
- Balance Sync Function handles updates via event trigger

#### 3.2 Transaction Server Actions

**File**: `actions/transaction.actions.ts`

**Deprecated Actions:**

```typescript
/**
 * @deprecated Balance sync is now handled automatically by Appwrite Functions
 * This action is kept for emergency manual recalculation only
 */
export async function processDueTransactionsAction() {
  return {
    success: false,
    message: 'This action is deprecated. Balance sync is now automatic via Appwrite Functions.',
  };
}

/**
 * @deprecated Balance sync is now handled automatically by Appwrite Functions
 */
export async function reprocessAllBalancesAction() {
  return {
    success: false,
    message: 'Balance sync is now automatic. Use Appwrite Console to manually trigger if needed.',
  };
}
```

**Cleaned Actions:**

```typescript
// ✅ Pure CRUD - no balance logic
export async function createTransactionAction(data: TransactionData) {
  const transaction = await transactionService.create(data);
  revalidatePath('/transactions');
  return { success: true, data: transaction };
}

export async function updateTransactionAction(id: string, data: TransactionData) {
  const transaction = await transactionService.update(id, data);
  revalidatePath('/transactions');
  return { success: true, data: transaction };
}

export async function deleteTransactionAction(id: string) {
  await transactionService.delete(id);
  revalidatePath('/transactions');
  return { success: true };
}
```

#### 3.3 Balance Sync Actions

**File**: `actions/balance-sync.actions.ts`

**Status**: All actions marked as deprecated

```typescript
/**
 * @deprecated Balance sync is now automatic via Appwrite Functions
 * Use this only for emergency manual recalculation
 */
export async function syncAccountBalanceAction(accountId: string) {
  return {
    success: false,
    message: 'Balance sync is now automatic. Changes will reflect within seconds via Appwrite Functions.',
  };
}

/**
 * @deprecated Balance sync is now automatic via Appwrite Functions
 */
export async function recalculateAllBalancesAction() {
  return {
    success: false,
    message: 'Balance sync is now automatic. Use Appwrite Console to manually trigger if needed.',
  };
}
```

#### 3.4 Remove Cron Routes

**Deleted Files:**

- `app/api/cron/process-recurring/route.ts` ❌
- `app/api/cron/expire-invitations/route.ts` ❌
- `app/api/cron/` directory ❌

**Reason**: Replaced by Appwrite Functions with schedule triggers

**File**: `vercel.json`

**Before:**

```json
{
  "crons": [
    {
      "path": "/api/cron/process-recurring",
      "schedule": "0 0 1 * *"
    },
    {
      "path": "/api/cron/expire-invitations",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**After:**

```json
{
  // Crons array removed - handled by Appwrite Functions
}
```

### Phase 4: Implement Realtime Updates

#### 4.1 Account Balance Hook

**File**: `hooks/useAccountBalance.ts`

**Created**: ✅

```typescript
import { client, databases } from '@/lib/appwrite/client';
import { useEffect, useState } from 'react';

export function useAccountBalance(accountId: string) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to account document changes
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.accounts.documents.${accountId}`,
      (response) => {
        if (response.events.includes('databases.*.collections.accounts.documents.*.update')) {
          const updatedAccount = response.payload as Account;
          setBalance(updatedAccount.balance);
        }
      },
    );

    // Fetch initial balance
    databases.getDocument(DATABASE_ID, 'accounts', accountId).then((account) => {
      setBalance(account.balance);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [accountId]);

  return { balance, loading };
}
```

**Usage in Components:**

```typescript
function AccountCard({ accountId }: { accountId: string }) {
  const { balance, loading } = useAccountBalance(accountId);

  return (
    <div>
      {loading ? <Skeleton /> : <span>${balance}</span>}
    </div>
  );
}
```

#### 4.2 Transactions Hook

**File**: `hooks/useTransactions.ts`

**Created**: ✅

```typescript
export function useTransactions(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to transaction collection changes
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.transactions.documents`, (response) => {
      const events = response.events;

      if (events.includes('databases.*.collections.transactions.documents.*.create')) {
        const newTransaction = response.payload as Transaction;
        if (newTransaction.user_id === userId) {
          setTransactions((prev) => [newTransaction, ...prev]);
        }
      } else if (events.includes('databases.*.collections.transactions.documents.*.update')) {
        const updatedTransaction = response.payload as Transaction;
        setTransactions((prev) => prev.map((t) => (t.$id === updatedTransaction.$id ? updatedTransaction : t)));
      } else if (events.includes('databases.*.collections.transactions.documents.*.delete')) {
        const deletedTransaction = response.payload as Transaction;
        setTransactions((prev) => prev.filter((t) => t.$id !== deletedTransaction.$id));
      }
    });

    // Fetch initial transactions
    databases
      .listDocuments(DATABASE_ID, 'transactions', [
        Query.equal('user_id', userId),
        Query.orderDesc('date'),
        Query.limit(50),
      ])
      .then((result) => {
        setTransactions(result.documents as Transaction[]);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [userId]);

  return { transactions, loading };
}
```

#### 4.3 Invitations Hook

**File**: `hooks/useInvitations.ts`

**Created**: ✅

```typescript
export function useInvitations(userId: string) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.invitations.documents`, (response) => {
      if (response.events.includes('databases.*.collections.invitations.documents.*.update')) {
        const updatedInvitation = response.payload as Invitation;
        setInvitations((prev) => prev.map((inv) => (inv.$id === updatedInvitation.$id ? updatedInvitation : inv)));
      }
    });

    // Fetch initial invitations
    databases
      .listDocuments(DATABASE_ID, 'invitations', [Query.equal('user_id', userId), Query.orderDesc('created_at')])
      .then((result) => {
        setInvitations(result.documents as Invitation[]);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [userId]);

  return { invitations, loading };
}
```

## Deprecated APIs and Replacements

### Deprecated Server Actions

| Deprecated Action              | Replacement                         | Notes                            |
| ------------------------------ | ----------------------------------- | -------------------------------- |
| `processDueTransactionsAction` | Automatic via Balance Sync Function | Runs daily at 20:00              |
| `reprocessAllBalancesAction`   | Automatic via Balance Sync Function | Triggered on transaction changes |
| `syncAccountBalanceAction`     | Automatic via Balance Sync Function | Event-driven                     |
| `recalculateAllBalancesAction` | Manual trigger in Appwrite Console  | Emergency use only               |

### Deprecated API Routes

| Deprecated Route               | Replacement                     | Notes               |
| ------------------------------ | ------------------------------- | ------------------- |
| `/api/cron/process-recurring`  | Recurring Transactions Function | Runs 1st of month   |
| `/api/cron/expire-invitations` | Expire Invitations Function     | Runs daily at 00:00 |

### Deprecated Services

| Deprecated Method                             | Replacement           | Notes           |
| --------------------------------------------- | --------------------- | --------------- |
| `BalanceSyncService.syncAccountBalance()`     | Balance Sync Function | Event-driven    |
| `BalanceSyncService.processDueTransactions()` | Balance Sync Function | Schedule-driven |
| `BalanceSyncService.recalculateAllBalances()` | Balance Sync Function | Manual trigger  |

## How to Add New Business Logic

### Step 1: Identify the Type

Ask yourself:

- Does it involve calculations? → Appwrite Function
- Does it need to run on a schedule? → Appwrite Function
- Does it need to react to data changes? → Appwrite Function
- Is it a simple CRUD operation? → Next.js API Route

### Step 2: Create Appwrite Function

```bash
# Create function directory
mkdir -p functions/my-new-function/src

# Create package.json
cd functions/my-new-function
npm init -y

# Install dependencies
npm install node-appwrite
```

### Step 3: Implement Function

```typescript
// functions/my-new-function/src/index.ts
import { Client, Databases } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';

function initializeClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const databases = new Databases(client);
  return { client, databases };
}

export default async ({ req, res, log, error }: any) => {
  try {
    log('Function started');
    const { databases } = initializeClient();

    // Your business logic here

    return res.json({
      success: true,
      message: 'Operation completed',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    error('Function error:', err);
    return res.json(
      {
        success: false,
        error: err.message || 'Unknown error',
      },
      500,
    );
  }
};
```

### Step 4: Deploy Function

```bash
# Via Appwrite Console
1. Go to Functions section
2. Click "Create Function"
3. Upload your function code
4. Configure triggers (event or schedule)
5. Set environment variables
6. Deploy
```

### Step 5: Update UI (if needed)

If the function changes data that the UI displays:

```typescript
// Create a custom hook
export function useMyData(userId: string) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.my_collection.documents`, (response) => {
      // Handle update
    });

    return () => unsubscribe();
  }, [userId]);

  return data;
}
```

## Testing After Migration

### 1. Test Transaction Flow

```bash
# Create a transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "direction": "in",
    "account_id": "account-id",
    "date": "2025-11-12"
  }'

# Verify:
# 1. Transaction created in database
# 2. Balance Sync Function triggered (check Appwrite logs)
# 3. Account balance updated
# 4. UI reflects new balance automatically
```

### 2. Test Recurring Transactions

```bash
# Create recurring transaction template
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "direction": "out",
    "account_id": "account-id",
    "is_recurring": true,
    "date": "2025-11-01"
  }'

# Manually trigger function in Appwrite Console
# Or wait for 1st of month

# Verify:
# 1. New transaction created for current month
# 2. recurring_parent_id set correctly
# 3. UI shows new transaction automatically
```

### 3. Test Invitation Expiration

```bash
# Create invitation with past expiration date
curl -X POST http://localhost:3000/api/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "expires_at": "2025-01-01T00:00:00.000Z"
  }'

# Manually trigger function in Appwrite Console
# Or wait for daily schedule

# Verify:
# 1. Invitation status changed to "expired"
# 2. UI reflects expired status automatically
```

## Rollback Plan

If issues arise:

### Option 1: Keep Old Code Temporarily

```typescript
// Feature flag approach
const USE_APPWRITE_FUNCTIONS = process.env.USE_APPWRITE_FUNCTIONS === 'true';

export async function POST(request: NextRequest) {
  const transaction = await transactionService.create(data);

  if (!USE_APPWRITE_FUNCTIONS) {
    // Old behavior - manual balance sync
    await balanceSyncService.syncAccountBalance(data.accountId);
  }

  return NextResponse.json({ data: transaction });
}
```

### Option 2: Re-enable Cron Routes

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-recurring",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

### Option 3: Disable Appwrite Functions

In Appwrite Console:

1. Go to Functions
2. Disable the problematic function
3. Re-enable Next.js cron routes
4. Investigate and fix the issue

## Common Issues and Solutions

### Issue: Balance Not Updating

**Symptoms:**

- Transaction created but balance stays the same
- No errors in UI

**Solutions:**

1. Check Balance Sync Function logs in Appwrite Console
2. Verify event triggers are configured correctly
3. Manually trigger the function to test
4. Check account permissions

### Issue: UI Not Updating Automatically

**Symptoms:**

- Data changes but UI requires manual refresh
- No realtime updates

**Solutions:**

1. Check Realtime subscription is active
2. Verify WebSocket connection in browser DevTools
3. Check subscription channel matches database collection
4. Verify user has read permissions for the data

### Issue: Function Not Triggering

**Symptoms:**

- Function doesn't execute on schedule or event
- No logs in Appwrite Console

**Solutions:**

1. Verify function is deployed and active
2. Check trigger configuration (event or schedule)
3. Verify environment variables are set
4. Check function execution history

### Issue: Duplicate Transactions

**Symptoms:**

- Recurring transactions created multiple times
- Balance calculated incorrectly

**Solutions:**

1. Check Recurring Transactions Function logic
2. Verify duplicate prevention is working
3. Check for race conditions
4. Review function logs for errors

## Performance Considerations

### Cold Starts

- First execution after idle: 1-3 seconds
- Subsequent executions: < 100ms
- Keep functions lightweight

### Realtime Subscriptions

- WebSocket connections are persistent
- Minimal latency (< 1 second)
- Automatic reconnection

### Database Operations

- Use indexes for frequently queried fields
- Implement pagination for large datasets
- Monitor query performance

## Security Considerations

### Appwrite Functions

- Run with API key permissions (full access)
- Validate all inputs
- Log sensitive operations
- Use environment variables for secrets

### Next.js API Routes

- Maintain authentication checks
- Validate user permissions
- Sanitize inputs
- Rate limit endpoints

### Realtime Subscriptions

- Respect Appwrite permissions
- Users can only subscribe to accessible data
- Monitor for abuse

## Monitoring and Maintenance

### Monitor Function Executions

1. Check Appwrite Console regularly
2. Review function logs for errors
3. Monitor execution times
4. Track error rates

### Set Up Alerts

- Function failures
- Execution timeouts
- High error rates
- Performance degradation

### Regular Maintenance

- Review and optimize function code
- Update dependencies
- Monitor database performance
- Clean up old logs

## Additional Resources

- [Serverless Architecture Documentation](./SERVERLESS_ARCHITECTURE.md)
- [Appwrite Functions Documentation](https://appwrite.io/docs/functions)
- [Appwrite Realtime Documentation](https://appwrite.io/docs/realtime)
- [Balance Sync Function README](../functions/balance-sync/README.md)
- [Recurring Transactions Function README](../functions/recurring-transactions/README.md)
- [Expire Invitations Function README](../functions/expire-invitations/README.md)

## Summary

The migration to serverless architecture provides:

✅ **Clear separation** between presentation and business logic  
✅ **Automatic processing** via event and schedule triggers  
✅ **Real-time updates** without manual refresh  
✅ **Better scalability** with independent function scaling  
✅ **Improved maintainability** with focused, single-purpose functions

All business logic now lives in Appwrite Functions, while Next.js focuses purely on UI and CRUD operations. The UI stays in sync automatically through Appwrite Realtime subscriptions.
