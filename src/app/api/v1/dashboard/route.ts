import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/supabase";
import { getUserIdFromRequest } from "@/lib/auth/get-user";
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from "@/lib/cache/redis";

// Validation schema for query parameters
const dashboardQuerySchema = z.object({
  cursor: z.string().optional(), // Cursor for pagination (transaction ID)
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = getUserIdFromRequest(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = dashboardQuerySchema.parse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || "30",
    });

    // Try to get cached dashboard data (only for initial load without cursor)
    if (!queryParams.cursor) {
      const cachedData = await getCached(CACHE_KEYS.DASHBOARD(userId));
      if (cachedData) {
        return NextResponse.json(cachedData, { status: 200 });
      }
    }

    // Fetch all accounts for the user with balances (optimized with specific fields)
    const accountsStartTime = Date.now();
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

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[PERF] Accounts query took ${Date.now() - accountsStartTime}ms`
      );
    }

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

    // Fetch recent transactions (last 30 days) with cursor-based pagination
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactionsStartTime = Date.now();

    // Build query with cursor-based pagination
    let transactionsQuery = supabaseAdmin
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
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .gte("transaction_date", thirtyDaysAgo.toISOString())
      .order("transaction_date", { ascending: false })
      .order("id", { ascending: false }) // Secondary sort for stable pagination
      .limit(queryParams.limit + 1); // Fetch one extra to determine if there are more

    // Apply cursor if provided
    if (queryParams.cursor) {
      // Fetch the cursor transaction to get its date
      const { data: cursorTransaction } = await supabaseAdmin
        .from("transactions")
        .select("transaction_date, id")
        .eq("id", queryParams.cursor)
        .single();

      if (cursorTransaction) {
        transactionsQuery = transactionsQuery.or(
          `transaction_date.lt.${cursorTransaction.transaction_date},and(transaction_date.eq.${cursorTransaction.transaction_date},id.lt.${queryParams.cursor})`
        );
      }
    }

    const {
      data: transactionsData,
      error: transactionsError,
      count: totalTransactions,
    } = await transactionsQuery;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[PERF] Transactions query took ${Date.now() - transactionsStartTime}ms`
      );
    }

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    // Check if there are more results
    const hasMore = transactionsData.length > queryParams.limit;
    const transactions = hasMore
      ? transactionsData.slice(0, queryParams.limit)
      : transactionsData;

    // Get the next cursor (last transaction ID)
    const nextCursor =
      hasMore && transactions.length > 0
        ? transactions[transactions.length - 1].id
        : null;

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
          cursor: queryParams.cursor || null,
          nextCursor,
          limit: queryParams.limit,
          total: totalTransactions || 0,
          hasMore,
        },
      },
    };

    // Cache the response (only for initial load without cursor)
    if (!queryParams.cursor) {
      await setCached(
        CACHE_KEYS.DASHBOARD(userId),
        response,
        CACHE_TTL.DASHBOARD
      );
    }

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
