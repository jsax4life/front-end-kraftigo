/**
 * Human-readable message from failed login / auth API calls (Axios or fetch-style errors).
 */
export function formatLoginApiError(
  err: unknown,
  /** Zustand `error` is set synchronously before rethrow in `loginUser` / `loginTasker`. */
  authStoreMessage?: string | null,
): string {
  if (authStoreMessage && String(authStoreMessage).trim()) {
    return String(authStoreMessage).trim();
  }
  if (!err || typeof err !== "object") {
    return "Login failed. Please check your email and password.";
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
    const errField = data.error;
    if (typeof errField === "string" && errField.trim()) return errField.trim();
  }
  const status = e.response?.status;
  if (status === 401) return "Invalid email or password.";
  if (status === 404) return "No account found for this email.";
  if (typeof e.message === "string" && /network/i.test(e.message)) {
    return "Network error. Check your connection and try again.";
  }
  return "Login failed. Please check your details and try again.";
}
