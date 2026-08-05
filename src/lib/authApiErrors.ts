/** Collect human-readable messages from auth API error payloads. */
function extractAuthErrorMessages(
  err: unknown,
  authStoreMessage?: string | null,
): string[] {
  const messages: string[] = [];
  if (authStoreMessage && String(authStoreMessage).trim()) {
    messages.push(String(authStoreMessage).trim());
  }
  if (!err || typeof err !== "object") return messages;
  const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
  if (!data || typeof data !== "object") return messages;

  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim()) messages.push(value.trim());
  };

  push(data.message);
  if (Array.isArray(data.message)) {
    for (const item of data.message) push(item);
  }
  push(data.error);

  return messages;
}

/**
 * Human-readable message from failed login / auth API calls (Axios or fetch-style errors).
 */
export function formatLoginApiError(
  err: unknown,
  /** Zustand `error` is set synchronously before rethrow in `loginUser` / `loginTasker`. */
  authStoreMessage?: string | null,
): string {
  const messages = extractAuthErrorMessages(err, authStoreMessage);
  if (messages.length > 0) return messages[0];

  if (!err || typeof err !== "object") {
    return "Login failed. Please check your email and password.";
  }
  const status = (err as { response?: { status?: number }; message?: string }).response?.status;
  const e = err as { message?: string };
  if (status === 401) return "Invalid email or password.";
  if (status === 403) return "Your account is not verified. Check your email for a verification code.";
  if (status === 404) return "No account found for this email.";
  if (typeof e.message === "string" && /network/i.test(e.message)) {
    return "Network error. Check your connection and try again.";
  }
  return "Login failed. Please check your details and try again.";
}

/** True when login failed because the account email is not verified yet. */
export function isEmailNotVerifiedError(
  err: unknown,
  authStoreMessage?: string | null,
): boolean {
  const messages = extractAuthErrorMessages(err, authStoreMessage);
  const combined = messages.join(" ").toLowerCase();
  if (
    /not verified/.test(combined) ||
    /unverified/.test(combined) ||
    /verify your email/.test(combined) ||
    /email verification/.test(combined) ||
    /pending verification/.test(combined) ||
    /confirm your email/.test(combined) ||
    /verification required/.test(combined) ||
    /account.*not.*verified/.test(combined) ||
    /email.*not.*verified/.test(combined)
  ) {
    return true;
  }

  const status = (err as { response?: { status?: number } }).response?.status;
  return status === 403;
}
