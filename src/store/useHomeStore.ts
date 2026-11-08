import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Return src if it's a real, non-empty URL.
 * Returns undefined for:
 *  - null / undefined
 *  - empty / whitespace strings
 *  - placeholder image services (via.placeholder.com, placeholder.com, etc.)
 */
export const normSrc = (url: string | null | undefined): string | undefined => {
  if (!url || url.trim() === "") return undefined;
  try {
    const { hostname } = new URL(url);
    if (hostname.includes("placeholder.com")) return undefined;
  } catch {
    return undefined; // not a valid URL at all
  }
  return url;
};

import {
  getHomeData,
  getPublicHomeData,
  type HomeCategory,
  type HomeProOfWeek,
  type HomeUpcomingBooking,
} from "@/lib/api/auth";
import { useAuthStore } from "@/store/useAuthStore";

interface HomeState {
  // Data
  categories: HomeCategory[];
  prosOfWeek: HomeProOfWeek[];
  /** Guest home (`GET /api/home/public`). */
  featuredKrafters: HomeProOfWeek[];
  kraftersNearYou: HomeProOfWeek[];
  upcoming: HomeUpcomingBooking[];

  // Status
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;

  // Search History
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Actions
  fetchHomeData: (options?: { force?: boolean; publicLimit?: number }) => Promise<void>;
  reset: () => void;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      categories: [],
      prosOfWeek: [],
      featuredKrafters: [],
      kraftersNearYou: [],
      upcoming: [],
      isLoading: false,
      error: null,
      hasFetched: false,
      recentSearches: [],

      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) return state;
          const newSearches = [
            trimmed,
            ...state.recentSearches.filter(
              (q) => q.toLowerCase() !== trimmed.toLowerCase()
            ),
          ].slice(0, 5);
          return { recentSearches: newSearches };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

  fetchHomeData: async (options) => {
    // Avoid duplicate in-flight requests unless explicitly forced (e.g. address switch).
    if (get().isLoading && !options?.force) return;

    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    set({ isLoading: true, error: null });
    try {
      if (isAuthenticated) {
        const data = await getHomeData();
        set({
          categories: data.categories ?? [],
          prosOfWeek: data.prosOfWeek ?? [],
          featuredKrafters: [],
          kraftersNearYou: data.kraftersNearYou ?? [],
          upcoming: data.upcoming ?? [],
          isLoading: false,
          hasFetched: true,
        });
      } else {
        const data = await getPublicHomeData(options?.publicLimit ?? 8);
        set({
          categories: data.categories ?? [],
          prosOfWeek: [],
          featuredKrafters: data.featuredKrafters ?? [],
          kraftersNearYou: [],
          upcoming: [],
          isLoading: false,
          hasFetched: true,
        });
      }
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to load home data",
        isLoading: false,
        hasFetched: true,
      });
    }
  },

  reset: () =>
    set({
      categories: [],
      prosOfWeek: [],
      featuredKrafters: [],
      kraftersNearYou: [],
      upcoming: [],
      isLoading: false,
      error: null,
      hasFetched: false,
      // Note: we don't reset recentSearches as it's user history
    }),
    }),
    {
      name: "kraftigo-home-store",
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
);
