import { create } from "zustand";
import type { CustomKraft } from "@/types";
import {
  getCustomKrafts,
  getCustomKraftById,
  createCustomKraftDraft,
  uploadCustomKraftDraft,
  publishCustomKraft,
  updateCustomKraftStep1,
  uploadCustomKraftStep1,
  updateCustomKraftStep2,
  updateCustomKraftStep3,
  type GetCustomKraftsParams,
  type CreateCustomKraftPayload,
  type UpdateStep1Payload,
  type UpdateStep2Payload,
  type UpdateStep3Payload,
  type CustomKraftFrequency,
} from "@/lib/api/custom-krafts";
import { isSavedPaymentMethodRequiredError } from "@/lib/paymentCardRequired";

// ─── State Shape ──────────────────────────────────────────────────────────────

interface CustomKraftsState {
  // State
  krafts: CustomKraft[];
  selectedKraft: CustomKraft | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Customer — fetch
  fetchCustomKrafts: (params?: GetCustomKraftsParams) => Promise<void>;
  fetchMyCustomKrafts: () => Promise<void>;
  fetchCustomKraftById: (id: string) => Promise<CustomKraft>;

  // Customer — create draft
  createDraft: (payload: CreateCustomKraftPayload) => Promise<CustomKraft>;
  uploadDraft: (
    payload: Omit<CreateCustomKraftPayload, "photos"> & { photos?: File[] },
  ) => Promise<CustomKraft>;

  // Customer — update draft steps
  updateStep1: (
    id: string,
    payload: UpdateStep1Payload,
  ) => Promise<CustomKraft>;
  uploadStep1: (
    id: string,
    payload: { description: string; photos?: File[]; roughCategoryId?: string },
  ) => Promise<CustomKraft>;
  updateStep2: (
    id: string,
    payload: UpdateStep2Payload,
  ) => Promise<CustomKraft>;
  updateStep3: (
    id: string,
    payload: UpdateStep3Payload,
  ) => Promise<CustomKraft>;

  // Customer — publish
  publishKraft: (id: string) => Promise<CustomKraft>;

  // Selectors
  getMyDrafts: () => CustomKraft[];
  getPublishedKrafts: () => CustomKraft[];

  // Helpers
  clearError: () => void;
  clearSelectedKraft: () => void;

