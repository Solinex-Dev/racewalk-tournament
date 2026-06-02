"use server";

import { redirect } from "next/navigation";
import { getOfficialSession, clearOfficialSessionCookie } from "@/lib/official-session";

/**
 * Ends the current race-day official session (Judge / Head Judge / Event Logger):
 * clears the signed session cookie and redirects to the public Live page of the
 * event. The event id is derived from the session (not trusted from the client).
 *
 * Called when an official confirms the "การแข่งขันจบแล้ว" dialog after their round
 * has finished.
 */
export async function leaveOfficialSession() {
  const session = await getOfficialSession();
  const eventId = session?.eventId ?? null;
  await clearOfficialSessionCookie();
  redirect(eventId ? `/events/${eventId}` : "/");
}
