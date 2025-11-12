# Serverless Architecture

## Overview

This application follows a **serverless-first architecture** where Next.js serves purely as a presentation layer performing CRUD operations, while Appwrite Functions handle all business logic, calculations, and scheduled tasks. The UI updates reactively through Appwrite Realtime subscriptions.

## Architecture Principles

### Separation of Concerns

1. **Next.js Application (Presentation Layer)**
   - UI rendering and user interactions
   - Basic CRUD operations (Create, Read, Update, Delete)
   - Client-side state management
   - Realtime subscriptions for automatic UI updates

2. **Appwrite Functions (Business Logic Layer)**
   - All calculations and data transformations
   - Scheduled tasks (cron jobs)
   - Event-driven processing
   - Complex business rules

3. **Appwrite Database (Data Layer)**
   - Persistent data storage
   - Real-time change notifications
   - Access control and permissions

## Architecture Diagram

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
                    │  └─ expire-invitations                    │
                    │      └─ Schedule: Daily at 00:00          │
                    └──────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Transaction Creation

```
User Action → Next.js UI → API Route → Database
                                          │
                                          ▼
                              Appwrite Event Trigger
                                          │
                                          ▼
                              Balance Sync Function
                                          │
                                          ▼
                              Update Account Balance
                                          │
                                          ▼
                              Realtime Notification
                                          │
                                          ▼
                              Next.js UI Auto-Updates
```

**Step-by-step:**

1. User creates a transaction via the UI
2. Next.js API route receives the request
3. API route performs CRUD operation (INSERT into database)
4. API route returns immediately with success response
5. Appwrite detects database change via event trigger
6. Balance Sync Function executes automatically
7. Function calculates new account balance
8. Function updates account balance in database
9. Appwrite Realtime pushes update to subscribed clients
10. Next.js UI automatically reflects new balance (no refresh needed)

### Example 2: Scheduled Task (Recurring Transactions)

```
Schedule Trigger (1st of month) → Appwrite Function
                                          │
                                          ▼
                              Query Recurring Templates
                                          │
                                          ▼
                              Create New Transactions
                                          │
                                          ▼
                              Realtime Notification
                                          │
                                          ▼
                              Next.js UI Auto-Updates
```

**Step-by-step:**

1. Appwrite schedule trigger fires on 1st of month at 00:00
2. Recurring Transactions Function executes
3. Function queries all recurring transaction templates
4. Function creates new transactions for current month
5. Appwrite Realtime pushes new transactions to subscribed clients
6. Next.js UI automatically shows new transactions
7. Balance Sync Function triggers for each new transaction
8. Account balances update automatically

## Appwrite Functions

### 1. Balance Sync Function

**Purpose:** Automatically calculate and update account balances based on transaction changes

**Location:** `functions/balance-sync/`

**Triggers:**

- **Event Triggers:**
  - `databases.*.collections.transactions.documents.*.create`
  - `databases.*.collections.transactions.documents.*.update`
  - `databases.*.collections.transactions.documents.*.delete`
- **Schedule Trigger:** `0 20 * * *` (Daily at 20:00)

**Behavior:**

- On transaction create/update/delete: Recalculates affected account balance
- On schedule: Processes all due transactions (future transactions that reached their date)
- Ignores credit card transactions
- Ignores future transactions
- Updates account balance field in database

**Environment Variables:**

- `APPWRITE_ENDPOINT`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_API_KEY`

### 2. Recurring Transactions Function

**Purpose:** Create new transactions for recurring transaction templates

**Location:** `functions/recurring-transactions/`

**Triggers:**

- **Schedule Trigger:** `0 0 1 * *` (1st of month at 00:00)

**Behavior:**

- Queries all transactions with `is_recurring: true`
- Creates new transactions for current month
- Sets `recurring_parent_id` to reference original transaction
- Prevents duplicate transactions for same month

**Environment Variables:**

- `APPWRITE_ENDPOINT`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_API_KEY`

### 3. Expire Invitations Function

**Purpose:** Mark old pending invitations as expired

**Location:** `functions/expire-invitations/`

**Triggers:**

- **Schedule Trigger:** `0 0 * * *` (Daily at 00:00)

**Behavior:**

- Queries all pending invitations
- Filters invitations where `expires_at < now()`
- Updates filtered invitations to status "expired"
- Returns count of expired invitations

**Environment Variables:**

- `APPWRITE_ENDPOINT`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_API_KEY`

## When to Use Next.js vs Appwrite Functions

### Use Next.js For:

✅ **UI Rendering**

- React components
- Page layouts
- Client-side routing

✅ **Basic CRUD Operations**

- Creating records
- Reading/fetching data
- Updating records
- Deleting records

✅ **User Input Handling**

- Form submissions
- Validation (client-side)
- User interactions

✅ **Realtime Subscriptions**

- Subscribing to data changes
- Updating UI automatically

### Use Appwrite Functions For:

✅ **Business Logic**

- Calculations (balances, totals, etc.)
- Data transformations
- Complex validations

✅ **Scheduled Tasks**

- Recurring operations
- Cleanup tasks
- Batch processing

✅ **Event-Driven Processing**

- Automatic reactions to data changes
- Cascading updates
- Side effects

✅ **Background Jobs**

- Long-running operations
- Asynchronous processing
- External API calls

### Decision Tree

```
Does it involve calculations or transformations?
├─ YES → Use Appwrite Function
└─ NO → Continue

Does it need to run on a schedule?
├─ YES → Use Appwrite Function
└─ NO → Continue

Does it need to react to database changes automatically?
├─ YES → Use Appwrite Function
└─ NO → Continue

