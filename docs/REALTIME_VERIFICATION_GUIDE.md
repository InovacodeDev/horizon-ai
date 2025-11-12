# Realtime Updates Verification Guide

This guide provides instructions for verifying that Appwrite Realtime subscriptions are working correctly across the application.

## Overview

The serverless architecture relies on Appwrite Realtime to automatically update the UI when data changes. This eliminates the need for manual page refreshes and provides a seamless user experience.

## Realtime Subscriptions in the Application

The application uses Realtime subscriptions for:

1. **Account Balance Updates** - `useAccountBalance` hook
2. **Transaction List Updates** - `useTransactions` hook
3. **Invitation Status Updates** - `useInvitations` hook

## Prerequisites

Before testing Realtime updates:

1. ✅ Appwrite Realtime is enabled in Appwrite Console
2. ✅ Next.js application is running
3. ✅ You have access to multiple browser tabs/windows
4. ✅ Browser DevTools are available for debugging

## Test Setup

### Browser Configuration

1. **Use Chrome or Firefox** for best DevTools support
2. **Open DevTools** (F12 or Cmd+Option+I)
3. **Enable Console logging** to see Realtime messages
4. **Open Network tab** to monitor WebSocket connections

### Multi-Tab Testing

1. Open the application in **3 separate browser tabs**
2. Log in with the same user account in all tabs
3. Navigate to different pages:
   - Tab 1: Accounts page (`/accounts`)
   - Tab 2: Transactions page (`/transactions`)
   - Tab 3: Overview page (`/overview`)

## Verification Tests

### Test 1: Account Balance Updates

**Objective:** Verify account balances update automatically across all tabs

**Steps:**

1. **Setup:**
   - Open 3 tabs as described above
   - Note the current balance of an account in Tab 1

2. **Action:**
   - In Tab 1, create a new income transaction for the account
   - Amount: $100
   - Type: Income
   - Category: Salary

3. **Verification:**
   - **Tab 1 (Accounts):**
     - ✅ Account balance increases by $100
     - ✅ Update occurs within 1-3 seconds
     - ✅ No page refresh required
   - **Tab 2 (Transactions):**
     - ✅ New transaction appears in the list
     - ✅ Transaction shows correct amount and details
   - **Tab 3 (Overview):**
     - ✅ Total balance updates
     - ✅ Income statistics update

4. **Browser Console Check:**
   - Look for Realtime subscription messages
   - Should see: "Realtime update received" or similar
   - No error messages should appear

**Expected Timeline:**

- Transaction created: 0s
- Database updated: 0.5s
- Balance Sync Function triggered: 1s
- Balance updated in database: 2s
- Realtime update pushed to clients: 2.5s
- UI updates in all tabs: 3s

**Pass Criteria:**

- ✅ All tabs update automatically
- ✅ Updates occur within 5 seconds
- ✅ No errors in console
- ✅ Balance is mathematically correct

---

### Test 2: Transaction List Updates

**Objective:** Verify transaction lists update automatically when transactions are created, updated, or deleted

**Steps:**

1. **Setup:**
   - Open 2 tabs on the Transactions page
   - Note the current transaction count

2. **Test Create:**
   - In Tab 1, create a new transaction
   - **Verify in Tab 2:**
     - ✅ New transaction appears at the top of the list
     - ✅ Transaction count increases by 1
     - ✅ Update occurs within 1-3 seconds

3. **Test Update:**
   - In Tab 1, edit an existing transaction (change amount)
   - **Verify in Tab 2:**
     - ✅ Transaction amount updates
     - ✅ Transaction stays in the same position
     - ✅ Update occurs within 1-3 seconds

4. **Test Delete:**
   - In Tab 1, delete a transaction
   - **Verify in Tab 2:**
     - ✅ Transaction disappears from the list
     - ✅ Transaction count decreases by 1
     - ✅ Update occurs within 1-3 seconds

**Pass Criteria:**

- ✅ All CRUD operations reflect in both tabs
- ✅ Updates occur within 5 seconds
- ✅ No duplicate transactions appear
- ✅ No errors in console

---

### Test 3: Invitation Status Updates

**Objective:** Verify invitation status updates automatically when invitations expire

**Steps:**

1. **Setup:**
   - Create a test invitation with `expires_at` set to a past date
   - Open 2 tabs on the Family/Invitations page

2. **Action:**
   - Manually trigger the Expire Invitations Function in Appwrite Console
   - Or wait for the scheduled execution at 00:00

