import api from "@/lib/axios";
import type { Booking } from "@/types";
import { normalizeBookingDetailResponse } from "@/lib/api/bookings";

export type ArrivalPinResponse = {
  bookingId: string;
  arrivalPin: string;
  expiresAt: string;
};

export type CompletionPaymentAuthorization = {
  bookingId: string;
  paymentIntentId: string;
  clientSecret: string;
};

export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVING" | "RESOLVED";

export type SafetyDispute = {
  id: string;
  bookingId: string;
  reason: string;
  description?: string | null;
  status: DisputeStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
};

export type CreateSafetyDisputePayload = {
  bookingId: string;
  reason: string;
  description: string;
};

export type SubmitDisputeEvidencePayload = {
  statement: string;
  attachments?: File[];
};

export const DISPUTE_EVIDENCE_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
]);
export const DISPUTE_EVIDENCE_MAX_FILES = 5;
export const DISPUTE_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function unwrap(value: unknown): unknown {
  const root = asRecord(value);
  return root.data ?? root.booking ?? root.dispute ?? value;
}

function pickString(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function normalizeSafetyDispute(value: unknown): SafetyDispute {
  const row = asRecord(unwrap(value));
  return {
    ...row,
    id: pickString(row, "id") ?? "",
    bookingId: pickString(row, "bookingId", "booking_id") ?? "",
    reason: pickString(row, "reason") ?? "",
    description: pickString(row, "description") ?? null,
    status: (pickString(row, "status") ?? "OPEN") as DisputeStatus,
    createdAt: pickString(row, "createdAt", "created_at") ?? null,
    updatedAt: pickString(row, "updatedAt", "updated_at") ?? null,
  };
}

export async function generateArrivalPin(bookingId: string): Promise<ArrivalPinResponse> {
  const { data } = await api.post(`/api/bookings/${bookingId}/arrival-pin`);
  const row = asRecord(unwrap(data));
  const arrivalPin = pickString(row, "arrivalPin", "arrival_pin") ?? "";
  if (!/^\d{6}$/.test(arrivalPin)) {
    throw new Error("The server returned an invalid arrival PIN.");
  }
  return {
    bookingId: pickString(row, "bookingId", "booking_id") ?? bookingId,
    arrivalPin,
    expiresAt: pickString(row, "expiresAt", "expires_at") ?? "",
  };
}

export async function reportKrafterNotHere(
  bookingId: string,
  details: string,
): Promise<unknown> {
  const { data } = await api.post(`/api/bookings/${bookingId}/krafter-not-here`, {
    details: details.trim(),
  });
  return data;
}

export async function confirmBookingCompletion(bookingId: string): Promise<Booking> {
  const { data } = await api.post(`/api/bookings/${bookingId}/confirm-completion`);
  return normalizeBookingDetailResponse(data);
}

export async function disputeBookingCompletion(
  bookingId: string,
  payload: { reason: string; description: string },
): Promise<SafetyDispute> {
  const { data } = await api.post(`/api/bookings/${bookingId}/dispute-completion`, {
    reason: payload.reason.trim(),
    description: payload.description.trim(),
  });
  return normalizeSafetyDispute(data);
}

export async function reauthorizeCompletionPayment(
  bookingId: string,
  savedPaymentMethodId: string,
): Promise<CompletionPaymentAuthorization> {
  const { data } = await api.post(
    `/api/bookings/${bookingId}/reauthorize-completion-payment`,
    { savedPaymentMethodId },
  );
  const row = asRecord(unwrap(data));
  const clientSecret = pickString(row, "clientSecret", "client_secret") ?? "";
  if (!clientSecret) throw new Error("Payment authorization response is missing a client secret.");
  return {
    bookingId: pickString(row, "bookingId", "booking_id") ?? bookingId,
    paymentIntentId: pickString(row, "paymentIntentId", "payment_intent_id") ?? "",
    clientSecret,
  };
}

export async function createSafetyDispute(
  payload: CreateSafetyDisputePayload,
): Promise<SafetyDispute> {
  const { data } = await api.post("/api/disputes", {
    bookingId: payload.bookingId,
    reason: payload.reason.trim(),
    description: payload.description.trim(),
  });
  return normalizeSafetyDispute(data);
}

export async function getMySafetyDisputes(): Promise<SafetyDispute[]> {
  const { data } = await api.get("/api/disputes/my");
  const root = asRecord(data);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(root.data)
      ? root.data
      : Array.isArray(root.disputes)
        ? root.disputes
        : [];
  return rows.map(normalizeSafetyDispute);
}

export function validateDisputeEvidence(payload: SubmitDisputeEvidencePayload): string | null {
  const statementLength = payload.statement.trim().length;
  if (statementLength < 5 || statementLength > 5_000) {
    return "Statement must contain between 5 and 5,000 characters.";
  }
  const attachments = payload.attachments ?? [];
  if (attachments.length > DISPUTE_EVIDENCE_MAX_FILES) {
    return `Attach no more than ${DISPUTE_EVIDENCE_MAX_FILES} files.`;
  }
  for (const file of attachments) {
    if (!DISPUTE_EVIDENCE_ALLOWED_TYPES.has(file.type)) {
      return `${file.name} has an unsupported file type.`;
    }
    if (file.size > DISPUTE_EVIDENCE_MAX_BYTES) {
      return `${file.name} is larger than 10 MB.`;
    }
  }
  return null;
}

export async function submitDisputeEvidence(
  disputeId: string,
  payload: SubmitDisputeEvidencePayload,
): Promise<unknown> {
  const validationError = validateDisputeEvidence(payload);
  if (validationError) throw new Error(validationError);

  const formData = new FormData();
  formData.append("statement", payload.statement.trim());
  for (const file of payload.attachments ?? []) {
    formData.append("attachments", file);
  }
  const { data } = await api.post(`/api/disputes/${disputeId}/evidence`, formData);
  return data;
}
