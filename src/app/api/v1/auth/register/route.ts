import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { supabaseAdmin } from "@/lib/db/supabase";
import { hashPassword } from "@/lib/auth/password";
import {
  authRateLimiter,
  getClientIp,
  checkRateLimit,
} from "@/lib/utils/rate-limiter";
import { logAuditEvent, getClientInfo } from "@/lib/audit/logger";

// Validation schema
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
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
    const validated = registerSchema.parse(body);

    // Get client info for audit logging
    const { ipAddress, userAgent } = getClientInfo(request);

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", validated.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Create user
    const userId = createId();
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email: validated.email,
        password_hash: passwordHash,
        first_name: validated.firstName,
        last_name: validated.lastName || null,
        role: "FREE",
      })
      .select("id, email, first_name, last_name, role, created_at")
      .single();

    if (insertError) {
      console.error("Error creating user:", insertError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Log successful registration
    await logAuditEvent({
      userId: newUser.id,
      eventType: "REGISTER",
      eventDescription: "New user registered",
      ipAddress,
      userAgent,
      metadata: { email: newUser.email },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: newUser,
      },
      { status: 201 }
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

    console.error("Unexpected error in register:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
