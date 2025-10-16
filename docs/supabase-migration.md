# Migration from Drizzle ORM to Supabase

## Overview

This project has been migrated from using Drizzle ORM to using Supabase directly for all database operations. This change provides better integration with Supabase's features including Row Level Security (RLS), real-time subscriptions, and built-in authentication capabilities.

## What Changed

### Removed Dependencies

- `drizzle-orm` - ORM layer
- `drizzle-kit` - Migration tool
- `postgres` - PostgreSQL client

### Added Dependencies

- `@supabase/supabase-js` - Official Supabase client

### File Changes

**Deleted:**

- `drizzle.config.ts` - Drizzle configuration
- `src/lib/db/schema.ts` - Drizzle schema definitions

**Created:**

- `supabase/migrations/20241016000000_initial_schema.sql` - SQL migration file
- `src/lib/db/supabase.ts` - Supabase client configuration
- `src/lib/db/types.ts` - TypeScript type definitions for database

**Modified:**

- `src/lib/db/index.ts` - Now exports Supabase clients
- `package.json` - Updated dependencies and scripts
- `.env.example` - Updated environment variables

## Database Schema

The database schema is now defined in SQL migrations located in `supabase/migrations/`. The initial migration includes:

### Tables

- `users` - User accounts
- `refresh_tokens` - JWT refresh tokens
- `connections` - Open Finance connections
- `accounts` - Financial accounts
- `transactions` - Financial transactions

### Enums

- `user_role` - FREE, PREMIUM
- `account_type` - CHECKING, SAVINGS, CREDIT_CARD, INVESTMENT
- `transaction_type` - DEBIT, CREDIT
- `connection_status` - ACTIVE, EXPIRED, ERROR, DISCONNECTED

### Security

All tables have Row Level Security (RLS) enabled with policies that ensure users can only access their own data.

## Environment Variables

Update your `.env.local` file with the following Supabase variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in your Supabase project settings under API.

## Usage

### Importing the Client

```typescript
import { supabase, supabaseAdmin } from "@/lib/db";
```

- `supabase` - Client-side client with anon key (respects RLS)
- `supabaseAdmin` - Server-side client with service role (bypasses RLS)

### Example Queries

**Insert a user:**

```typescript
const { data, error } = await supabaseAdmin
  .from("users")
  .insert({
    id: createId(),
    email: "user@example.com",
    password_hash: hashedPassword,
    role: "FREE",
  })
  .select()
  .single();
```

**Query with filters:**

```typescript
const { data, error } = await supabase
  .from("transactions")
  .select("*")
  .eq("user_id", userId)
  .order("transaction_date", { ascending: false })
  .limit(50);
```

**Update:**

```typescript
const { error } = await supabase
  .from("connections")
  .update({ status: "ACTIVE", last_sync_at: new Date().toISOString() })
  .eq("id", connectionId)
  .eq("user_id", userId);
```

**Delete:**

```typescript
const { error } = await supabase
  .from("refresh_tokens")
  .delete()
  .eq("id", tokenId)
  .eq("user_id", userId);
```

## Applying Migrations

To apply the migrations to your Supabase database:

1. Install Supabase CLI:

   ```bash
   npm install -g supabase
   ```

2. Link your project:

   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Apply migrations:
   ```bash
   supabase db push
   ```

Alternatively, you can copy the SQL from `supabase/migrations/20241016000000_initial_schema.sql` and run it directly in the Supabase SQL Editor.

## Benefits of This Migration

1. **Row Level Security**: Built-in security at the database level
2. **Real-time**: Easy to add real-time subscriptions in the future
3. **Type Safety**: Generated TypeScript types from database schema
4. **Simpler Stack**: One less abstraction layer to maintain
5. **Better Integration**: Direct access to Supabase features (Auth, Storage, Edge Functions)
6. **Managed Migrations**: Supabase handles migration history and rollbacks

## Migration Checklist

- [x] Remove Drizzle dependencies
- [x] Install Supabase client
- [x] Create SQL migration file
- [x] Create Supabase client configuration
- [x] Create TypeScript types
- [x] Update environment variables
- [x] Update documentation
- [ ] Apply migration to Supabase database
- [ ] Update existing code to use Supabase client
- [ ] Test all database operations

## Next Steps

1. Set up your Supabase project at https://supabase.com
2. Copy the environment variables to your `.env.local`
3. Apply the migration using the Supabase SQL Editor or CLI
4. Update any existing database code to use the Supabase client
5. Test thoroughly before deploying to production
