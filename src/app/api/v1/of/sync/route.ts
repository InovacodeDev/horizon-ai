import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdFromRequest } from "@/lib/auth/get-user";
import { supabaseAdmin } from "@/lib/db/supabase";
import { syncConnection } from "@/lib/of/sync";
import { getValidAccessToken } from "@/lib/of/tokens";
import { isRateLimited, getRateLimitResetTime } from "@/lib/utils/rate-limiter";

// Validation schema
const syncSchema = z.object({
  connectionId: z.string().min(1, "Connection ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getUserIdFromRequest(request);

    const body = await request.json();

    // Validate input
    const validated = syncSchema.parse(body);

    // Check rate limit (1 sync per minute per connection)
    const rateLimitKey = `sync:${validated.connectionId}`;
    const rateLimitWindow = 60 * 1000; // 1 minute
    const rateLimitMax = 1;

    if (isRateLimited(rateLimitKey, rateLimitMax, rateLimitWindow)) {
      const resetIn = getRateLimitResetTime(rateLimitKey);
      const resetInSeconds = Math.ceil(resetIn / 1000);

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Please wait ${resetInSeconds} seconds before syncing again`,
          retryAfter: resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetInSeconds.toString(),
          },
        }
      );
    }

    // Fetch connection and verify ownership
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from("connections")
      .select("*")
      .eq("id", validated.connectionId)
      .eq("user_id", userId)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Connection not found or access denied" },
        { status: 404 }
      );
    }

    // Check if connection is in a valid state for syncing
    if (connection.status === "DISCONNECTED") {
      return NextResponse.json(
        { error: "Connection is disconnected" },
        { status: 400 }
      );
    }

    if (connection.status === "EXPIRED") {
      return NextResponse.json(
        {
          error: "Connection expired",
          message: "Please reconnect your account",
        },
        { status: 400 }
      );
    }

    // Get valid access token (will renew if expired)
    const accessToken = await getValidAccessToken(connection.id);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Failed to get valid access token",
          message: "Please reconnect your account",
        },
        { status: 400 }
      );
    }

    // Perform sync
    const result = await syncConnection(
      connection.id,
      userId,
      accessToken,
      connection.last_sync_at
    );

    return NextResponse.json(
      {
        success: true,
        synced: result.transactionsAdded,
        accountsUpdated: result.accountsUpdated,
        lastSync: result.lastSyncAt,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Unexpected error in sync:", error);

    // Update connection status to ERROR
    if (error instanceof Error) {
      const body = await request.json().catch(() => ({}));
      if (body.connectionId) {
        await supabaseAdmin
          .from("connections")
          .update({ status: "ERROR" })
          .eq("id", body.connectionId)
          .eq("user_id", getUserIdFromRequest(request));
      }
    }

    return NextResponse.json(
      { error: "Sync failed. Please try again later." },
      { status: 500 }
    );
  }
}
