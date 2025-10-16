import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { supabaseAdmin } from "@/lib/db/supabase";
import { verifyPassword } from "@/lib/auth/password";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/tokens";
import {
  serializeAccessTokenCookie,
  serializeRefreshTokenCookie,
} from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import {
  authRateLimiter,
  getClientIp,
  checkRateLimit,
} from "@/lib/utils/rate-limiter";
import { logAuditEvent, getClientInfo } from "@/lib/audit/logger";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting by IP
    const clientIp = getClientIp(request);
    const rateLimitResponse = await checkRateLimit(authRateLimiter, clientIp);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // Validate input
    const validated = loginSchema.parse(body);

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, password_hash, first_name, last_name, role")
      .eq("email", validated.email)
      .single();

    if (userError || !user) {
      // Log failed login attempt
      await logAuditEvent({
        eventType: "LOGIN_FAILURE",
        eventDescription: "Invalid email",
        ipAddress,
        userAgent,
        metadata: { email: validated.email },
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      validated.password,
      user.password_hash
    );

    if (!isValidPassword) {
      // Log failed login attempt
      await logAuditEvent({
        userId: user.id,
        eventType: "LOGIN_FAILURE",
        eventDescription: "Invalid password",
        ipAddress,
        userAgent,
        metadata: { email: validated.email },
      });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate tokens
    const jti = createId(); // JWT ID for refresh token
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      jti,
    });

    // Hash and store refresh token
    const hashedRefreshToken = await hashPassword(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { error: tokenError } = await supabaseAdmin
      .from("refresh_tokens")
      .insert({
        id: jti,
        user_id: user.id,
        hashed_token: hashedRefreshToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error storing refresh token:", tokenError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Create response with user data
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set cookies
    response.headers.append(
      "Set-Cookie",
      serializeAccessTokenCookie(accessToken)
    );
    response.headers.append(
      "Set-Cookie",
      serializeRefreshTokenCookie(refreshToken)
    );

    // Log successful login
    await logAuditEvent({
      userId: user.id,
      eventType: "LOGIN_SUCCESS",
      eventDescription: "User logged in successfully",
      ipAddress,
      userAgent,
    });

    return response;
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

    console.error("Unexpected error in login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
