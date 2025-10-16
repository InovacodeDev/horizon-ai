import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";

/**
 * Health check endpoint for monitoring
 * Returns 200 if all systems are operational
 */
export async function GET() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      checks: {
        database: "unknown",
        redis: "unknown",
      },
    };

    // Check database connection
    try {
      const { error } = await supabaseAdmin.from("users").select("id").limit(1);

      checks.checks.database = error ? "unhealthy" : "healthy";
    } catch (error) {
      console.error("Database health check failed:", error);
      checks.checks.database = "unhealthy";
    }

    // Check Redis connection (optional - don't fail if Redis is down)
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      if (redisUrl) {
        const response = await fetch(`${redisUrl}/ping`, {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
        checks.checks.redis = response.ok ? "healthy" : "unhealthy";
      } else {
        checks.checks.redis = "not_configured";
      }
    } catch (error) {
      console.error("Redis health check failed:", error);
      checks.checks.redis = "unhealthy";
    }

    // Determine overall status
    const isHealthy =
      checks.checks.database === "healthy" &&
      (checks.checks.redis === "healthy" ||
        checks.checks.redis === "not_configured");

    if (!isHealthy) {
      checks.status = "unhealthy";
      return NextResponse.json(checks, { status: 503 });
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "unhealthy",
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}
