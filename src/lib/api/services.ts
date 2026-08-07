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

function normalizeSkillGroupEntry(entry: unknown): ServiceSkillGroup | null {
  if (!entry || typeof entry !== 'object') return null
  const obj = entry as Record<string, unknown>
  const catRaw = obj.category ?? obj.serviceCategory ?? obj.service_category
  if (!catRaw || typeof catRaw !== 'object') return null
  const cat = catRaw as Record<string, unknown>
  if (typeof cat.id !== 'string' || typeof cat.name !== 'string') return null

  const skillsRaw = obj.skills
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw
        .filter(
          (s): s is ServiceSkillGroup['skills'][number] =>
            s !== null &&
            typeof s === 'object' &&
            typeof (s as Record<string, unknown>).id === 'string' &&
            typeof (s as Record<string, unknown>).name === 'string',
        )
        .map((s) => {
          const skill = s as Record<string, unknown>
          return {
            id: String(skill.id),
            name: String(skill.name),
            description:
              typeof skill.description === 'string' ? skill.description : undefined,
            iconUrl:
              typeof skill.iconUrl === 'string'
                ? skill.iconUrl
                : skill.iconUrl === null
                  ? null
                  : undefined,
          }
        })
    : []

  return {
    category: {
      id: cat.id,
      name: cat.name,
      description: typeof cat.description === 'string' ? cat.description : undefined,
      iconUrl:
        typeof cat.iconUrl === 'string'
          ? cat.iconUrl
          : cat.iconUrl === null
            ? null
            : undefined,
    },
    skills,
  }
}

function normalizeServiceSkillGroups(data: unknown): ServiceSkillGroup[] {
  let list: unknown[] = []
  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object') {
    const root = data as Record<string, unknown>
    for (const key of [
      'groups',
      'data',
      'items',
      'skillGroups',
      'skill_groups',
      'categories',
    ]) {
      const val = root[key]
      if (Array.isArray(val)) {
        list = val
        break
      }
    }
  }
  return list
    .map(normalizeSkillGroupEntry)
    .filter((group): group is ServiceSkillGroup => group !== null)
}

/** GET /api/services/skills/groups — grouped skills by category */
export const getServiceSkillGroups = async (): Promise<ServiceSkillGroup[]> => {
  const response = await api.get('/api/services/skills/groups')
  return normalizeServiceSkillGroups(response.data)
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
