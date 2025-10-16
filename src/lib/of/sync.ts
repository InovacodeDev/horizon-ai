import { createId } from "@paralleldrive/cuid2";
import { supabaseAdmin } from "@/lib/db/supabase";
import { categorizeTransaction } from "./categorization";

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

/**
 * Sync connection data from Open Finance API
 * Fetches accounts and transactions for the last 90 days
 */
export async function syncConnection(
  connectionId: string,
  userId: string,
  accessToken: string
): Promise<void> {
  const apiUrl = process.env.OPEN_FINANCE_API_URL;

  if (!apiUrl) {
    throw new Error("Open Finance API URL not configured");
  }

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

    // Store accounts in database
    for (const account of accountsData.data) {
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

      if (accountError) {
        console.error("Error storing account:", accountError);
        continue; // Continue with other accounts
      }

      // Fetch transactions for this account (last 90 days)
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);

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

      // Store transactions in database
      for (const transaction of transactionsData.data) {
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

        if (transactionError) {
          console.error("Error storing transaction:", transactionError);
          // Continue with other transactions
        }
      }
    }

    // Update connection's last sync timestamp
    const { error: updateError } = await supabaseAdmin
      .from("connections")
      .update({
        last_sync_at: new Date().toISOString(),
        status: "ACTIVE",
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Error updating connection sync time:", updateError);
    }
  } catch (error) {
    console.error("Sync error:", error);
    throw error;
  }
}
