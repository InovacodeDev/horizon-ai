# useTransactions Hook - Realtime Updates

## Overview

The `useTransactions` hook provides real-time transaction management with automatic UI updates via Appwrite Realtime subscriptions. This hook implements the serverless architecture pattern where the UI automatically reflects changes made by Appwrite Functions without manual refresh.

## Features

- **Automatic Realtime Updates**: Subscribes to transaction collection changes via Appwrite Realtime
- **Granular Event Handling**: Handles create, update, and delete events separately for optimal performance
- **Optimistic Updates**: Provides instant UI feedback using React 19's `useOptimistic` hook
- **User Filtering**: Only processes events for the current user's transactions
- **Cache Management**: Automatically invalidates cache when transactions change
- **Duplicate Prevention**: Prevents duplicate transactions in the UI

## Usage

### Basic Usage

```typescript
import { useTransactions } from '@/hooks/useTransactions';

function TransactionsPage() {
  const {
    transactions,      // Array of transactions with realtime updates
    loading,          // Loading state
    error,            // Error state
    createTransaction, // Create a new transaction
    updateTransaction, // Update an existing transaction
    deleteTransaction, // Delete a transaction
    refetch           // Manually refetch transactions
  } = useTransactions({
    userId: 'user-id'
  });

  return (
    <div>
      {transactions.map(tx => (
        <div key={tx.$id}>{tx.description}</div>
      ))}
    </div>
  );
}
```

### With Initial Data (SSR)

```typescript
function TransactionsPage({ initialTransactions, initialTotal }) {
  const { transactions } = useTransactions({
    userId: 'user-id',
    initialTransactions,
    initialTotal,
  });

  // Transactions will start with initial data and update in realtime
}
```

## Realtime Event Handling

The hook subscribes to the following Appwrite Realtime events:

### Create Events

- **Event**: `databases.*.collections.transactions.documents.*.create`
- **Behavior**: Adds new transaction to the top of the list
- **Deduplication**: Checks if transaction already exists before adding

### Update Events

- **Event**: `databases.*.collections.transactions.documents.*.update`
- **Behavior**: Updates the existing transaction in place

### Delete Events

- **Event**: `databases.*.collections.transactions.documents.*.delete`
- **Behavior**: Removes transaction from the list

## Testing Realtime Updates

### Manual Testing

1. **Open two browser tabs** with the transactions page
2. **Create a transaction** in one tab
3. **Verify** the transaction appears automatically in the other tab
4. **Update a transaction** in one tab
5. **Verify** the changes appear automatically in the other tab
6. **Delete a transaction** in one tab
7. **Verify** it disappears automatically in the other tab

### Testing with Appwrite Functions

1. **Trigger Balance Sync Function** via Appwrite Console
2. **Verify** account balances update automatically in the UI
3. **Create a recurring transaction** and wait for scheduled execution
4. **Verify** new transactions appear automatically when created by the function

### Testing Network Interruption

1. **Open DevTools** and go to Network tab
2. **Throttle network** to "Offline"
3. **Wait a few seconds**
4. **Restore network** connection
5. **Verify** realtime subscription reconnects automatically
6. **Make a change** in another tab
7. **Verify** changes sync after reconnection

## Architecture

### Serverless Pattern

The hook follows the serverless architecture pattern:

```
User Action → Next.js API (CRUD only) → Appwrite Database
                                              ↓
                                    Appwrite Function (Business Logic)
                                              ↓
                                    Database Update
                                              ↓
                                    Realtime Event
                                              ↓
                                    useTransactions Hook
                                              ↓
                                    UI Update (Automatic)
```

### Example Flow: Creating a Transaction

1. User clicks "Add Transaction"
2. `createTransaction()` sends POST to `/api/transactions`
3. API creates transaction record (no balance calculation)
4. Appwrite Balance Sync Function detects create event
5. Function calculates and updates account balance
6. Balance update triggers realtime event
7. `useAccountBalance` hook receives event and updates UI
8. Transaction list also updates via its own realtime subscription

## Performance Considerations

### Optimistic Updates

The hook uses React 19's `useOptimistic` for instant UI feedback:

```typescript
const [optimisticTransactions, addOptimisticUpdate] = useOptimistic(transactions, (state, update) => {
  // Apply optimistic update immediately
});
```

This provides instant feedback while the actual API call completes.

### Deduplication

The hook prevents duplicate transactions by checking if a transaction with the same ID already exists before adding it to the list.

### User Filtering

Only transactions belonging to the current user are processed, reducing unnecessary re-renders.

## Error Handling

### Subscription Errors

If the realtime subscription fails to initialize:

- Error is logged to console
- Hook continues to work with manual refetch
- Error state is set for UI to display

### Network Errors

If network connection is lost:

- Appwrite client automatically attempts to reconnect
- Subscription resumes when connection is restored
- No manual intervention required

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

## Related Hooks

- `useAccountBalance`: Realtime account balance updates
- `useTransactionsWithSharing`: Transactions with sharing support
- `useAppwriteRealtime`: Generic realtime subscription hook

## Migration from Manual Refresh

If you're migrating from manual refresh patterns:

### Before (Manual Refresh)

```typescript
const [transactions, setTransactions] = useState([]);

const fetchTransactions = async () => {
  const data = await fetch('/api/transactions');
  setTransactions(data);
};

// Manual refresh button
<button onClick={fetchTransactions}>Refresh</button>
```

### After (Automatic Realtime)

```typescript
const { transactions } = useTransactions({ userId });

// No refresh button needed - updates automatically!
```

## Troubleshooting

### Transactions not updating automatically

1. Check browser console for realtime subscription errors
2. Verify `NEXT_PUBLIC_APPWRITE_DATABASE_ID` is set correctly
3. Check Appwrite Console for function execution logs
4. Verify user has permission to read transactions

### Duplicate transactions appearing

1. Check if multiple instances of the hook are running
2. Verify transaction IDs are unique
3. Check for race conditions in optimistic updates

### Slow updates

1. Check network latency in DevTools
2. Verify Appwrite Function execution time in Console
3. Consider optimizing database queries
4. Check for unnecessary re-renders

## Best Practices

1. **Use initial data** when available (SSR) to avoid loading states
2. **Don't call refetch** unless absolutely necessary - realtime handles updates
3. **Handle errors gracefully** - show user-friendly messages
4. **Test with multiple tabs** to verify realtime behavior
5. **Monitor Appwrite Console** for function execution errors
