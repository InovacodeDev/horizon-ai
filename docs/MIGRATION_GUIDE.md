# Hooks Migration Guide: React 18 → React 19.2

This guide shows how the custom hooks have been migrated to leverage React 19.2 features.

## Key Changes

### 1. Optimistic Updates with `useOptimistic`

**Before (React 18):**

```tsx
const [accounts, setAccounts] = useState([]);

const createAccount = async (input) => {
  // Manual optimistic update
  const tempAccount = { ...input, id: 'temp' };
  setAccounts([...accounts, tempAccount]);

  try {
    const result = await fetch('/api/accounts', { method: 'POST', ... });
    // Manual replacement
    setAccounts(prev => [...prev.filter(a => a.id !== 'temp'), result]);
  } catch (error) {
    // Manual rollback
    setAccounts(prev => prev.filter(a => a.id !== 'temp'));
  }
};
```

**After (React 19.2):**

```tsx
const [accounts, setAccounts] = useState([]);
const [optimisticAccounts, addOptimisticUpdate] = useOptimistic(
  accounts,
  (state, update) => {
    switch (update.type) {
      case 'add': return [...state, update.account];
      case 'update': return state.map(a => a.$id === update.account.$id ? update.account : a);
      case 'delete': return state.filter(a => a.$id !== update.id);
    }
  }
);

const createAccount = async (input) => {
  const tempAccount = { ...input, $id: `temp-${Date.now()}` };

  // Automatic optimistic update
  startTransition(() => {
    addOptimisticUpdate({ type: 'add', account: tempAccount });
  });

  try {
    const result = await fetch('/api/accounts', { method: 'POST', ... });
    setAccounts(prev => [...prev.filter(a => a.$id !== tempAccount.$id), result]);
  } catch (error) {
    // Automatic rollback by useOptimistic
    setAccounts(prev => prev.filter(a => a.$id !== tempAccount.$id));
  }
};
```

### 2. Non-Blocking Updates with `useTransition`

**Before (React 18):**

```tsx
const [isPending, setIsPending] = useState(false);

const updateAccount = async (id, data) => {
  setIsPending(true);
  try {
    await fetch(`/api/accounts/${id}`, { method: 'PATCH', ... });
  } finally {
    setIsPending(false);
  }
};
```

**After (React 19.2):**

```tsx
const [isPending, startTransition] = useTransition();

const updateAccount = async (id, data) => {
  startTransition(() => {
    addOptimisticUpdate({ type: 'update', account: updatedData });
  });

  try {
    await fetch(`/api/accounts/${id}`, { method: 'PATCH', ... });
  } catch (error) {
    // Rollback handled automatically
  }
};
```

### 3. Form Status with `useFormStatus`

**Before (React 18):**

```tsx
function SubmitButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <button
      disabled={isSubmitting}
      onClick={async () => {
        setIsSubmitting(true);
        await submitForm();
        setIsSubmitting(false);
      }}
    >
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

**After (React 19.2):**

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

## Hook-by-Hook Migration

### useAccounts

**Old Implementation (apps/web/src/hooks/useAccounts.ts):**

- Used `useEffectEvent` (experimental)
- Manual state management
- No optimistic updates
- Separate loading states

**New Implementation (hooks/useAccounts.ts):**

- Uses `useOptimistic` for instant UI updates
- Uses `useTransition` for non-blocking updates
- Automatic rollback on errors
- Combined loading state (`loading || isPending`)

**API Changes:**

- ✅ Same function signatures
- ✅ Same return values
- ✅ Drop-in replacement
- ✨ Better UX with optimistic updates

### useCreditCards

**Old Implementation:**

- Dependent on `accountId` prop
- Manual refetch after mutations
- No optimistic updates

**New Implementation:**

- Same `accountId` dependency
- Optimistic updates for all mutations
- Automatic UI updates
- Better error handling with rollback

**API Changes:**

- ✅ Same function signatures
- ✅ Same return values
- ✅ Drop-in replacement
- ✨ Instant feedback on mutations

### useTransactions

**Old Implementation:**

- Complex filter management
- Manual state updates
- Separate `isLoading` state
- Export separate `createTransaction` and `deleteTransaction` functions

**New Implementation:**

- Same filter support
- Optimistic updates for all operations
- Unified loading state
- All operations in hook return value
- Better TypeScript types

**API Changes:**

- ⚠️ `isLoading` → `loading` (renamed for consistency)
- ⚠️ Standalone functions now part of hook return
- ✅ Same filter interface
- ✨ Optimistic updates

**Migration:**

```tsx
// Before
import { useTransactions, createTransaction, deleteTransaction } from '@/hooks';

