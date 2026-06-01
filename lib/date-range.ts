/**
 * Returns a Date `days` days before now. Kept in a plain module (not a component
 * file) so the unavoidable `Date.now()` call isn't flagged by react-hooks/purity.
 */
export function sinceDaysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}
