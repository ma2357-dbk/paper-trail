/**
 * Current time for server components. They render once per request, so reading
 * the clock there is fine; the React Compiler's purity rule targets client
 * re-renders, which is why pages call this helper instead of Date.now() inline.
 */
export function now(): number {
  return Date.now();
}