  // Pending draft data (accumulates across steps before the real API call on Budget page)
  pendingDraftData: {
    // Step 1
    description: string;
    roughCategoryId?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    photos: File[];
    // Step 2 (added by Details page)
    addressId?: string;
    bookingHours?: number;
    frequency?: CustomKraftFrequency;
  } | null;
  setPendingDraftData: (data: {
    description: string;
    roughCategoryId?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    photos: File[];
    addressId?: string;
    bookingHours?: number;
    frequency?: CustomKraftFrequency;
  }) => void;
  clearPendingDraftData: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCustomKraftsStore = create<CustomKraftsState>()((set, get) => ({
  // Initial state
  krafts: [],
  selectedKraft: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  pendingDraftData: null,

  // ── Fetch ──────────────────────────────────────────────────────────────────

  fetchCustomKrafts: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const krafts = await getCustomKrafts(params);
      set({ krafts, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to load custom krafts",
        isLoading: false,
      });
    }
  },

  fetchMyCustomKrafts: async () => {
    set({ isLoading: true, error: null });
    try {
      const krafts = await getCustomKrafts({ userId: "me" });
      set({ krafts, isLoading: false });
    } catch (err: any) {
      set({
        error:
          err.response?.data?.message || "Failed to load your custom krafts",
        isLoading: false,
      });
    }
  },

  fetchCustomKraftById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const kraft = await getCustomKraftById(id);
      set({ selectedKraft: kraft, isLoading: false });
      return kraft;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to load custom kraft",
        isLoading: false,
      });
      throw err;
    }
  },

  // ── Create Draft ───────────────────────────────────────────────────────────

  createDraft: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const kraft = await createCustomKraftDraft(payload);
      set((state) => ({
        krafts: [kraft, ...state.krafts],
        selectedKraft: kraft,
        isSubmitting: false,
      }));
      return kraft;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to create draft",
        isSubmitting: false,
      });
      throw err;
    }
  },

  uploadDraft: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const kraft = await uploadCustomKraftDraft(payload);
      set((state) => ({
        krafts: [kraft, ...state.krafts],
        selectedKraft: kraft,
        isSubmitting: false,
      }));
      return kraft;
    } catch (err: any) {
      set({
        error:
          err.response?.data?.message || "Failed to create draft with photos",
        isSubmitting: false,
      });
      throw err;
    }
  },

  // ── Update Steps ───────────────────────────────────────────────────────────

  updateStep1: async (id, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await updateCustomKraftStep1(id, payload);
      set((state) => ({
        krafts: state.krafts.map((k) => (k.id === id ? updated : k)),
        selectedKraft:
          state.selectedKraft?.id === id ? updated : state.selectedKraft,
        isSubmitting: false,
      }));
      return updated;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to update step 1",
        isSubmitting: false,
      });
      throw err;
    }
  },

  uploadStep1: async (id, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await uploadCustomKraftStep1(id, payload);
      set((state) => ({
        krafts: state.krafts.map((k) => (k.id === id ? updated : k)),
        selectedKraft:
          state.selectedKraft?.id === id ? updated : state.selectedKraft,
        isSubmitting: false,
      }));
      return updated;
    } catch (err: any) {
      set({
        error:
          err.response?.data?.message || "Failed to upload photos for step 1",
        isSubmitting: false,
      });
      throw err;
    }
  },

  updateStep2: async (id, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await updateCustomKraftStep2(id, payload);
      set((state) => ({
        krafts: state.krafts.map((k) => (k.id === id ? updated : k)),
        selectedKraft:
          state.selectedKraft?.id === id ? updated : state.selectedKraft,
        isSubmitting: false,
      }));
      return updated;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to update step 2",
        isSubmitting: false,
      });
      throw err;
    }
  },

  updateStep3: async (id, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const updated = await updateCustomKraftStep3(id, payload);
      set((state) => ({
        krafts: state.krafts.map((k) => (k.id === id ? updated : k)),
        selectedKraft:
          state.selectedKraft?.id === id ? updated : state.selectedKraft,
        isSubmitting: false,
      }));
      return updated;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to update step 3",
        isSubmitting: false,
      });
      throw err;
    }
  },

  // ── Publish ────────────────────────────────────────────────────────────────

  publishKraft: async (id) => {
    set({ isSubmitting: true, error: null });
    try {
      const published = await publishCustomKraft(id);
      set((state) => ({
        krafts: state.krafts.map((k) => (k.id === id ? published : k)),
        selectedKraft:
          state.selectedKraft?.id === id ? published : state.selectedKraft,
        isSubmitting: false,
      }));
      return published;
    } catch (err: any) {
      if (isSavedPaymentMethodRequiredError(err)) {
        set({ isSubmitting: false });
        throw err;
      }
      set({
        error: err.response?.data?.message || "Failed to publish custom kraft",
        isSubmitting: false,
      });
      throw err;
    }
  },

  // ── Selectors ──────────────────────────────────────────────────────────────

  getMyDrafts: () => get().krafts.filter((k) => k.status === "DRAFT"),

  getPublishedKrafts: () =>
    get().krafts.filter((k) => k.status === "PUBLISHED"),

  // ── Helpers ────────────────────────────────────────────────────────────────

  clearError: () => set({ error: null }),
  clearSelectedKraft: () => set({ selectedKraft: null }),

  setPendingDraftData: (data) => set({ pendingDraftData: data }),
  clearPendingDraftData: () => set({ pendingDraftData: null }),
}));
