# Quick Start Guide - Testing

## Prerequisites

1. Start the development server:

   ```bash
   pnpm dev
   ```

2. Ensure Appwrite is configured (check `.env.local`)

## Run Tests

### Run All Tests

```bash
pnpm test
```

### Run Individual Test Suites

```bash
# Authentication tests
pnpm test:auth

# Accounts CRUD tests
pnpm test:accounts

# Transactions CRUD tests
pnpm test:transactions

# Credit cards CRUD tests
pnpm test:credit-cards
```

## What Gets Tested

✅ **Authentication Flow** (7 tests)

- User registration
- Login with valid/invalid credentials
- Protected route access
- Logout functionality

✅ **Accounts CRUD** (6 tests)

- Create, list, get, update, delete accounts
- Verify deletion

✅ **Transactions CRUD** (8 tests)

- Create, list, filter, get, update, delete transactions
- Transaction statistics
- Verify deletion

✅ **Credit Cards CRUD** (6 tests)

- Create, list, get, update, delete credit cards
- Verify deletion

## Expected Output

```
🧪 Starting Complete Test Suite
📅 10/24/2025, 3:45:00 PM
🔗 API Base URL: http://localhost:3000

============================================================
🧪 Running: Authentication Flow
📝 Tests user registration, login, logout, and route protection
============================================================

✅ Register User: User registered successfully
✅ Login Valid: Login successful with valid credentials
...

============================================================
📊 COMPLETE TEST SUITE SUMMARY
============================================================

📈 Overall Results:
   Total Test Suites: 4
   ✅ Passed: 4
   ❌ Failed: 0
   Success Rate: 100.0%
   Total Duration: 12.34s

🎉 All test suites passed successfully!
```

## Troubleshooting

**Server not running?**

```bash
pnpm dev
```

**Appwrite errors?**

- Check `.env.local` has correct credentials
- Run migrations: `pnpm migrate:up`

**Need more details?**
See `tests/README.md` for comprehensive documentation.
