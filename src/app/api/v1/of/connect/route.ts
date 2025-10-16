import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdFromRequest } from "@/lib/auth/get-user";

// Validation schema
const connectSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getUserIdFromRequest(request);

    const body = await request.json();

    // Validate input
    const validated = connectSchema.parse(body);

    // Get Open Finance configuration
    const clientId = process.env.OPEN_FINANCE_CLIENT_ID;
    const apiUrl = process.env.OPEN_FINANCE_API_URL;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/of/callback`;

    if (!clientId || !apiUrl) {
      console.error("Open Finance configuration missing");
      return NextResponse.json(
        { error: "Open Finance integration not configured" },
        { status: 500 }
      );
    }

    // Build OAuth authorization URL
    // In a real implementation, this would follow the Open Finance Brazil specification
    // For now, we'll create a mock structure that follows OAuth 2.0 patterns
    const state = Buffer.from(
      JSON.stringify({
        userId,
        institution: validated.institution,
        timestamp: Date.now(),
      })
    ).toString("base64url");

    const authUrl = new URL(`${apiUrl}/auth`);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "accounts transactions");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("institution_id", validated.institution);

    return NextResponse.json(
      {
        redirectUrl: authUrl.toString(),
        state,
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

    console.error("Unexpected error in connect:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
