import { NextRequest, NextResponse } from "next/server";
import { executeSyncJob } from "@/lib/jobs/sync-job";

/**
 * Cron endpoint for periodic synchronization
 * This endpoint should be called by Vercel Cron or external scheduler
 * Secured with a secret token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for authentication
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron job not configured" },
        { status: 500 }
      );
    }

    // Check authorization header
    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader !== expectedAuth) {
      console.warn("Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting scheduled sync job...");

    // Execute sync job
    const result = await executeSyncJob();

    console.log("Sync job completed:", result);

    return NextResponse.json(
      {
        success: true,
        message: "Sync job completed",
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cron sync job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
