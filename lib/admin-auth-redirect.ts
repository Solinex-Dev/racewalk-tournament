const adminLoginPath = "/admin/login";

/** Safe in-app redirect after admin auth (blocks open redirects and login loops). */
export function getSafeAdminRedirect(
  rawCallback: string | null | undefined,
  fallbackPath = "/admin"
): string {
  if (!rawCallback) {
    return fallbackPath;
  }
  const trimmed = rawCallback.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallbackPath;
  }
  if (trimmed === adminLoginPath || trimmed.startsWith(`${adminLoginPath}/`)) {
    return fallbackPath;
  }
  return trimmed;
}

export function isAdminSession(role: string | undefined, userId?: string | null): boolean {
  return Boolean(userId && role === "ADMIN");
}
