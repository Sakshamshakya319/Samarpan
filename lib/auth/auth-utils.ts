/**
 * Safely extract JWT token from Authorization header
 * @param authHeader - The authorization header value
 * @returns The JWT token or null if not found/invalid
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Check if header starts with "Bearer "
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  // Split and get the token part
  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return null;
  }

  return parts[1] || null;
}

/**
 * Safely extract token from NextRequest
 * @param request - NextRequest object
 * @returns The JWT token or null if not found/invalid
 */
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  return extractTokenFromHeader(authHeader);
}