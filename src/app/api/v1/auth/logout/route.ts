import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";
import { parseCookies, serializeClearCookie } from "@/lib/auth/cookies";
import { verifyRefreshToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const refreshToken = cookies.refreshToken;

    // If refresh token exists, delete it from database
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await supabaseAdmin
          .from("refresh_tokens")
          .delete()
          .eq("id", payload.jti);
      } catch (error) {
        // Token might be invalid, but we still want to clear cookies
        console.error("Error verifying refresh token during logout:", error);
      }
    }

    // Create response
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear cookies
    response.headers.append("Set-Cookie", serializeClearCookie("accessToken"));
    response.headers.append("Set-Cookie", serializeClearCookie("refreshToken"));

    return response;
  } catch (error) {
    console.error("Unexpected error in logout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
