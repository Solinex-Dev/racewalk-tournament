/**
 * Page-view beacon for the system monitor. The admin layout's <ActivityTracker>
 * POSTs here on every real route change. We log a PAGE_VIEW (method GET / READ)
 * with the originating path, IP and device — identity is taken from the session,
 * never from the request body.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { createActivityLog, ActivityLogAction } from "@/lib/activity-log";
import { getRequestMeta } from "@/lib/request-meta";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!userId || role !== "ADMIN") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let path = "";
  let title = "";
  try {
    const body = await req.json();
    if (typeof body?.path === "string") path = body.path;
    if (typeof body?.title === "string") title = body.title;
  } catch {
    // ignore malformed body
  }
  // Only track admin pages; ignore anything else (and the beacon endpoint itself).
  if (!path.startsWith("/admin")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  path = path.slice(0, 512);
  title = title.slice(0, 200);

  const meta = await getRequestMeta();
  await createActivityLog({
    userId,
    action: ActivityLogAction.PAGE_VIEW,
    entityType: "Page",
    method: "GET",
    operation: "READ",
    path,
    details: title ? { title } : undefined,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ ok: true });
}
