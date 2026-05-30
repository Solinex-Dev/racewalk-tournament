/**
 * Records a business-level event for audit.
 * Failures are swallowed so the main request is not broken.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const ActivityLogAction = {
  // Auth
  USER_REGISTERED: "USER_REGISTERED",
  USER_LOGGED_IN: "USER_LOGGED_IN",
  USER_LOGGED_OUT: "USER_LOGGED_OUT",
  USER_PROFILE_UPDATED: "USER_PROFILE_UPDATED",
  USER_PASSWORD_CHANGED: "USER_PASSWORD_CHANGED",
  USER_PASSWORD_RESET_REQUESTED: "USER_PASSWORD_RESET_REQUESTED",
  USER_EMAIL_VERIFIED: "USER_EMAIL_VERIFIED",
  SESSION_REVOKED: "SESSION_REVOKED",
  ACCOUNT_DEACTIVATE: "ACCOUNT_DEACTIVATE",
  ACCOUNT_RESTORE: "ACCOUNT_RESTORE",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",

  // Admin domain mutations
  EVENT_CREATED: "EVENT_CREATED",
  EVENT_UPDATED: "EVENT_UPDATED",
  EVENT_DELETED: "EVENT_DELETED",
  ROUND_CREATED: "ROUND_CREATED",
  ROUND_UPDATED: "ROUND_UPDATED",
  ROUND_DELETED: "ROUND_DELETED",
  ROUND_STARTED: "ROUND_STARTED",
  ROUND_ENDED: "ROUND_ENDED",
  ATHLETE_CREATED: "ATHLETE_CREATED",
  ATHLETE_UPDATED: "ATHLETE_UPDATED",
  ATHLETE_DELETED: "ATHLETE_DELETED",
  ATHLETES_BULK_IMPORTED: "ATHLETES_BULK_IMPORTED",
  JUDGE_CREATED: "JUDGE_CREATED",
  JUDGE_UPDATED: "JUDGE_UPDATED",
  JUDGE_DELETED: "JUDGE_DELETED",
  JUDGES_BULK_IMPORTED: "JUDGES_BULK_IMPORTED",
  AFFILIATION_CREATED: "AFFILIATION_CREATED",
  AFFILIATION_UPDATED: "AFFILIATION_UPDATED",
  AFFILIATION_DELETED: "AFFILIATION_DELETED",
  ADMIN_CREATED: "ADMIN_CREATED",
  ADMIN_UPDATED: "ADMIN_UPDATED",
  ADMIN_DELETED: "ADMIN_DELETED",

  // Moderator corrections
  MODERATOR_DELETE_CARD: "MODERATOR_DELETE_CARD",
  MODERATOR_OVERRIDE_STATUS: "MODERATOR_OVERRIDE_STATUS",
  MODERATOR_EDIT_LAP: "MODERATOR_EDIT_LAP",
  MODERATOR_DELETE_LAP: "MODERATOR_DELETE_LAP",
  MODERATOR_EDIT_FINISH: "MODERATOR_EDIT_FINISH",
  MODERATOR_DELETE_FINISH: "MODERATOR_DELETE_FINISH",
  MODERATOR_CONFIRM_RED: "MODERATOR_CONFIRM_RED",
  MODERATOR_REJECT_RED: "MODERATOR_REJECT_RED",
} as const;

export type ActivityLogActionType = (typeof ActivityLogAction)[keyof typeof ActivityLogAction];

export type CreateActivityLogParams = {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: object;
};

export async function createActivityLog(params: CreateActivityLogParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        details: params.details ?? undefined,
      },
    });
  } catch {
    // Do not fail the request if activity log insert fails
  }
}

/**
 * Helper for Server Actions: log the current admin's action.
 * Silently no-ops if no session — for use after admin mutations.
 */
export async function logCurrentAdmin(
  action: ActivityLogActionType,
  entityType: string,
  entityId: string,
  details?: object,
): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return;
    await createActivityLog({ userId, action, entityType, entityId, details });
  } catch {
    // Swallow
  }
}
