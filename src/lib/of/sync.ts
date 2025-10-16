import { createId } from "@paralleldrive/cuid2";
import { supabaseAdmin } from "@/lib/db/supabase";
import { categorizeTransaction } from "@/lib/categorization/auto-categorize";

interface OpenFinanceAccount {
  accountId: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT";
  number?: string;
  balance: number;
  currency: string;
  name?: string;
}

interface OpenFinanceTransaction {
  transactionId: string;
  type: "DEBIT" | "CREDIT";
  amount: number;
  description: string;
  date: string;
}

export interface SyncResult {
  accountsUpdated: number;
  transactionsAdded: number;
  lastSyncAt: string;
}

/**
 * Sync connection data from Open Finance API
 * Fetches accounts and transactions since last sync (or last 90 days for initial sync)
 */
export async function syncConnection(
  connectionId: string,
  userId: string,
  accessToken: string,
  lastSyncAt?: string | null
): Promise<SyncResult> {
  const apiUrl = process.env.OPEN_FINANCE_API_URL;

  if (!apiUrl) {
    throw new Error("Open Finance API URL not configured");
  }

  let accountsUpdated = 0;
  let transactionsAdded = 0;

  try {
    // Fetch accounts from Open Finance API
    const accountsResponse = await fetch(`${apiUrl}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!accountsResponse.ok) {
      throw new Error(
        `Failed to fetch accounts: ${accountsResponse.statusText}`
      );
    }

    const accountsData: { data: OpenFinanceAccount[] } =
      await accountsResponse.json();

    // Determine date range for transactions
    const fromDate = lastSyncAt ? new Date(lastSyncAt) : new Date();
    if (!lastSyncAt) {
      fromDate.setDate(fromDate.getDate() - 90); // Initial sync: last 90 days
    }

    // Get existing accounts for this connection
    const { data: existingAccounts } = await supabaseAdmin
      .from("accounts")
      .select("id, external_id")
      .eq("connection_id", connectionId);

    const existingAccountMap = new Map(
      existingAccounts?.map((acc) => [acc.external_id, acc.id]) || []
    );

    // Update or insert accounts
    for (const account of accountsData.data) {
      const existingAccountId = existingAccountMap.get(account.accountId);

      if (existingAccountId) {
        // Update existing account
        const { error: updateError } = await supabaseAdmin
          .from("accounts")
          .update({
            balance: account.balance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAccountId);

        if (!updateError) {
          accountsUpdated++;
        } else {
          console.error("Error updating account:", updateError);
        }
      } else {
        // Insert new account
        const accountId = createId();
        const { error: accountError } = await supabaseAdmin
          .from("accounts")
          .insert({
            id: accountId,
            connection_id: connectionId,
            user_id: userId,
            external_id: account.accountId,
            account_type: account.type,
            account_number: account.number || null,
            balance: account.balance,
            currency: account.currency,
            name: account.name || null,
          });

        if (!accountError) {
          existingAccountMap.set(account.accountId, accountId);
          accountsUpdated++;
        } else {
          console.error("Error storing account:", accountError);
          continue;
        }
      }

      // Fetch transactions for this account
      const accountId = existingAccountMap.get(account.accountId);
      if (!accountId) continue;

      const transactionsResponse = await fetch(
        `${apiUrl}/accounts/${account.accountId}/transactions?fromDate=${fromDate.toISOString().split("T")[0]}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!transactionsResponse.ok) {
        console.error(
          `Failed to fetch transactions for account ${account.accountId}`
        );
        continue;
      }

      const transactionsData: { data: OpenFinanceTransaction[] } =
        await transactionsResponse.json();

      // Get existing transaction IDs to avoid duplicates
      const { data: existingTransactions } = await supabaseAdmin
        .from("transactions")
        .select("external_id")
        .eq("account_id", accountId);

      const existingTransactionIds = new Set(
        existingTransactions?.map((t) => t.external_id) || []
      );

      // Store new transactions
      for (const transaction of transactionsData.data) {
        // Skip if transaction already exists
        if (existingTransactionIds.has(transaction.transactionId)) {
          continue;
        }

        const category = categorizeTransaction(transaction.description);

        const { error: transactionError } = await supabaseAdmin
          .from("transactions")
          .insert({
            id: createId(),
            account_id: accountId,
            user_id: userId,
            external_id: transaction.transactionId,
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            category,
            transaction_date: transaction.date,
          });

        if (!transactionError) {
          transactionsAdded++;
        } else {
          console.error("Error storing transaction:", transactionError);
        }
      }
    }

    // Update connection's last sync timestamp
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("connections")
      .update({
        last_sync_at: now,
        status: "ACTIVE",
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Error updating connection sync time:", updateError);
    }

    return {
      accountsUpdated,
      transactionsAdded,
      lastSyncAt: now,
    };
  } catch (error) {
    console.error("Sync error:", error);
    throw error;
  }
}
