/** User-readable API error without dumping secrets or raw payloads. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return error instanceof Error && error.message ? error.message : fallback;
  }
  const ax = error as {
    response?: { data?: { message?: unknown; error?: unknown } };
    message?: string;
  };
  const data = ax.response?.data;
  const fromBody = data?.message ?? data?.error;
  if (typeof fromBody === "string" && fromBody.trim()) return fromBody.trim();
  if (Array.isArray(fromBody) && fromBody.every((x) => typeof x === "string")) {
    return fromBody.join(", ");
  }
  if (typeof ax.message === "string" && ax.message.trim()) return ax.message.trim();
  return fallback;
}

export function apiStatusCode(error: unknown): number | undefined {
  const code = (error as { response?: { status?: number } })?.response?.status;
  return typeof code === "number" ? code : undefined;
}

export function isValidationClientError(error: unknown): boolean {
  const code = apiStatusCode(error);
  return code === 400 || code === 409 || code === 422;
}

export function looksLikePaymentReauthorizationError(error: unknown): boolean {
  const message = apiErrorMessage(error, "").toLowerCase();
  return (
    message.includes("reauthor") ||
    message.includes("authorization expired") ||
    message.includes("payment authorization") ||
    message.includes("requires_payment") ||
    message.includes("client secret")
  );
}

const START_VERIFICATION_COPY: Record<string, string> = {
  ARRIVAL_PIN_NOT_ISSUED:
    "The customer has not generated an arrival PIN yet. Ask them to open the booking and show their PIN.",
  ARRIVAL_PIN_ALREADY_USED: "That arrival PIN was already used. Ask the customer for a new PIN.",
  ARRIVAL_PIN_ATTEMPTS_EXCEEDED:
    "Too many incorrect PIN attempts. Ask the customer to regenerate their arrival PIN.",
  ARRIVAL_PIN_EXPIRED: "That arrival PIN has expired. Ask the customer to regenerate it.",
  ARRIVAL_PIN_INVALID: "The arrival PIN is incorrect. Check the six digits with the customer.",
  LOCATION_TIMESTAMP_STALE:
    "Your location sample is too old. Press Verify and start again to capture a fresh GPS reading.",
  OUTSIDE_START_WINDOW:
    "You are outside the allowed start window for this booking. Check the scheduled time.",
  LOCATION_ACCURACY_TOO_LOW:
    "GPS accuracy is too low. Move to an open area, enable precise location, and try again.",
  BOOKING_LOCATION_INVALID:
    "This booking does not have a valid service location on file. Contact support.",
  OUTSIDE_START_GEOFENCE:
    "You are too far from the service address. Move closer before starting the job.",
};

/** Map backend Start verification codes to user-facing copy. */
export function mapStartVerificationError(error: unknown, fallback: string): string {
  const raw = apiErrorMessage(error, "");
  const prefix = "Start verification failed:";
  const idx = raw.indexOf(prefix);
  if (idx === -1) return raw || fallback;

  const codes = raw
    .slice(idx + prefix.length)
    .split(",")
    .map((part) => part.trim().replace(/\.$/, ""))
    .filter(Boolean);

  const messages = codes
    .map((code) => START_VERIFICATION_COPY[code] ?? code.replace(/_/g, " ").toLowerCase())
    .filter(Boolean);

  return messages.length > 0 ? messages.join(" ") : raw || fallback;
}
