import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/supabase";
import { getUserIdFromRequest } from "@/lib/auth/get-user";

// Validation schema for query parameters
const dashboardQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = getUserIdFromRequest(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = dashboardQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "30",
    });

    const offset = (queryParams.page - 1) * queryParams.limit;

    // Fetch all accounts for the user with balances
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from("accounts")
      .select(
        `
        id,
        account_type,
        account_number,
        balance,
        currency,
        name,
        updated_at,
        connections!inner(
          id,
          institution_name,
          last_sync_at,
          status
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (accountsError) {
      console.error("Error fetching accounts:", accountsError);
      return NextResponse.json(
        { error: "Failed to fetch accounts" },
        { status: 500 }
      );
    }

    // Calculate consolidated balance total
    const consolidatedBalance = accounts.reduce((total, account) => {
      return total + parseFloat(account.balance.toString());
    }, 0);

    // Calculate balance breakdown by account type
    const balanceByType = accounts.reduce(
      (acc, account) => {
        const type = account.account_type;
        const balance = parseFloat(account.balance.toString());
        acc[type] = (acc[type] || 0) + balance;
        return acc;
      },
      {} as Record<string, number>
    );

    // Fetch recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from("transactions")
      .select(
        `
        id,
        type,
        amount,
        description,
        category,
        transaction_date,
        accounts!inner(
          id,
          name,
          account_type,
          connections!inner(
            institution_name
          )
        )
      `
      )
      .eq("user_id", userId)
      .gte("transaction_date", thirtyDaysAgo.toISOString())
      .order("transaction_date", { ascending: false })
      .range(offset, offset + queryParams.limit - 1);

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    // Get total count of transactions for pagination
    const { count: totalTransactions, error: countError } = await supabaseAdmin
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("transaction_date", thirtyDaysAgo.toISOString());

    if (countError) {
      console.error("Error counting transactions:", countError);
    }

    // Format response
    const response = {
      consolidatedBalance: {
        total: consolidatedBalance,
        currency: "BRL",
        byType: balanceByType,
      },
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name || account.account_type,
        accountType: account.account_type,
        accountNumber: account.account_number,
        balance: parseFloat(account.balance.toString()),
        currency: account.currency,
        institutionName: account.connections.institution_name,
        lastSync: account.connections.last_sync_at,
        status: account.connections.status,
        connectionId: account.connections.id,
      })),
      transactions: {
        data: transactions.map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          description: transaction.description,
          category: transaction.category,
          date: transaction.transaction_date,
          accountName:
            transaction.accounts.name || transaction.accounts.account_type,
          accountType: transaction.accounts.account_type,
          institutionName: transaction.accounts.connections.institution_name,
        })),
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: totalTransactions || 0,
          hasMore:
            totalTransactions !== null &&
            offset + queryParams.limit < totalTransactions,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Unexpected error in dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
