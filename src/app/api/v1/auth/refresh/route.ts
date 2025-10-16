import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { supabaseAdmin } from "@/lib/db/supabase";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth/tokens";
import {
  serializeAccessTokenCookie,
  serializeRefreshTokenCookie,
  parseCookies,
} from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      );
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Find refresh token in database
    const { data: storedToken, error: tokenError } = await supabaseAdmin
      .from("refresh_tokens")
      .select("*")
      .eq("id", payload.jti)
      .eq("user_id", payload.userId)
      .single();

    if (tokenError || !storedToken) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (new Date(storedToken.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin.from("refresh_tokens").delete().eq("id", payload.jti);

      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 }
      );
    }

    // Verify the refresh token matches the stored hash
    const isValidToken = await verifyPassword(
      refreshToken,
      storedToken.hashed_token
    );

    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", payload.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Generate new tokens
    const newJti = createId();
    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      jti: newJti,
    });

    // Hash new refresh token
    const hashedNewRefreshToken = await hashPassword(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Delete old refresh token and insert new one
    await supabaseAdmin.from("refresh_tokens").delete().eq("id", payload.jti);

    const { error: insertError } = await supabaseAdmin
      .from("refresh_tokens")
      .insert({
        id: newJti,
        user_id: user.id,
        hashed_token: hashedNewRefreshToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing new refresh token:", insertError);
      return NextResponse.json(
        { error: "Failed to refresh session" },
        { status: 500 }
      );
    }

    // Create response
    const response = NextResponse.json(
      { message: "Tokens refreshed successfully" },
      { status: 200 }
    );

    // Set new cookies
    response.headers.append(
      "Set-Cookie",
      serializeAccessTokenCookie(newAccessToken)
    );
    response.headers.append(
      "Set-Cookie",
      serializeRefreshTokenCookie(newRefreshToken)
    );

    return response;
  } catch (error) {
    console.error("Unexpected error in refresh:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
