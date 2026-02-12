type CorsOrigin = boolean | string | string[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => void);

/**
 * Parse CORS_ORIGIN env string into a value compatible with both
 * the `cors` npm package and Socket.IO's cors configuration.
 *
 * Supports:
 *  - Single origin:  "http://localhost"
 *  - Multiple (csv):  "http://localhost,https://example.com"
 *  - Wildcard:  "*"  (reflects request origin, allows credentials)
 */
export function parseCorsOrigin(raw: string): CorsOrigin {
  const trimmed = raw.trim();

  if (trimmed === '*') {
    // Reflect the request's origin so credentials still work
    return true;
  }

  if (trimmed.includes(',')) {
    return trimmed.split(',').map((o) => o.trim()).filter(Boolean);
  }

  return trimmed;
}
