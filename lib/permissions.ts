/**
 * Fine-grained admin permission model (isomorphic — safe to import on the
 * client). Each admin has a matrix of resource × action booleans; a Root Admin
 * (`isRoot`) bypasses every check. Server-side enforcement lives in
 * `lib/authz.ts`; this file holds only pure types/helpers + Thai UI labels.
 */

export const RESOURCES = [
  "events",
  "athletes",
  "judges",
  "affiliations",
  "admins",
  "reports",
] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["view", "create", "edit", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

export type PermissionMatrix = Record<Resource, Record<Action, boolean>>;

export const RESOURCE_LABELS: Record<Resource, string> = {
  events: "กิจกรรม / รอบแข่ง",
  athletes: "นักกีฬา",
  judges: "กรรมการ / องค์กร",
  affiliations: "สังกัด",
  admins: "ผู้ดูแลระบบ",
  reports: "รายงาน",
};

export const ACTION_LABELS: Record<Action, string> = {
  view: "ดู",
  create: "เพิ่ม",
  edit: "แก้ไข",
  delete: "ลบ",
};

function fill(value: boolean): PermissionMatrix {
  return RESOURCES.reduce((acc, r) => {
    acc[r] = { view: value, create: value, edit: value, delete: value };
    return acc;
  }, {} as PermissionMatrix);
}

export function emptyPermissions(): PermissionMatrix {
  return fill(false);
}

export function fullPermissions(): PermissionMatrix {
  return fill(true);
}

/** Coerce arbitrary JSON (from the DB) into a complete, well-typed matrix. */
export function normalizePermissions(raw: unknown): PermissionMatrix {
  const base = emptyPermissions();
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, Record<string, unknown>>;
    for (const r of RESOURCES) {
      const rv = obj[r];
      if (rv && typeof rv === "object") {
        for (const a of ACTIONS) base[r][a] = Boolean(rv[a]);
      }
    }
  }
  return base;
}

export type PermissionUser = { isRoot?: boolean | null; permissions?: unknown };

/** Whether the user may perform `action` on `resource` (Root bypasses all). */
export function hasPermission(
  user: PermissionUser | null | undefined,
  resource: Resource,
  action: Action,
): boolean {
  if (!user) return false;
  if (user.isRoot) return true;
  return normalizePermissions(user.permissions)[resource][action];
}

/** Whether the user can see a section at all (any action on the resource). */
export function canAccessResource(
  user: PermissionUser | null | undefined,
  resource: Resource,
): boolean {
  if (!user) return false;
  if (user.isRoot) return true;
  const p = normalizePermissions(user.permissions)[resource];
  return p.view || p.create || p.edit || p.delete;
}
