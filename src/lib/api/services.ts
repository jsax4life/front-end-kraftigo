import api from '@/lib/axios'
import type { Service, ServiceCategory } from '@/types'

export interface ServiceSearchParams {
  // Search terms
  q?: string
  search?: string
  query?: string
  // Filters
  categoryId?: string
  lat?: number
  lng?: number
  radiusKm?: number
  minPrice?: number
  maxPrice?: number
  minRating?: number
  artisanLevel?: string
  availability?: boolean
  // Ranking weights
  distanceWeight?: number
  ratingWeight?: number
  completionWeight?: number
  availabilityWeight?: number
  // Legacy/local params (kept for compatibility)
  category?: string
  location?: string
  min_price?: number
  max_price?: number
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'newest'
  // Pagination
  offset?: number
  page?: number
  limit?: number
}

export interface ServicesResponse {
  data: Service[]
  total: number
  page: number
  limit: number
}

export interface ServiceSkillGroup {
  category: {
    id: string
    name: string
    description?: string
    iconUrl?: string | null
  }
  skills: {
    id: string
    name: string
    description?: string
    iconUrl?: string | null
  }[]
}

/** GET /api/services — all active service listings */
export const getServices = async (params?: ServiceSearchParams): Promise<ServicesResponse> => {
  const response = await api.get('/api/services', { params })
  return response.data
}

/** GET /api/services/categories — all service categories */
export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const response = await api.get('/api/services/categories')
  return response.data
}

/** GET /api/services/skills/groups — grouped skills by category */
export const getServiceSkillGroups = async (): Promise<ServiceSkillGroup[]> => {
  const response = await api.get('/api/services/skills/groups')
  return response.data
}

/** GET /api/services/search — advanced search with ranking */
export const searchServices = async (params: ServiceSearchParams): Promise<ServicesResponse> => {
  const response = await api.get('/api/services/search', { params })
  return response.data
}

/** GET /api/services/{id} — single service listing */
export const getServiceById = async (id: string): Promise<Service> => {
  const response = await api.get(`/api/services/${id}`)
  return response.data
}

/** GET /api/services/my-listings — artisan's own listings */
export const getMyServiceListings = async (): Promise<Service[]> => {
  const response = await api.get('/api/services/my-listings')
  return response.data
}