3. **Verification:**
   - **Both Tabs:**
     - ✅ Invitation status changes from "pending" to "expired"
     - ✅ Status badge color changes (e.g., yellow to red)
     - ✅ Update occurs within 1-3 seconds
     - ✅ No page refresh required

**Pass Criteria:**

- ✅ Status updates in both tabs automatically
- ✅ Updates occur within 5 seconds
- ✅ UI reflects the new status correctly
- ✅ No errors in console

---

### Test 4: Slow Network Conditions

**Objective:** Verify Realtime updates work correctly on slow networks

**Steps:**

1. **Setup:**
   - Open Chrome DevTools > Network tab
   - Set throttling to "Slow 3G"
   - Open 2 tabs on the Accounts page

2. **Action:**
   - In Tab 1, create a new transaction
   - Wait for updates

3. **Verification:**
   - **Tab 2:**
     - ✅ Account balance updates (may take 5-10 seconds)
     - ✅ Update eventually occurs despite slow network
     - ✅ No errors in console

4. **Reset:**
   - Set throttling back to "No throttling"

**Pass Criteria:**

- ✅ Updates occur even on slow network
- ✅ No timeout errors
- ✅ UI remains responsive
- ✅ Updates complete within 15 seconds

---

### Test 5: Network Interruption and Reconnection

**Objective:** Verify Realtime reconnects automatically after network interruption

**Steps:**

1. **Setup:**
   - Open 2 tabs on the Accounts page
   - Verify Realtime is connected (check console)

2. **Simulate Network Interruption:**
   - Open Chrome DevTools > Network tab
   - Check "Offline" to simulate network loss
   - Wait 5 seconds

3. **Verification During Offline:**
   - **Console:**
     - ✅ Should see "WebSocket disconnected" or similar message
     - ✅ Should see reconnection attempts

4. **Reconnect Network:**
   - Uncheck "Offline" to restore network
   - Wait for reconnection

5. **Verification After Reconnection:**
   - **Console:**
     - ✅ Should see "WebSocket connected" or similar message
     - ✅ Should see "Realtime reconnected" message
   - **Test Update:**
     - Create a transaction in Tab 1
     - ✅ Update appears in Tab 2
     - ✅ Realtime is working again

**Pass Criteria:**

- ✅ Realtime detects disconnection
- ✅ Automatic reconnection attempts occur
- ✅ Reconnection succeeds within 10 seconds
- ✅ Updates work after reconnection
- ✅ No manual refresh required

---

### Test 6: Multiple Rapid Updates

**Objective:** Verify Realtime handles multiple rapid updates correctly

**Steps:**

1. **Setup:**
   - Open 2 tabs on the Transactions page

2. **Action:**
   - In Tab 1, rapidly create 5 transactions (one after another)
   - Don't wait for updates between creations

3. **Verification:**
   - **Tab 2:**
     - ✅ All 5 transactions appear in the list
     - ✅ Transactions appear in correct order
     - ✅ No duplicate transactions
     - ✅ No missing transactions
     - ✅ Updates complete within 10 seconds

**Pass Criteria:**

- ✅ All updates are received
- ✅ No updates are lost
- ✅ No duplicates appear
- ✅ Order is correct

---

### Test 7: Cross-Page Updates

**Objective:** Verify updates propagate across different pages

**Steps:**

1. **Setup:**
   - Tab 1: Accounts page
   - Tab 2: Transactions page
   - Tab 3: Overview page

2. **Action:**
   - In Tab 2, create a new transaction

3. **Verification:**
   - **Tab 1 (Accounts):**
     - ✅ Account balance updates
   - **Tab 2 (Transactions):**
     - ✅ New transaction appears in list
   - **Tab 3 (Overview):**
     - ✅ Total balance updates
     - ✅ Statistics update

**Pass Criteria:**

- ✅ All pages update automatically
- ✅ Updates are consistent across pages
- ✅ No page refresh required

---

## Debugging Realtime Issues

### Check WebSocket Connection

1. Open Chrome DevTools > Network tab
2. Filter by "WS" (WebSocket)
3. Look for connection to Appwrite Realtime
4. Verify connection status is "101 Switching Protocols"
5. Check for any error messages

### Check Console Logs

Look for these messages in the console:

**Good Signs:**

- ✅ "Realtime connected"
- ✅ "Subscribed to channel: databases._.collections.accounts.documents._"
- ✅ "Realtime update received"

**Warning Signs:**

