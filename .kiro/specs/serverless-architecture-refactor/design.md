# Design Document

## Overview

This design document outlines the architecture refactoring to move all business logic from Next.js to Appwrite Functions, establishing a clean separation where Next.js serves purely as a presentation layer performing CRUD operations, while Appwrite Functions handle all business logic, calculations, and scheduled tasks. The UI will update reactively through Appwrite Realtime subscriptions.

## Architecture

### Current Architecture (Before Refactoring)

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Application                   │
├─────────────────────────────────────────────────────────────┤
│  UI Components                                               │
│  ├─ React Components                                         │
│  └─ Client-side State Management                            │
├─────────────────────────────────────────────────────────────┤
│  API Routes (app/api/)                                       │
│  ├─ /api/transactions (CRUD + Balance Calculation)          │
│  ├─ /api/cron/process-recurring (Business Logic)            │
│  └─ /api/cron/expire-invitations (Business Logic)           │
├─────────────────────────────────────────────────────────────┤
│  Server Actions (actions/)                                   │
│  ├─ transaction.actions.ts (CRUD + Balance Logic)           │
│  └─ balance-sync.actions.ts (Manual Recalculation)          │
├─────────────────────────────────────────────────────────────┤
│  Services (lib/services/)                                    │
│  ├─ TransactionService (CRUD + Balance Updates)             │
│  ├─ BalanceSyncService (Balance Calculations)               │
│  └─ InvitationService (CRUD + Expiration Logic)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Appwrite Cloud  │
                    │   - Database     │
                    │   - Functions    │
                    └──────────────────┘
