/** Backend `POST /api/auth/google` accepts only the Google ID token. */
export function buildGoogleAuthPayload(idToken: string) {
  return { idToken };
}

/** Map backend Google auth errors to user-facing messages. */
export function formatGoogleAuthError(
  err: unknown,
  authStoreMessage?: string | null,
): string {
  if (authStoreMessage && String(authStoreMessage).trim()) {
    return String(authStoreMessage).trim();
  }
  if (!err || typeof err !== "object") {
    return "Google sign-in failed. Please try again.";
  }
  const e = err as {
    response?: { status?: number; data?: Record<string, unknown> };
    message?: string;
  };
  const data = e.response?.data;
  if (data && typeof data === "object") {
    const msg = data.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === "string") {
      return msg[0].trim();
    }
  }
  return "Google sign-in failed. Please try again.";
}

export function isGoogleOnlyAccount(authProvider?: string | null): boolean {
  return authProvider === "google";
}
