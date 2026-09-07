import api from '@/lib/axios'
import { normalizeHomeProList, type HomeProOfWeek } from '@/lib/api/auth'

export interface KrafterLocationOption {
  city: string
  country: string
  label: string
  krafterCount: number
}

export type BrowseCustomerKraftersParams = {
  locationCity?: string
  locationCountry?: string
  /** Partial search on registration city or baseCity (legacy). */
  city?: string
  limit?: number
  offset?: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function unwrapPayload(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw)
  if (!root) return {}
  return asRecord(root.data) ?? root
}

function normalizeLocationRow(raw: unknown): KrafterLocationOption | null {
  const row = asRecord(raw)
  if (!row) return null
  const city = String(row.city ?? '').trim()
  if (!city) return null
  const country = String(row.country ?? '').trim()
  const label =
    String(row.label ?? '').trim() ||
    (country ? `${city}, ${country}` : city)
  const krafterCount = Number(row.krafterCount ?? row.krafter_count ?? 0) || 0
  return { city, country, label, krafterCount }
}

function unwrapKrafterBrowseList(raw: unknown): unknown {
  const root = unwrapPayload(raw)
  const list =
    root.krafters ??
    root.results ??
    root.items ??
    root.data
  if (Array.isArray(list)) return list
  if (Array.isArray(raw)) return raw
  return []
}

/** GET /api/profile/customer/krafters/locations — chips for location picker. */
export async function getCustomerKrafterLocations(): Promise<KrafterLocationOption[]> {
  const response = await api.get<unknown>('/api/profile/customer/krafters/locations')
  const root = unwrapPayload(response.data)
  const rows = root.locations
  if (!Array.isArray(rows)) return []
  return rows
    .map(normalizeLocationRow)
    .filter((row): row is KrafterLocationOption => row !== null)
    .sort((a, b) => b.krafterCount - a.krafterCount || a.label.localeCompare(b.label))
}

/** GET /api/profile/customer/krafters — browse Krafters (optional location filter). */
export async function browseCustomerKrafters(
  params: BrowseCustomerKraftersParams = {},
): Promise<HomeProOfWeek[]> {
  const query: Record<string, string> = {}
  if (params.locationCity?.trim()) {
    query.locationCity = params.locationCity.trim()
    if (params.locationCountry?.trim()) {
      query.locationCountry = params.locationCountry.trim()
    }
  } else if (params.city?.trim()) {
    query.city = params.city.trim()
  }
  if (params.limit != null) query.limit = String(params.limit)
  if (params.offset != null) query.offset = String(params.offset)

  const response = await api.get<unknown>('/api/profile/customer/krafters', { params: query })
  return normalizeHomeProList(unwrapKrafterBrowseList(response.data))
}

export function locationOptionKey(location: Pick<KrafterLocationOption, 'city' | 'country'>): string {
  return `${location.city}::${location.country}`
}
