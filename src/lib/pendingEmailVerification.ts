const STORAGE_KEY = "kraftigo:pending-email-verification";

export type PendingEmailVerification = {
  email: string;
  registeredAt: number;
};

export function setPendingEmailVerification(email: string): void {
  if (typeof window === "undefined") return;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const payload: PendingEmailVerification = {
    email: normalized,
    registeredAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getPendingEmailVerification(): PendingEmailVerification | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingEmailVerification>;
    if (typeof parsed.email !== "string" || !parsed.email.trim()) return null;
    return {
      email: parsed.email.trim().toLowerCase(),
      registeredAt:
        typeof parsed.registeredAt === "number" && Number.isFinite(parsed.registeredAt)
          ? parsed.registeredAt
          : Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearPendingEmailVerification(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
