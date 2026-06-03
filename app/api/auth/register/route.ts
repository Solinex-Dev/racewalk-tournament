/**
 * POST /api/auth/register — admin-only endpoint to create another admin account.
 * Body: { email: string, password: string, name?: string, title?: string, role?: "USER" | "ADMIN" }
 *
 * Racewalk uses **admin-invite-only**: there is no public self-service registration.
 * The caller must already have an authenticated ADMIN session.
 *
 * Simplified vs. Judtang's public register endpoint:
 * - No Turnstile captcha (caller is authenticated)
 * - No email verification token / send (admin sets the password directly)
 * - No terms acceptance row
 */
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeEmail,
  isValidEmailFormat,
  EMAIL_MAX_LENGTH,
  validatePasswordLength,
} from "@/lib/validation";
import { createActivityLog, ActivityLogAction } from "@/lib/activity-log";
import { resolveUserStatus, finalizeDeletion } from "@/lib/user-status";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, title, role } = body as {
      email?: string;
      password?: string;
      name?: string;
      title?: string;
      role?: "USER" | "ADMIN";
    };
    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password required" },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(String(email));
    if (!normalizedEmail || !isValidEmailFormat(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (normalizedEmail.length > EMAIL_MAX_LENGTH) {
      return NextResponse.json({ error: "Email is too long" }, { status: 400 });
    }

    const passwordCheck = validatePasswordLength(String(password));
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, status: true, deleteAfter: true },
    });
    if (existing) {
      const status = resolveUserStatus(existing);
      if (status === "ACTIVE") {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
      if (status === "SUSPENDED") {
        return NextResponse.json(
          {
            error: "Account is deactivating; try again after the scheduled deletion date",
            deleteAfter: existing.deleteAfter?.toISOString(),
          },
          { status: 409 }
        );
      }
      if (status === "DELETED") {
        await finalizeDeletion(existing.id);
      }
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name != null && String(name).trim() !== "" ? String(name).trim() : null,
        title: title != null && String(title).trim() !== "" ? String(title).trim() : null,
        password: hashedPassword,
        role: role === "ADMIN" || role === "USER" ? role : "USER",
        // Created by an admin → considered verified (no email roundtrip required)
        emailVerified: new Date(),
      },
    });
    void createActivityLog({
      userId: session.user.id,
      action: ActivityLogAction.USER_REGISTERED,
      entityType: "user",
      entityId: user.id,
      details: { invitedBy: session.user.id },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
