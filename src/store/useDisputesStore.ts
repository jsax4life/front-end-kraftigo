import { create } from "zustand";
import {
  createSafetyDispute,
  getMySafetyDisputes,
  submitDisputeEvidence,
  type CreateSafetyDisputePayload,
  type SafetyDispute,
  type SubmitDisputeEvidencePayload,
} from "@/lib/api/fraudPrevention";

interface DisputesState {
  disputes: SafetyDispute[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchMyDisputes: () => Promise<SafetyDispute[]>;
  openDispute: (payload: CreateSafetyDisputePayload) => Promise<SafetyDispute>;
  submitEvidence: (
    disputeId: string,
    payload: SubmitDisputeEvidencePayload,
  ) => Promise<void>;
}

export const useDisputesStore = create<DisputesState>((set, get) => ({
  disputes: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchMyDisputes: async () => {
    set({ isLoading: true, error: null });
    try {
      const disputes = await getMySafetyDisputes();
      set({ disputes, isLoading: false });
      return disputes;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not load disputes.";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  openDispute: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const created = await createSafetyDispute(payload);
      set((state) => ({
        disputes: [created, ...state.disputes.filter((d) => d.id !== created.id)],
        isSubmitting: false,
      }));
      return created;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not open a dispute.";
      set({ error: message, isSubmitting: false });
      throw err;
    }
  },

  submitEvidence: async (disputeId, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      await submitDisputeEvidence(disputeId, payload);
      await get().fetchMyDisputes();
      set({ isSubmitting: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not submit evidence.";
      set({ error: message, isSubmitting: false });
      throw err;
    }
  },
}));
