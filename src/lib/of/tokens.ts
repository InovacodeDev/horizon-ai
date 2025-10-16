import { supabaseAdmin } from "@/lib/db/supabase";
import { encryptToken, decryptToken } from "./encryption";

interface TokenRenewalResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Renew Open Finance access token using refresh token
 * Updates the encrypted tokens in the database
 */
export async function renewOpenFinanceToken(
  connectionId: string
): Promise<boolean> {
  try {
    // Fetch connection
    const { data: connection, error: fetchError } = await supabaseAdmin
      .from("connections")
      .select("*")
      .eq("id", connectionId)
      .single();

    if (fetchError || !connection) {
      console.error("Connection not found:", fetchError);
      return false;
    }

    // Check if refresh token exists
    if (!connection.encrypted_refresh_token) {
      console.error("No refresh token available for connection", connectionId);
      await markConnectionAsExpired(connectionId);
      return false;
    }

    // Decrypt refresh token
    let refreshToken: string;
    try {
      refreshToken = decryptToken(connection.encrypted_refresh_token);
    } catch (error) {
      console.error("Failed to decrypt refresh token:", error);
      await markConnectionAsExpired(connectionId);
      return false;
    }

    // Get Open Finance configuration
    const clientId = process.env.OPEN_FINANCE_CLIENT_ID;
    const clientSecret = process.env.OPEN_FINANCE_CLIENT_SECRET;
    const apiUrl = process.env.OPEN_FINANCE_API_URL;

    if (!clientId || !clientSecret || !apiUrl) {
      console.error("Open Finance configuration missing");
      return false;
    }

    // Call token refresh endpoint
    const tokenResponse = await fetch(`${apiUrl}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token renewal failed:", errorText);
      await markConnectionAsExpired(connectionId);
      return false;
    }

    const tokenData: TokenRenewalResponse = await tokenResponse.json();

    // Encrypt new tokens
    const encryptedAccessToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token
      ? encryptToken(tokenData.refresh_token)
      : connection.encrypted_refresh_token; // Keep old refresh token if not provided

    // Calculate new expiration
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(
      tokenExpiresAt.getSeconds() + tokenData.expires_in
    );

    // Update connection with new tokens
    const { error: updateError } = await supabaseAdmin
      .from("connections")
      .update({
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error(
        "Failed to update connection with new tokens:",
        updateError
      );
      return false;
    }

    console.log(`Successfully renewed token for connection ${connectionId}`);
    return true;
  } catch (error) {
    console.error("Error renewing token:", error);
    await markConnectionAsExpired(connectionId);
    return false;
  }
}

/**
 * Mark connection as expired and notify user
 */
async function markConnectionAsExpired(connectionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("connections")
    .update({
      status: "EXPIRED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId);

  if (error) {
    console.error("Failed to mark connection as expired:", error);
  }

  // TODO: In a future implementation, send notification to user
  // to reconnect their account
  console.log(
    `Connection ${connectionId} marked as EXPIRED. User should reconnect.`
  );
}

/**
 * Check if token is expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) {
    return true;
  }

  const expiresAt = new Date(tokenExpiresAt);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  return expiresAt <= fiveMinutesFromNow;
}

/**
 * Get valid access token for a connection, renewing if necessary
 */
export async function getValidAccessToken(
  connectionId: string
): Promise<string | null> {
  // Fetch connection
  const { data: connection, error: fetchError } = await supabaseAdmin
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (fetchError || !connection) {
    console.error("Connection not found:", fetchError);
    return null;
  }

  // Check if token is expired
  if (isTokenExpired(connection.token_expires_at)) {
    console.log(
      `Token expired for connection ${connectionId}, attempting renewal`
    );

    const renewed = await renewOpenFinanceToken(connectionId);
    if (!renewed) {
      return null;
    }

    // Fetch updated connection
    const { data: updatedConnection } = await supabaseAdmin
      .from("connections")
      .select("encrypted_access_token")
      .eq("id", connectionId)
      .single();

    if (!updatedConnection) {
      return null;
    }

    return decryptToken(updatedConnection.encrypted_access_token);
  }

  // Token is still valid
  return decryptToken(connection.encrypted_access_token);
}
