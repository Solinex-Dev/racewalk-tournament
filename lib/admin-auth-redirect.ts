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
  // Reject protocol-relative ("//host") and backslash tricks ("/\\host", which
  // browsers normalize to "//host") — both resolve to an external origin.
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
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