Is it a simple CRUD operation?
├─ YES → Use Next.js API Route
└─ NO → Use Appwrite Function
```

## Realtime Updates

### How It Works

1. **Subscribe:** Next.js components subscribe to Appwrite Realtime channels
2. **Change:** Data changes in database (via API or Function)
3. **Notify:** Appwrite pushes notification to subscribed clients
4. **Update:** React components update state and re-render

### Example: Account Balance Hook

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
    databases
      .getDocument(DATABASE_ID, 'accounts', accountId)
      .then((account) => {
        setBalance(account.balance);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch account balance:', error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [accountId]);

  return { balance, loading };
}
```

### Example: Transaction List Hook

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
      })
      .catch((error) => {
        console.error('Failed to fetch transactions:', error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [userId]);

  return { transactions, loading };
}
```

## Adding New Business Logic

### Step 1: Identify the Type of Logic

- **Calculation?** → Appwrite Function
- **Scheduled task?** → Appwrite Function
- **Event-driven?** → Appwrite Function
- **Simple CRUD?** → Next.js API Route

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

### Step 3: Implement Function Logic

```typescript
// functions/my-new-function/src/index.ts
import { Client, Databases } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';

function initializeClient(): { client: Client; databases: Databases } {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const databases = new Databases(client);
  return { client, databases };
}

export default async ({ req, res, log, error }: any) => {
  try {
    log('My New Function started');
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

# Via Appwrite CLI
appwrite functions create \
  --functionId my-new-function \
  --name "My New Function" \
  --runtime node-18.0

appwrite functions createDeployment \
  --functionId my-new-function \
  --entrypoint src/index.ts \
  --code .
```

### Step 5: Update UI (if needed)

If the function changes data that the UI displays, add a Realtime subscription:

```typescript
// In your React component
useEffect(() => {
  const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.my_collection.documents`, (response) => {
    // Handle update
  });

  return () => unsubscribe();
}, []);
```

## Best Practices

### 1. Keep Next.js Pure

❌ **Don't:**

```typescript
// API Route
export async function POST(request: NextRequest) {
  const transaction = await createTransaction(data);
  await calculateBalance(transaction.accountId); // ❌ Business logic
  await sendNotification(transaction.userId); // ❌ Side effect
  return NextResponse.json({ data: transaction });
}
```

✅ **Do:**

```typescript
// API Route
export async function POST(request: NextRequest) {
  const transaction = await createTransaction(data);
  return NextResponse.json({ data: transaction });
  // Balance calculation happens automatically via Appwrite Function
}
```

### 2. Use Event Triggers for Automatic Processing

❌ **Don't:**

```typescript
// Manually trigger function after every operation
await createTransaction(data);
await fetch('/api/functions/balance-sync', { method: 'POST' });
```

✅ **Do:**

```typescript
// Let Appwrite event triggers handle it automatically
await createTransaction(data);
// Balance Sync Function triggers automatically on database change
```

### 3. Handle Errors Gracefully

```typescript
export default async ({ req, res, log, error }: any) => {
  try {
    // Function logic
  } catch (err: any) {
    error('Function error:', err);

    // Return structured error response
    return res.json(
      {
        success: false,
        error: err.message,
        code: err.code || 'UNKNOWN_ERROR',
      },
      500,
    );
  }
};
```

### 4. Use Pagination for Large Datasets

```typescript
async function processAllRecords(databases: Databases) {
  let offset = 0;
  const limit = 100;

  while (true) {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (result.documents.length === 0) break;

    // Process batch
    for (const doc of result.documents) {
      await processDocument(doc);
    }

    if (result.documents.length < limit) break;
    offset += limit;
  }
}
```

### 5. Monitor Function Executions

- Check Appwrite Console for function logs
- Set up alerts for function failures
- Monitor execution times
- Track error rates

## Performance Considerations

### Cold Starts

- Appwrite Functions may experience cold starts (first execution after idle period)
- Typical cold start: 1-3 seconds
- Subsequent executions are fast (< 100ms)
- Keep functions lightweight to minimize cold start impact

### Realtime Subscriptions

- WebSocket connections are persistent
- Minimal latency for updates (typically < 1 second)
- Automatic reconnection on network issues
- Subscription limits per connection (check Appwrite docs)

### Database Operations

- Use indexes for frequently queried fields
- Implement pagination for large datasets
- Monitor query performance in Appwrite Console
- Consider caching for read-heavy operations

## Security

### Appwrite Functions

- Functions run with API key permissions (full access)
- Validate all inputs even though functions are internal
- Log sensitive operations for audit trail
- Use environment variables for secrets
- Never expose API keys in client-side code

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

## Troubleshooting

### Function Not Triggering

1. Check function deployment status in Appwrite Console
2. Verify event trigger configuration matches database events
3. Check function logs for errors
4. Verify environment variables are set correctly

### UI Not Updating

1. Check Realtime subscription is active
2. Verify subscription channel matches database collection
3. Check browser console for WebSocket errors
4. Test with manual database changes in Appwrite Console

### Balance Calculation Issues

1. Check Balance Sync Function logs
2. Verify transaction data is correct
3. Test function manually with sample data
4. Check for race conditions (multiple updates at once)

## Migration from Monolithic to Serverless

See [MIGRATION_TO_SERVERLESS.md](./MIGRATION_TO_SERVERLESS.md) for detailed migration guide.

## Additional Resources

- [Appwrite Functions Documentation](https://appwrite.io/docs/functions)
- [Appwrite Realtime Documentation](https://appwrite.io/docs/realtime)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Function READMEs](../functions/)
  - [Balance Sync Function](../functions/balance-sync/README.md)
  - [Recurring Transactions Function](../functions/recurring-transactions/README.md)
  - [Expire Invitations Function](../functions/expire-invitations/README.md)
