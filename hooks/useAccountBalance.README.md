# useAccountBalance Hook

## Overview

The `useAccountBalance` hook provides realtime subscription to individual account balance updates via Appwrite Realtime. This hook is part of the serverless architecture refactor where balance calculations are handled by Appwrite Functions, and the UI updates automatically via realtime subscriptions.

## Features

- ✅ Automatic subscription to account document updates
- ✅ Fetches initial balance on mount
- ✅ Handles subscription lifecycle (subscribe/unsubscribe)
- ✅ Error handling with callbacks
- ✅ Manual refresh capability
- ✅ TypeScript support

## Usage

### Basic Usage

```tsx
import { useAccountBalance } from '@/hooks/useAccountBalance';

function AccountCard({ accountId }: { accountId: string }) {
  const { balance, loading, error } = useAccountBalance(accountId);

  if (loading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      Balance: {balance?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </div>
  );
}
```

### With Callbacks

```tsx
function AccountCard({ accountId }: { accountId: string }) {
  const { balance, loading, error, refresh } = useAccountBalance(accountId, {
    onBalanceUpdate: (newBalance) => {
      console.log('Balance updated:', newBalance);
      // Show notification, update analytics, etc.
    },
    onError: (error) => {
      console.error('Balance subscription error:', error);
      // Show error notification
    },
  });

  return (
    <div>
      <p>Balance: {balance}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Disable Realtime

```tsx
function AccountCard({ accountId }: { accountId: string }) {
  const { balance, loading, refresh } = useAccountBalance(accountId, {
    enabled: false, // Disable realtime subscription
  });

  // Only fetches initial balance, no realtime updates
  return (
    <div>
      <p>Balance: {balance}</p>
      <button onClick={refresh}>Manual Refresh</button>
    </div>
  );
}
```

## API

### Parameters

```typescript
useAccountBalance(accountId: string, options?: UseAccountBalanceOptions)
```

#### `accountId: string`

The ID of the account to subscribe to.

#### `options?: UseAccountBalanceOptions`

| Option            | Type                        | Default     | Description                             |
| ----------------- | --------------------------- | ----------- | --------------------------------------- |
| `enabled`         | `boolean`                   | `true`      | Whether to enable realtime subscription |
| `onBalanceUpdate` | `(balance: number) => void` | `undefined` | Callback when balance updates           |
| `onError`         | `(error: Error) => void`    | `undefined` | Callback when an error occurs           |

### Return Value

```typescript
interface UseAccountBalanceReturn {
  balance: number | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

| Property  | Type                  | Description                   |
| --------- | --------------------- | ----------------------------- |
| `balance` | `number \| null`      | Current account balance       |
| `loading` | `boolean`             | Loading state (initial fetch) |
| `error`   | `Error \| null`       | Error state                   |
| `refresh` | `() => Promise<void>` | Manually refresh the balance  |

## How It Works

### 1. Initial Fetch

When the component mounts, the hook fetches the initial balance from Appwrite:

```typescript
const databases = getAppwriteBrowserDatabases();
const account = await databases.getDocument(DATABASE_ID, ACCOUNTS_COLLECTION, accountId);
setBalance(account.balance);
```

### 2. Realtime Subscription

The hook subscribes to the specific account document:

```typescript
const channel = `databases.${DATABASE_ID}.collections.${ACCOUNTS_COLLECTION}.documents.${accountId}`;
const unsubscribe = client.subscribe(channel, (response) => {
  if (response.events.includes('.update')) {
    setBalance(response.payload.balance);
  }
});
```

### 3. Automatic Updates

When an Appwrite Function (like Balance Sync) updates the account balance:

1. The function updates the account document in the database
2. Appwrite Realtime pushes the update to all subscribed clients
3. The hook receives the update and updates the local state
4. React re-renders the component with the new balance

### 4. Cleanup

When the component unmounts, the hook automatically unsubscribes:

```typescript
return () => {
  unsubscribe();
};
```

## Architecture Context

This hook is part of the serverless architecture where:

- **Next.js** handles only CRUD operations and UI rendering
- **Appwrite Functions** handle all business logic (balance calculations)
- **Appwrite Realtime** pushes updates to the UI automatically

### Data Flow

```
User creates transaction
        ↓
Next.js API (CRUD only)
        ↓
Appwrite Database
        ↓
Balance Sync Function (triggered by event)
        ↓
Calculates new balance
        ↓
Updates account document
        ↓
Appwrite Realtime
        ↓
useAccountBalance hook
        ↓
UI updates automatically
```

## Component Example

A ready-to-use component is available:

```tsx
import { AccountBalanceDisplay } from '@/components/AccountBalanceDisplay';

function MyComponent() {
  return (
    <AccountBalanceDisplay
      accountId="account-123"
      accountName="Checking Account"
      showName
      size="lg"
      onBalanceUpdate={(balance) => console.log('New balance:', balance)}
    />
  );
}
```

## Performance Considerations

### When to Use This Hook

✅ **Use when:**

- Displaying a single account's balance
- Need granular control over subscription lifecycle
- Want to optimize by subscribing only to specific accounts
- Building a widget or component that focuses on one account

❌ **Don't use when:**

- Displaying multiple accounts (use `useAccounts` instead)
- Need full account data (not just balance)
- Already using `useAccounts` in the same component

### Subscription Limits

- Each subscription creates a WebSocket connection
- Appwrite has limits on concurrent subscriptions per client
- For displaying many accounts, use collection-level subscription (`useAccounts`)

## Troubleshooting

### Balance not updating

1. **Check Appwrite Function logs**: Verify the Balance Sync Function is executing
2. **Check browser console**: Look for subscription errors
3. **Verify environment variables**: Ensure `NEXT_PUBLIC_APPWRITE_DATABASE_ID` is set
4. **Check permissions**: Ensure the user has read access to the account document

### Subscription errors

```typescript
const { balance, error } = useAccountBalance(accountId, {
  onError: (err) => {
    console.error('Subscription error:', err);
    // Handle error (show notification, retry, etc.)
  },
});
```

### Manual refresh

If realtime updates fail, users can manually refresh:

```typescript
const { balance, refresh } = useAccountBalance(accountId);

<button onClick={refresh}>Refresh Balance</button>
```

## Related

- `useAccounts` - Hook for managing multiple accounts with realtime updates
- `useAccountsWithSharing` - Hook for accounts with sharing metadata
- `useTotalBalance` - Hook for calculating total balance across all accounts
- `AccountBalanceDisplay` - Ready-to-use component for displaying account balance

## Migration from Manual Refresh

### Before (Manual Refresh)

```tsx
function AccountCard({ accountId }: { accountId: string }) {
  const [balance, setBalance] = useState(0);

  const fetchBalance = async () => {
    const response = await fetch(`/api/accounts/${accountId}`);
    const account = await response.json();
    setBalance(account.balance);
  };

  useEffect(() => {
    fetchBalance();
  }, [accountId]);

  return (
    <div>
      <p>Balance: {balance}</p>
      <button onClick={fetchBalance}>Refresh</button>
    </div>
  );
}
```

### After (Automatic Realtime)

```tsx
function AccountCard({ accountId }: { accountId: string }) {
  const { balance, loading } = useAccountBalance(accountId);

  if (loading) return <Spinner />;

  return (
    <div>
      <p>Balance: {balance}</p>
      {/* No refresh button needed - updates automatically! */}
    </div>
  );
}
```

## See Also

- [Serverless Architecture Design](../../.kiro/specs/serverless-architecture-refactor/design.md)
- [Appwrite Realtime Documentation](https://appwrite.io/docs/realtime)
- [Balance Sync Function](../../functions/balance-sync/README.md)