```

### Target Architecture (After Refactoring)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                   (Presentation Layer)                       │
├─────────────────────────────────────────────────────────────┤
│  UI Components                                               │
│  ├─ React Components                                         │
│  ├─ Realtime Subscriptions (Auto-update)                    │
│  └─ Client-side State Management                            │
├─────────────────────────────────────────────────────────────┤
│  API Routes (app/api/) - PURE CRUD ONLY                     │
│  ├─ /api/transactions (GET, POST, PUT, DELETE)              │
│  ├─ /api/invitations (GET, POST, PUT, DELETE)               │
│  └─ /api/accounts (GET, POST, PUT, DELETE)                  │
├─────────────────────────────────────────────────────────────┤
│  Server Actions (actions/) - PURE CRUD ONLY                  │
│  ├─ transaction.actions.ts (CRUD operations only)           │
│  ├─ invitation.actions.ts (CRUD operations only)            │
│  └─ account.actions.ts (CRUD operations only)               │
├─────────────────────────────────────────────────────────────┤
│  Services (lib/services/) - PURE CRUD ONLY                   │
│  ├─ TransactionService (Database operations only)           │
│  ├─ InvitationService (Database operations only)            │
│  └─ AccountService (Database operations only)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────────────────┐
                    │         Appwrite Cloud                    │
                    ├──────────────────────────────────────────┤
                    │  Database                                 │
                    │  ├─ transactions collection               │
                    │  ├─ accounts collection                   │
                    │  └─ invitations collection                │
                    ├──────────────────────────────────────────┤
                    │  Realtime (WebSocket)                     │
                    │  └─ Pushes changes to Next.js UI         │
                    ├──────────────────────────────────────────┤
                    │  Functions (Business Logic Layer)         │
                    │  ├─ balance-sync                          │
                    │  │   ├─ Event: transaction.*.create       │
                    │  │   ├─ Event: transaction.*.update       │
                    │  │   ├─ Event: transaction.*.delete       │
                    │  │   └─ Schedule: Daily at 20:00          │
                    │  ├─ recurring-transactions                │
                    │  │   └─ Schedule: 1st of month at 00:00   │
                    │  └─ expire-invitations (NEW)              │
                    │      └─ Schedule: Daily at 00:00          │
                    └──────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Appwrite Functions

#### 1.1 Balance Sync Function (Existing - Verify Configuration)

**Location:** `functions/balance-sync/src/index.ts`

**Purpose:** Automatically calculate and update account balances based on transaction changes

**Triggers:**

- Database Events:
  - `databases.*.collections.transactions.documents.*.create`
  - `databases.*.collections.transactions.documents.*.update`
  - `databases.*.collections.transactions.documents.*.delete`
- Schedule: `0 20 * * *` (Daily at 20:00)

**Input (Event Trigger):**

```typescript
interface TransactionEvent {
  $id: string;
  user_id: string;
  account_id?: string;
  credit_card_id?: string;
  amount: number;
  direction: 'in' | 'out';
  date: string;
  status: string;
}
```

**Input (Schedule Trigger):**

```typescript
// No input - processes all users
```

**Output:**

```typescript
interface BalanceSyncResponse {
  success: boolean;
  message: string;
  accountId?: string;
  newBalance?: number;
  accountsProcessed?: number;
  timestamp: string;
}
```

**Logic:**

1. On event trigger: Recalculate balance for the affected account
2. On schedule trigger: Process all due transactions (future transactions that reached their date)
3. Ignore credit card transactions
4. Ignore future transactions
5. Update account balance field in database

#### 1.2 Recurring Transactions Function (Existing - Verify Configuration)

**Location:** `functions/recurring-transactions/src/index.ts`

**Purpose:** Create new transactions for recurring transaction templates

**Triggers:**

- Schedule: `0 0 1 * *` (1st day of each month at 00:00)

**Input:**

```typescript
// No input - processes all recurring transactions
```

**Output:**

```typescript
interface RecurringTransactionsResponse {
  success: boolean;
  message: string;
  transactionsCreated: number;
  timestamp: string;
}
```

**Logic:**

1. Query all transactions with `is_recurring: true`
2. For each recurring transaction:
   - Calculate next occurrence date (same day, current month)
   - Check if transaction already exists for current month
   - Create new transaction if not exists
   - Set `is_recurring: false` on new transaction
   - Set `recurring_parent_id` to reference original transaction
3. Return count of created transactions

#### 1.3 Expire Invitations Function (NEW)

**Location:** `functions/expire-invitations/src/index.ts`

**Purpose:** Mark old pending invitations as expired

**Triggers:**

- Schedule: `0 0 * * *` (Daily at 00:00)

**Input:**

```typescript
// No input - processes all pending invitations
```

**Output:**

```typescript
interface ExpireInvitationsResponse {
  success: boolean;
  message: string;
  expiredCount: number;
  timestamp: string;
}
```

**Logic:**

1. Query all invitations with status "pending"
2. Filter invitations where `expires_at < now()`
3. Update filtered invitations to status "expired"
4. Return count of expired invitations

**Implementation:**

```typescript
import { Client, Databases, Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const INVITATIONS_COLLECTION = 'invitations';

interface Invitation {
  $id: string;
  status: string;
  expires_at: string;
}

function initializeClient(): { client: Client; databases: Databases } {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const databases = new Databases(client);
  return { client, databases };
}

async function expireOldInvitations(databases: Databases): Promise<number> {
  const now = new Date().toISOString();
  let expiredCount = 0;
  let offset = 0;
  const limit = 100;

  while (true) {
    const result = await databases.listDocuments(DATABASE_ID, INVITATIONS_COLLECTION, [
      Query.equal('status', 'pending'),
      Query.lessThan('expires_at', now),
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (result.documents.length === 0) break;

    for (const invitation of result.documents) {
      await databases.updateDocument(DATABASE_ID, INVITATIONS_COLLECTION, invitation.$id, { status: 'expired' });
      expiredCount++;
    }

    if (result.documents.length < limit) break;
    offset += limit;
  }

  return expiredCount;
}

export default async ({ req, res, log, error }: any) => {
  try {
    log('Expire Invitations Function started');
    const { databases } = initializeClient();
    const expiredCount = await expireOldInvitations(databases);

    return res.json({
      success: true,
      message: `Successfully expired ${expiredCount} invitation(s)`,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    error('Expire Invitations Function error:', err);
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

### 2. Next.js API Routes (Refactored to Pure CRUD)

#### 2.1 Transaction API Routes

**Location:** `app/api/transactions/route.ts`

**Changes:**

- Remove all balance calculation logic
- Remove calls to `BalanceSyncService`
- Keep only database CRUD operations
- Return immediately after database operation

**Before:**

```typescript
// Create transaction AND update balance
const transaction = await transactionService.createManualTransaction(data);
await balanceSyncService.syncAccountBalance(data.accountId); // ❌ Remove this
return NextResponse.json({ data: transaction });
```

**After:**

```typescript
// Create transaction ONLY - balance updated by Appwrite Function
const transaction = await transactionService.createManualTransaction(data);
return NextResponse.json({ data: transaction });
// Balance Sync Function will handle balance update via event trigger
```

#### 2.2 Remove Cron API Routes

**Files to Delete:**

- `app/api/cron/process-recurring/route.ts`
- `app/api/cron/expire-invitations/route.ts`

**Reason:** These are replaced by Appwrite Functions with schedule triggers

### 3. Next.js Server Actions (Refactored to Pure CRUD)

#### 3.1 Transaction Actions

**Location:** `actions/transaction.actions.ts`

**Changes:**

- Remove `processDueTransactionsAction` - handled by Balance Sync Function schedule
- Remove `reprocessAllBalancesAction` - or make it trigger the Appwrite Function
- Keep only CRUD actions: create, update, delete, get, list

**Deprecated Actions:**

```typescript
/**
 * @deprecated Balance sync is now handled automatically by Appwrite Functions
 * This action is kept for emergency manual recalculation only
 */
export async function reprocessAllBalancesAction(): Promise<{ success: boolean; message: string }> {
  // Option 1: Remove entirely
  // Option 2: Keep but trigger Appwrite Function instead
  return {
    success: false,
    message:
      'Balance sync is now automatic via Appwrite Functions. Use the Appwrite Console to manually trigger if needed.',
  };
}
```

#### 3.2 Balance Sync Actions

**Location:** `actions/balance-sync.actions.ts`

**Changes:**

- Mark all actions as deprecated
- Add clear migration messages
- Optionally keep `syncAccountBalanceAction` to manually trigger the Appwrite Function

**Implementation:**

```typescript
/**
 * @deprecated Balance sync is now automatic via Appwrite Functions
 * Use this only for emergency manual recalculation
 */
export async function syncAccountBalanceAction(accountId: string): Promise<BalanceSyncActionState> {
  try {
    await requireAuth();

    // Option: Trigger Appwrite Function manually
    // const response = await fetch(`${APPWRITE_ENDPOINT}/functions/${BALANCE_SYNC_FUNCTION_ID}/executions`, {
    //   method: 'POST',
    //   headers: { 'X-Appwrite-Key': API_KEY },
    //   body: JSON.stringify({ accountId })
    // });

    return {
      success: false,
      message: 'Balance sync is now automatic. Changes will reflect within seconds via Appwrite Functions.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync balance',
    };
  }
}
```

### 4. Services Layer (Refactored to Pure CRUD)

#### 4.1 Transaction Service

**Location:** `lib/services/transaction.service.ts`

**Changes:**

- Remove all balance calculation logic
- Remove calls to `BalanceSyncService`
- Keep only database operations

#### 4.2 Balance Sync Service

**Location:** `lib/services/balance-sync.service.ts`

**Options:**

1. **Delete entirely** - all logic moved to Appwrite Function
2. **Keep as deprecated** - mark all methods as deprecated with migration notes
3. **Keep minimal version** - only for emergency manual operations

**Recommendation:** Keep as deprecated with clear documentation

### 5. Realtime UI Updates

#### 5.1 Account Balance Updates

**Location:** UI components that display account balances

**Implementation:**

```typescript
import { client, databases } from '@/lib/appwrite/client';
import { useEffect, useState } from 'react';

export function useAccountBalance(accountId: string) {
  const [balance, setBalance] = useState<number>(0);

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
    databases.getDocument(DATABASE_ID, 'accounts', accountId).then((account) => setBalance(account.balance));

    return () => unsubscribe();
  }, [accountId]);

  return balance;
}
```

#### 5.2 Transaction List Updates

**Location:** UI components that display transaction lists

**Implementation:**

```typescript
export function useTransactions(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Subscribe to transaction collection changes
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.transactions.documents`, (response) => {
      const events = response.events;

      if (events.includes('databases.*.collections.transactions.documents.*.create')) {
        // Add new transaction
        const newTransaction = response.payload as Transaction;
        if (newTransaction.user_id === userId) {
          setTransactions((prev) => [newTransaction, ...prev]);
        }
      } else if (events.includes('databases.*.collections.transactions.documents.*.update')) {
        // Update existing transaction
        const updatedTransaction = response.payload as Transaction;
        setTransactions((prev) => prev.map((t) => (t.$id === updatedTransaction.$id ? updatedTransaction : t)));
      } else if (events.includes('databases.*.collections.transactions.documents.*.delete')) {
        // Remove deleted transaction
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
      .then((result) => setTransactions(result.documents as Transaction[]));

    return () => unsubscribe();
  }, [userId]);

  return transactions;
}
```

#### 5.3 Invitation Status Updates

**Location:** UI components that display invitations

**Implementation:**

```typescript
export function useInvitations(userId: string) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);

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
      .then((result) => setInvitations(result.documents as Invitation[]));

    return () => unsubscribe();
  }, [userId]);

  return invitations;
}
```

## Data Models

### Transaction Model (No Changes)

```typescript
interface Transaction {
  $id: string;
  user_id: string;
  account_id?: string;
  credit_card_id?: string;
  amount: number;
  direction: 'in' | 'out';
  type: 'income' | 'expense' | 'transfer' | 'salary';
  category?: string;
  description?: string;
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  is_recurring: boolean;
  recurring_parent_id?: string;
  created_at: string;
  updated_at: string;
}
```

### Account Model (No Changes)

```typescript
interface Account {
  $id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number; // Updated by Balance Sync Function
  currency: string;
  synced_transaction_ids?: string; // Tracking field for Balance Sync Function
  created_at: string;
  updated_at: string;
}
```

### Invitation Model (No Changes)

```typescript
interface Invitation {
  $id: string;
  user_id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Appwrite Functions Error Handling

All Appwrite Functions should follow this pattern:

```typescript
export default async ({ req, res, log, error }: any) => {
  try {
    log('Function started');

    // Function logic here

    return res.json({
      success: true,
      message: 'Operation completed',
      // ... other data
    });
  } catch (err: any) {
    error('Function error:', err);
    return res.json(
      {
        success: false,
        error: err.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      500,
    );
  }
};
```

### Next.js API Error Handling

Keep existing error handling for CRUD operations:

```typescript
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // CRUD operation
    const result = await service.create(data);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Operation failed',
      },
      { status: 500 },
    );
  }
}
```

### Realtime Subscription Error Handling

```typescript
useEffect(() => {
  const unsubscribe = client.subscribe(channel, (response) => {
    try {
      // Handle update
    } catch (error) {
      console.error('Realtime update error:', error);
      // Optionally show user notification
    }
  });

  return () => {
    try {
      unsubscribe();
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  };
}, [dependencies]);
```

## Testing Strategy

### 1. Appwrite Functions Testing

#### Unit Tests

- Test individual functions (syncAccountBalance, expireOldInvitations, etc.)
- Mock Appwrite SDK calls
- Verify correct calculations and logic

#### Integration Tests

- Test functions with real Appwrite database (test environment)
- Verify event triggers work correctly
- Verify schedule triggers execute as expected

#### Manual Testing

- Execute functions manually via Appwrite Console
- Verify logs and outputs
- Test with various data scenarios

### 2. Next.js API Testing

#### Unit Tests

- Test API routes return correct responses
- Test validation logic
- Test error handling

#### Integration Tests

- Test full CRUD flow
- Verify no business logic is executed
- Verify responses are immediate

### 3. Realtime Updates Testing

#### Manual Testing

- Create/update/delete records via API
- Verify UI updates automatically
- Test with multiple browser tabs
- Test reconnection after network interruption

#### Automated Tests

- Mock Appwrite Realtime events
- Verify React hooks update state correctly
- Test subscription cleanup on unmount

### 4. End-to-End Testing

#### Scenarios to Test

1. **Transaction Creation Flow**
   - User creates transaction via UI
   - Transaction saved to database
   - Balance Sync Function triggered
   - Account balance updated
   - UI reflects new balance automatically

2. **Recurring Transaction Flow**
   - Wait for 1st of month (or manually trigger function)
   - Recurring Transactions Function executes
   - New transactions created
   - Balance Sync Function triggered for each
   - UI shows new transactions automatically

3. **Invitation Expiration Flow**
   - Create invitation with past expiration date
   - Wait for daily schedule (or manually trigger function)
   - Expire Invitations Function executes
   - Invitation status updated to expired
   - UI reflects expired status automatically

## Migration Strategy

### Phase 1: Verify Existing Functions

1. Verify Balance Sync Function is deployed and configured
2. Verify Recurring Transactions Function is deployed and configured
3. Test both functions manually
4. Monitor logs for any errors

### Phase 2: Create New Function

1. Create Expire Invitations Function
2. Deploy to Appwrite
3. Configure schedule trigger
4. Test manually
5. Monitor first scheduled execution

### Phase 3: Refactor Next.js Code

1. Remove business logic from transaction API routes
2. Remove business logic from transaction actions
3. Deprecate balance sync actions
4. Remove cron API routes
5. Update vercel.json to remove cron configurations

### Phase 4: Implement Realtime Updates

1. Create custom hooks for realtime subscriptions
2. Update UI components to use hooks
3. Test automatic updates
4. Handle edge cases (reconnection, errors)

### Phase 5: Clean Up

1. Delete deprecated code
2. Update documentation
3. Remove unused dependencies
4. Final testing

### Phase 6: Monitor and Optimize

1. Monitor Appwrite Function executions
2. Check for errors or performance issues
3. Optimize if needed
4. Document any issues and solutions

## Rollback Plan

If issues arise during migration:

1. **Keep Next.js cron routes temporarily** - Don't delete until Appwrite Functions are proven stable
2. **Feature flags** - Use environment variables to toggle between old and new behavior
3. **Gradual rollout** - Test with subset of users first
4. **Monitoring** - Set up alerts for function failures
5. **Quick revert** - Keep ability to re-enable Next.js cron routes via vercel.json

## Performance Considerations

### Appwrite Functions

- Functions execute in isolated containers
- Cold starts may add latency (first execution after idle period)
- Schedule triggers are reliable but not real-time
- Event triggers execute within seconds of database change

### Realtime Subscriptions

- WebSocket connections are persistent
- Minimal latency for updates (typically < 1 second)
- Automatic reconnection on network issues
- Subscription limits per connection (check Appwrite docs)

### Database Operations

- Balance calculations may query many transactions
- Use pagination for large datasets
- Consider indexing frequently queried fields
- Monitor query performance in Appwrite Console

## Security Considerations

### Appwrite Functions

- Functions run with API key permissions (full access)
- Validate all inputs even though functions are internal
- Log sensitive operations for audit trail
- Use environment variables for secrets

### Next.js API Routes

- Maintain authentication checks
- Validate user permissions for CRUD operations
- Sanitize inputs to prevent injection attacks
- Rate limit API endpoints

### Realtime Subscriptions

- Subscriptions respect Appwrite permissions
- Users can only subscribe to data they have access to
- No additional security needed if permissions are correct
- Monitor for subscription abuse

## Documentation Updates Needed

1. **README.md** - Update architecture overview
2. **functions/expire-invitations/README.md** - Create documentation for new function
3. **docs/ARCHITECTURE.md** - Update with serverless architecture diagram
4. **docs/DEVELOPMENT.md** - Update development workflow
5. **API documentation** - Update to reflect CRUD-only nature
6. **Deployment guide** - Add Appwrite Functions deployment steps
