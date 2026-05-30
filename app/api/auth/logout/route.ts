/**
 * POST /api/auth/logout — revoke UserSession, log activity (call before client signOut).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { createActivityLog, ActivityLogAction } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";

type SessionWithId = { user: { id?: string }; sessionId?: string };

export async function POST() {
  const session = (await getServerSession(authOptions)) as SessionWithId | null;
  const userId = session?.user?.id;
  const sessionId = session?.sessionId;

  if (sessionId) {
    await prisma.userSession.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  if (userId) {
    void createActivityLog({
      userId,
      action: ActivityLogAction.USER_LOGGED_OUT,
      entityType: "user",
      entityId: userId,
    });
  }

  return NextResponse.json({ ok: true });
}