const { transactions, isLoading } = useTransactions(userId);
await createTransaction(data);
await deleteTransaction(id);

// After
import { useTransactions } from '@/hooks';

const { transactions, loading, createTransaction, deleteTransaction } = useTransactions({ userId });
await createTransaction(data);
await deleteTransaction(id);
```

### useFinancialInsights

**Old Implementation:**

- Pure computation hook
- Used `useMemo` for performance

**New Implementation:**

- Same pure computation
- Same `useMemo` usage
- Updated types to match new Transaction interface

**API Changes:**

- ✅ Fully compatible
- ✅ Drop-in replacement
- ✅ Same algorithm

### useTotalBalance

**Old Implementation:**

- Used `useEffectEvent` (experimental)
- Auto-fetch on mount

**New Implementation:**

- Standard `useCallback`
- Manual fetch (better control)
- Support for initial balance

**API Changes:**

- ⚠️ No auto-fetch on mount (call `refreshTotalBalance()` or pass `initialBalance`)
- ✅ Same return interface

**Migration:**

```tsx
// Before
const { totalBalance, loading } = useTotalBalance();
// Auto-fetches on mount

// After
const { totalBalance, loading, refreshTotalBalance } = useTotalBalance({ initialBalance });
useEffect(() => {
  refreshTotalBalance();
}, [refreshTotalBalance]);
```

## New Hooks

### useFormSubmit

New helper hook for form submission states.

```tsx
import { useFormSubmit, SubmitButton } from '@/hooks';

// In a form component
function MyForm() {
  const { pending } = useFormSubmit();

  return (
    <form action={myAction}>
      <input name="email" />
      <SubmitButton>Submit</SubmitButton>
    </form>
  );
}
```

## Breaking Changes Summary

1. **useTransactions**: `isLoading` → `loading`
2. **useTransactions**: Standalone functions now part of hook return
3. **useTotalBalance**: No auto-fetch on mount (manual trigger required)
4. **All hooks**: Updated to use new API endpoints structure

## Benefits of Migration

### Performance

- ⚡ Instant UI feedback with optimistic updates
- ⚡ Non-blocking state updates with useTransition
- ⚡ Efficient memoization with useMemo

### Developer Experience

- 🎯 Less boilerplate code
- 🎯 Automatic error handling and rollback
- 🎯 Better TypeScript support
- 🎯 Cleaner component code

### User Experience

- ✨ Instant feedback on actions
- ✨ Smooth transitions
- ✨ Better perceived performance
- ✨ Automatic loading states

## Testing Considerations

### Old Hooks

```tsx
// Had to mock manual state updates
const mockSetAccounts = jest.fn();
```

### New Hooks

```tsx
// Test optimistic behavior
await createAccount(data);
expect(screen.getByText('New Account')).toBeInTheDocument(); // Instant
await waitFor(() => {
  expect(mockFetch).toHaveBeenCalled(); // Server call
});
```

## Rollback Plan

If you need to rollback to old hooks:

1. Keep old hooks in `apps/web/src/hooks/` (don't delete)
2. Update imports to point to old location
3. Revert API endpoint changes if needed

## Next Steps

1. ✅ Migrate hooks (completed)
2. ⏭️ Update components to use new hooks
3. ⏭️ Test optimistic updates in UI
4. ⏭️ Update documentation
5. ⏭️ Remove old hooks after validation

## Questions?

See the main [README.md](./README.md) for detailed usage examples and API documentation.
