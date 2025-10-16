import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { getUserIdFromRequest } from "@/lib/auth/get-user";
import { supabaseAdmin } from "@/lib/db/supabase";
import { encryptToken } from "@/lib/of/encryption";
import { syncConnection } from "@/lib/of/sync";

// Validation schema
const exchangeSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().min(1, "State is required"),
});

interface OpenFinanceTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getUserIdFromRequest(request);

    const body = await request.json();

    // Validate input
    const validated = exchangeSchema.parse(body);

    // Decode state to get institution info
    let stateData: { userId: string; institution: string; timestamp: number };
    try {
      stateData = JSON.parse(
        Buffer.from(validated.state, "base64url").toString()
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    // Verify state matches current user
    if (stateData.userId !== userId) {
      return NextResponse.json(
        { error: "State validation failed" },
        { status: 400 }
      );
    }

    // Get Open Finance configuration
    const clientId = process.env.OPEN_FINANCE_CLIENT_ID;
    const clientSecret = process.env.OPEN_FINANCE_CLIENT_SECRET;
    const apiUrl = process.env.OPEN_FINANCE_API_URL;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/of/callback`;

    if (!clientId || !clientSecret || !apiUrl) {
      console.error("Open Finance configuration missing");
      return NextResponse.json(
        { error: "Open Finance integration not configured" },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token
    // In a real implementation, this would call the Open Finance Brazil token endpoint
    const tokenResponse = await fetch(`${apiUrl}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: validated.code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return NextResponse.json(
        { error: "Failed to exchange authorization code" },
        { status: 502 }
      );
    }

    const tokenData: OpenFinanceTokenResponse = await tokenResponse.json();

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token
      ? encryptToken(tokenData.refresh_token)
      : null;

    // Calculate token expiration
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(
      tokenExpiresAt.getSeconds() + tokenData.expires_in
    );

    // Calculate consent expiration (typically 12 months for Open Finance Brazil)
    const consentExpiresAt = new Date();
    consentExpiresAt.setMonth(consentExpiresAt.getMonth() + 12);

    // Create connection record
    const connectionId = createId();
    const { error: connectionError } = await supabaseAdmin
      .from("connections")
      .insert({
        id: connectionId,
        user_id: userId,
        institution_id: stateData.institution,
        institution_name: getInstitutionName(stateData.institution),
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        consent_expires_at: consentExpiresAt.toISOString(),
        status: "ACTIVE",
      });

    if (connectionError) {
      console.error("Error creating connection:", connectionError);
      return NextResponse.json(
        { error: "Failed to save connection" },
        { status: 500 }
      );
    }

    // Start initial sync in the background
    // Note: In production, this should be done via a job queue
    syncConnection(connectionId, userId, tokenData.access_token, null).catch(
      (error) => {
        console.error("Initial sync failed:", error);
        // Update connection status to ERROR
        supabaseAdmin
          .from("connections")
          .update({ status: "ERROR" })
          .eq("id", connectionId)
          .then();
      }
    );

    return NextResponse.json(
      {
        success: true,
        connectionId,
        message: "Connection established successfully",
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

    console.error("Unexpected error in exchange:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable institution name from ID
 * In production, this would query a database or API
 */
function getInstitutionName(institutionId: string): string {
  const institutionMap: Record<string, string> = {
    itau: "Itaú",
    bradesco: "Bradesco",
    santander: "Santander",
    bb: "Banco do Brasil",
    nubank: "Nubank",
    inter: "Inter",
  };

  return institutionMap[institutionId.toLowerCase()] || institutionId;
}
