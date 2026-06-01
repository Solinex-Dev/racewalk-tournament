/**
 * Records a business-level event for audit / the system monitor.
 * Failures are swallowed so the main request is not broken.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRequestMeta } from "@/lib/request-meta";

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

  // System monitor — page views (read access)
  PAGE_VIEW: "PAGE_VIEW",

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
  ORGANIZATION_CREATED: "ORGANIZATION_CREATED",
  ORGANIZATION_UPDATED: "ORGANIZATION_UPDATED",
  ORGANIZATION_DELETED: "ORGANIZATION_DELETED",
  DEPARTMENT_CREATED: "DEPARTMENT_CREATED",
  DEPARTMENT_UPDATED: "DEPARTMENT_UPDATED",
  DEPARTMENT_DELETED: "DEPARTMENT_DELETED",
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
  MODERATOR_EDIT_CARD: "MODERATOR_EDIT_CARD",
  MODERATOR_EDIT_FINISH_POSITION: "MODERATOR_EDIT_FINISH_POSITION",
  MODERATOR_EDIT_ROUND: "MODERATOR_EDIT_ROUND",
} as const;

export type ActivityLogActionType = (typeof ActivityLogAction)[keyof typeof ActivityLogAction];

export type ActivityOperation = "CREATE" | "READ" | "UPDATE" | "DELETE" | "ACTION";

/**
 * Classifies an action constant into a CRUD-style operation for the monitor.
 * Best-effort string matching on the action name.
 */
export function classifyOperation(action: string): ActivityOperation {
  const a = action.toUpperCase();
  if (a === "PAGE_VIEW") return "READ";
  if (/(CREATE|REGISTER|IMPORT)/.test(a)) return "CREATE";
  if (/(DELETE|REVOK)/.test(a)) return "DELETE";
  if (/(UPDATE|EDIT|OVERRIDE|CONFIRM|REJECT|RESTORE|CHANG|DEACTIVATE|POSITION|VERIFIED)/.test(a))
    return "UPDATE";
  return "ACTION";
}

export type CreateActivityLogParams = {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: object;
  /** HTTP method — "GET" for page views, "POST" for actions. */
  method?: string;
  /** CRUD classification; derived from `action` when omitted. */
  operation?: ActivityOperation;
  /** Route/page the action came from. */
  path?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
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
        method: params.method ?? null,
        operation: params.operation ?? classifyOperation(params.action),
        path: params.path ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch {
    // Do not fail the request if activity log insert fails
  }
}

/**
 * Helper for Server Actions: log the current admin's action, auto-capturing the
 * request metadata (IP, device, originating page) and the CRUD operation. Silently
 * no-ops if there is no session.
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
    const meta = await getRequestMeta();
    await createActivityLog({
      userId,
      action,
      entityType,
      entityId,
      details,
      method: "POST",
      operation: classifyOperation(action),
      path: meta.path,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  } catch {
    // Swallow
  }
}
