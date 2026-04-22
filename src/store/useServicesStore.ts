import { create } from 'zustand'
import type { Service, ServiceCategory } from '@/types'
import {
  getServices,
  getServiceCategories,
  searchServices,
  getServiceById,
  type ServiceSearchParams,
} from '@/lib/api/services'

interface ServicesState {
  // State
  services: Service[]
  categories: ServiceCategory[]
  selectedService: Service | null
  searchResults: Service[] | null
  isLoading: boolean
  isSearching: boolean
  error: string | null

  // Actions
  fetchServices: (params?: ServiceSearchParams) => Promise<void>
  fetchCategories: () => Promise<void>
  searchServices: (params: ServiceSearchParams) => Promise<void>
  fetchServiceById: (id: string) => Promise<Service>
  clearSearch: () => void
  clearError: () => void
}

export const useServicesStore = create<ServicesState>()((set, get) => ({
  // Initial state
  services: [],
  categories: [],
  selectedService: null,
  searchResults: null,
  isLoading: false,
  isSearching: false,
  error: null,

  fetchServices: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await getServices(params)
      set({ services: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load services', isLoading: false })
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await getServiceCategories()
      set({ categories, error: null })
    } catch (err: any) {
      console.error('Failed to load categories:', err)
      set({
        error: err.response?.data?.message || 'Failed to load categories',
      })
    }
  },

  searchServices: async (params) => {
    set({ isSearching: true, error: null })
    try {
      const response = await searchServices(params)
      set({ searchResults: response.data, isSearching: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Search failed', isSearching: false })
    }
  },

  fetchServiceById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const service = await getServiceById(id)
      set({ selectedService: service, isLoading: false })
      return service
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load service', isLoading: false })
      throw err
    }
  },

  clearSearch: () => set({ searchResults: null }),
  clearError: () => set({ error: null }),
}))
