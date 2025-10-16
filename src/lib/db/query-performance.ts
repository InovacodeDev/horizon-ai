/**
 * Analyze query performance using EXPLAIN ANALYZE
 * Note: This requires a custom RPC function in Supabase
 * For now, use the Supabase dashboard to run EXPLAIN ANALYZE manually
 */
export function getExplainQuery(query: string): string {
  return `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
}

/**
 * Log slow queries (> threshold ms)
 */
export function logSlowQuery(
  queryName: string,
  duration: number,
  threshold: number = 200
): void {
  if (duration > threshold) {
    console.warn(
      `[SLOW QUERY] ${queryName} took ${duration}ms (threshold: ${threshold}ms)`
    );
  }
}

/**
 * Measure query execution time
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (process.env.NODE_ENV === "development") {
      console.log(`[PERF] ${queryName} took ${duration}ms`);
    }

    logSlowQuery(queryName, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PERF] ${queryName} failed after ${duration}ms`, error);
    throw error;
  }
}
