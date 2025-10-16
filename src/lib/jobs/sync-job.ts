import { supabaseAdmin } from "@/lib/db/supabase";
import { decryptToken } from "@/lib/of/encryption";
import { syncConnection } from "@/lib/of/sync";
import { getValidAccessToken } from "@/lib/of/tokens";

interface SyncJobResult {
  totalConnections: number;
  successfulSyncs: number;
  failedSyncs: number;
  errors: Array<{ connectionId: string; error: string }>;
}

/**
 * Execute periodic sync job for all active connections
 * Implements exponential backoff for failed syncs
 */
export async function executeSyncJob(): Promise<SyncJobResult> {
  const result: SyncJobResult = {
    totalConnections: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    errors: [],
  };

  try {
    // Fetch all active connections
    const { data: connections, error: fetchError } = await supabaseAdmin
      .from("connections")
      .select("*")
      .eq("status", "ACTIVE");

    if (fetchError) {
      console.error("Failed to fetch connections:", fetchError);
      throw new Error("Failed to fetch connections");
    }

    if (!connections || connections.length === 0) {
      console.log("No active connections to sync");
      return result;
    }

    result.totalConnections = connections.length;
    console.log(`Starting sync for ${connections.length} connections`);

    // Process each connection
    for (const connection of connections) {
      try {
        // Get valid access token (will renew if expired)
        const accessToken = await getValidAccessToken(connection.id);

        if (!accessToken) {
          console.log(
            `Failed to get valid token for connection ${connection.id}`
          );

          result.failedSyncs++;
          result.errors.push({
            connectionId: connection.id,
            error: "Failed to get valid access token",
          });
          continue;
        }

        // Perform sync with exponential backoff handling
        await syncConnectionWithBackoff(
          connection.id,
          connection.user_id,
          accessToken,
          connection.last_sync_at
        );

        result.successfulSyncs++;
        console.log(`Successfully synced connection ${connection.id}`);
      } catch (error) {
        result.failedSyncs++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        console.error(
          `Failed to sync connection ${connection.id}:`,
          errorMessage
        );

        result.errors.push({
          connectionId: connection.id,
          error: errorMessage,
        });

        // Update connection status to ERROR
        await supabaseAdmin
          .from("connections")
          .update({ status: "ERROR" })
          .eq("id", connection.id);
      }
    }

    console.log(
      `Sync job completed: ${result.successfulSyncs} successful, ${result.failedSyncs} failed`
    );

    return result;
  } catch (error) {
    console.error("Sync job failed:", error);
    throw error;
  }
}

/**
 * Sync connection with exponential backoff retry logic
 */
async function syncConnectionWithBackoff(
  connectionId: string,
  userId: string,
  accessToken: string,
  lastSyncAt: string | null,
  retryCount = 0,
  maxRetries = 3
): Promise<void> {
  try {
    await syncConnection(connectionId, userId, accessToken, lastSyncAt);
  } catch (error) {
    if (retryCount < maxRetries) {
      // Calculate backoff delay: 2^retryCount seconds
      const delayMs = Math.pow(2, retryCount) * 1000;

      console.log(
        `Retry ${retryCount + 1}/${maxRetries} for connection ${connectionId} after ${delayMs}ms`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Retry with incremented count
      return syncConnectionWithBackoff(
        connectionId,
        userId,
        accessToken,
        lastSyncAt,
        retryCount + 1,
        maxRetries
      );
    }

    // Max retries reached, throw error
    throw error;
  }
}

/**
 * Sync a single connection by ID
 * Used for on-demand syncs
 */
export async function syncSingleConnection(
  connectionId: string
): Promise<void> {
  const { data: connection, error: fetchError } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (fetchError || !connection) {
    throw new Error("Connection not found");
  }

  if (connection.status !== "ACTIVE") {
    throw new Error(`Connection is not active (status: ${connection.status})`);
  }

  // Decrypt access token
  const accessToken = decryptToken(connection.encrypted_access_token);

  // Perform sync
  await syncConnection(
    connection.id,
    connection.user_id,
    accessToken,
    connection.last_sync_at
  );
}