- ⚠️ "Realtime disconnected"
- ⚠️ "Reconnecting..."
- ⚠️ "Subscription failed"

**Error Signs:**

- ❌ "WebSocket error"
- ❌ "Permission denied"
- ❌ "Subscription timeout"

### Check Appwrite Console

1. Go to Appwrite Console > Settings > Realtime
2. Verify Realtime is enabled
3. Check connection limits
4. Review Realtime logs (if available)

### Common Issues and Solutions

**Issue: Updates not appearing**

**Possible Causes:**

1. Realtime not connected
2. Subscription not established
3. Permission issues
4. Network issues

**Solutions:**

1. Check WebSocket connection in DevTools
2. Verify subscription code is correct
3. Check user permissions for the collection
4. Try refreshing the page

---

**Issue: Duplicate updates**

**Possible Causes:**

1. Multiple subscriptions to same channel
2. Component re-rendering issues
3. Subscription not cleaned up properly

**Solutions:**

1. Check for duplicate subscription code
2. Ensure useEffect cleanup function is called
3. Add dependency array to useEffect

---

**Issue: Slow updates**

**Possible Causes:**

1. Network latency
2. Appwrite Function taking too long
3. Database query performance

**Solutions:**

1. Check network speed
2. Monitor Appwrite Function execution time
3. Optimize database queries

---

**Issue: Reconnection fails**

**Possible Causes:**

1. Network issues
2. Appwrite service down
3. Authentication token expired

**Solutions:**

1. Check network connection
2. Check Appwrite status page
3. Re-authenticate user

---

## Performance Benchmarks

Expected performance for Realtime updates:

| Metric             | Target  | Acceptable | Poor   |
| ------------------ | ------- | ---------- | ------ |
| Connection Time    | < 1s    | < 3s       | > 5s   |
| Update Latency     | < 1s    | < 3s       | > 5s   |
| Reconnection Time  | < 5s    | < 10s      | > 15s  |
| Message Throughput | > 100/s | > 50/s     | < 50/s |

## Monitoring Realtime Health

### Daily Checks

1. **Connection Status:**
   - Verify Realtime is enabled in Appwrite Console
   - Check for any service disruptions

2. **User Reports:**
   - Monitor for user reports of stale data
   - Check for complaints about manual refresh needed

3. **Error Logs:**
   - Review browser console errors
   - Check Appwrite logs for Realtime errors

### Weekly Checks

1. **Performance Analysis:**
   - Review average update latency
   - Check for slow updates
   - Identify performance bottlenecks

2. **Connection Stability:**
   - Review reconnection frequency
   - Check for connection drops
   - Identify network issues

### Monthly Checks

1. **Capacity Planning:**
   - Review total Realtime connections
   - Check if approaching limits
   - Plan for scaling if needed

2. **Feature Usage:**
   - Analyze which features use Realtime most
   - Identify optimization opportunities
   - Plan for new Realtime features

## Test Results Checklist

Use this checklist to record your test results:

### Account Balance Updates

- [ ] Updates appear in all tabs
- [ ] Updates occur within 5 seconds
- [ ] No errors in console
- [ ] Balance is correct

### Transaction List Updates

- [ ] Create updates work
- [ ] Update updates work
- [ ] Delete updates work
- [ ] No duplicates appear

### Invitation Status Updates

- [ ] Status changes automatically
- [ ] Updates appear in all tabs
- [ ] UI reflects new status

### Slow Network Conditions

- [ ] Updates work on slow network
- [ ] No timeout errors
- [ ] Updates complete within 15 seconds

### Network Interruption

- [ ] Disconnection detected
- [ ] Reconnection succeeds
- [ ] Updates work after reconnection

### Multiple Rapid Updates

- [ ] All updates received
- [ ] No updates lost
- [ ] No duplicates

### Cross-Page Updates

- [ ] All pages update
- [ ] Updates are consistent
- [ ] No refresh required

## Sign-off

- Tester Name: ****\_\_\_****
- Date: ****\_\_\_****
- Overall Result: ☐ All Tests Pass ☐ Some Tests Fail
- Realtime Status: ☐ Working Correctly ☐ Issues Found

## Conclusion

Realtime updates are critical to the serverless architecture. By following this guide and performing regular verification tests, you can ensure that users always see the most current data without manual refreshes.

Remember:

- Test Realtime regularly
- Monitor WebSocket connections
- Investigate issues promptly
- Keep subscriptions optimized
- Document any problems and solutions
