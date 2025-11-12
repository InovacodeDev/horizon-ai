# useInvitations Hook

A custom React hook for managing sharing invitations with Appwrite Realtime updates.

## Features

- **Automatic Realtime Updates**: Subscribes to invitation collection changes via Appwrite Realtime
- **Status Change Detection**: Automatically updates UI when invitation status changes (e.g., expired by Appwrite Function)
- **Optimized Performance**: Only fetches invitations when needed and filters events by user
- **Error Handling**: Comprehensive error handling with user-friendly error messages
- **TypeScript Support**: Full type safety with TypeScript

## Usage

```tsx
import { useInvitations } from '@/hooks/useInvitations';

function MyComponent() {
  const { invitations, loading, error, refetch } = useInvitations({
    userId: currentUserId,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {invitatio
```

ns.map(invitation => (
<div key={invitation.$id}>
<p>{invitation.invited_email}</p>
<p>Status: {invitation.status}</p>
</div>
))}
</div>
);
}

````

## API

### Parameters

```typescript
interface UseInvitationsOptions {
  userId?: string | null;           // User ID to filter invitations (responsible user)
  initialInvitations?: SharingInvitation[];  // Optional initial data to avoid loading state
}
````

### Return Value

```typescript
{
  invitations: SharingInvitation[];  // Array of invitations
  loading: boolean;                  // Loading state
  error: string | null;              // Error message if any
  fetchInvitations: () => Promise<void>;  // Manual fetch function
  refetch: () => Promise<void>;      // Alias for fetchInvitations
}
```

## Realtime Events

The hook automatically subscribes to the following Appwrite Realtime events:

- **Create**: New invitation created → Added to the list
- **Update**: Invitation status changed (e.g., expired, accepted) → Updated in the list
- **Delete**: Invitation deleted → Removed from the list

### Event Filtering

The hook only processes events for invitations where `responsible_user_id` matches the provided `userId`. This ensures users only see their own invitations.

## Integration with Appwrite Functions

This hook is designed to work seamlessly with the **Expire Invitations Appwrite Function**:

1. The function runs daily at midnight (00:00 UTC)
2. It updates invitation status from "pending" to "expired" for old invitations
3. The hook receives the update event via Realtime
4. The UI automatically reflects the status change without manual refresh

## Example: Family Page

```tsx
'use client';

import { useInvitations } from '@/hooks/useInvitations';

export default function FamilyPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'responsible' | 'member' | null>(null);

  // Use the realtime invitations hook
  const { invitations, loading, refetch } = useInvitations({
    userId: role === 'responsible' ? userId : null,
  });

  const handleInvitationCreated = () => {
    // Invitations will update automatically via realtime
    // But we can refetch to ensure consistency
    refetch();
  };

  return (
    <div>
      <h2>Pending Invitations ({invitations.filter(i => i.status === 'pending').length})</h2>

      {invitations
        .filter(inv => inv.status === 'pending')
        .map(invitation => (
          <div key={invitation.$id}>
            <p>{invitation.invited_email}</p>
            <p>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</p>
          </div>
        ))}
    </div>
  );
}
```

## Performance Considerations

- **Subscription Lifecycle**: The hook automatically subscribes on mount and unsubscribes on unmount
- **Event Filtering**: Only processes events for the current user to minimize unnecessary updates
- **Duplicate Prevention**: Checks for existing invitations before adding new ones
- **Conditional Fetching**: Only fetches data if `userId` is provided and no initial data exists

## Error Handling

The hook handles errors gracefully:

- Network errors during fetch
- Appwrite Realtime connection errors
- Invalid response data

All errors are logged to the console and exposed via the `error` state.

## Requirements

- Appwrite Realtime enabled
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID` environment variable set
- Appwrite client configured in `@/lib/appwrite/client-browser`

## Related

- **Appwrite Function**: `functions/expire-invitations/` - Automatically expires old invitations
- **API Route**: `/api/family/invitations` - Fetches invitations
- **Schema**: `lib/appwrite/schema.ts` - SharingInvitation type definition
