import Taro from '@tarojs/taro'

import { api, resolveApiOrigin } from '../lib/api'
import { useAuthStore } from '../stores/auth'

import type {
  CreateItemInput,
  Item,
  ItemFilter,
  ItemListResponse,
  ItemTypeCount,
  UpdateItemInput,
} from './types'

function buildItemListParams(
  filters: ItemFilter,
  page: number,
  pageSize: number
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  }

  if (filters.type) params.type = filters.type
  if (filters.search) params.search = filters.search
  if (filters.favorite !== undefined) params.favorite = String(filters.favorite)
  if (filters.needs_wash !== undefined) params.needs_wash = String(filters.needs_wash)
  if (filters.is_archived !== undefined) params.is_archived = String(filters.is_archived)
  if (filters.sort_by) params.sort_by = filters.sort_by
  if (filters.sort_order) params.sort_order = filters.sort_order
  if (filters.folder_id) params.folder_id = filters.folder_id

  return params
}

export function listItems(
  filters: ItemFilter = {},
  page = 1,
  pageSize = 20
): Promise<ItemListResponse> {
  return api.get<ItemListResponse>('/items', {
    params: buildItemListParams(filters, page, pageSize),
  })
}

export function getItem(id: string): Promise<Item> {
  return api.get<Item>(`/items/${id}`)
}

export function listItemTypes(): Promise<ItemTypeCount[]> {
  return api.get<ItemTypeCount[]>('/items/types')
}

export function updateItem(id: string, data: UpdateItemInput): Promise<Item> {
  return api.patch<Item>(`/items/${id}`, data)
}

export function deleteItem(id: string): Promise<void> {
  return api.delete<void>(`/items/${id}`)
}

export function toggleFavorite(id: string, favorite: boolean): Promise<Item> {
  return api.patch<Item>(`/items/${id}`, { favorite })
}

export function toggleNeedsWash(id: string, needsWash: boolean): Promise<Item> {
  return api.patch<Item>(`/items/${id}`, { needs_wash: needsWash })
}

export function reanalyzeItem(id: string): Promise<Item> {
  return api.post<Item>(`/items/${id}/reanalyze`)
}

export function archiveItem(id: string, reason?: string): Promise<Item> {
  return api.post<Item>(`/items/${id}/archive`, reason ? { reason } : undefined)
}

export function unarchiveItem(id: string): Promise<Item> {
  return api.post<Item>(`/items/${id}/unarchive`)
}

export function logWear(
  id: string,
  worn_at?: string,
  occasion?: string
): Promise<Item> {
  return api.post<Item>(`/items/${id}/wear`, { worn_at, occasion })
}

export function logWash(
  id: string,
  washed_at?: string,
  method?: string,
  notes?: string
): Promise<Item> {
  return api.post<Item>(`/items/${id}/wash`, { washed_at, method, notes })
}

export interface WashHistoryEntry {
  id: string
  washed_at: string
  method?: string
  notes?: string
}

export function getWashHistory(id: string): Promise<WashHistoryEntry[]> {
  return api.get<WashHistoryEntry[]>(`/items/${id}/wash-history`)
}

export interface ItemWearStats {
  total_wears: number
  days_since_last_worn: number | null
  average_wears_per_month: number
  wear_by_month: Record<string, number>
  wear_by_day_of_week: Record<string, number>
  most_common_occasion: string | null
}

export function getWearStats(id: string): Promise<ItemWearStats> {
  return api.get<ItemWearStats>(`/items/${id}/wear-stats`)
}

export interface WearHistoryEntry {
  id: string
  worn_at: string
  occasion?: string
  notes?: string
}

export function getWearHistory(id: string, limit = 10): Promise<WearHistoryEntry[]> {
  return api.get<WearHistoryEntry[]>(`/items/${id}/history?limit=${limit}`)
}

export function listColorDistribution(): Promise<Array<{ color: string; count: number }>> {
  return api.get<Array<{ color: string; count: number }>>('/items/colors')
}

function buildUploadHeaders(): Record<string, string> {
  const accessToken =
    useAuthStore.getState().accessToken ?? Taro.getStorageSync<string | undefined>('accessToken')
  const headers: Record<string, string> = {
    'Accept-Language': 'zh-CN',
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

function normalizeUploadResponse<T>(response: { statusCode: number; data: unknown }): T {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error('上传失败，请稍后重试')
  }

  if (typeof response.data === 'string') {
    return JSON.parse(response.data) as T
  }

  return response.data as T
}

function buildPrimaryFormData(fields: CreateItemInput): Record<string, string> {
  const formData: Record<string, string> = {}

  if (fields.type) formData.type = fields.type
  if (fields.subtype) formData.subtype = fields.subtype
  if (fields.name) formData.name = fields.name
  if (fields.brand) formData.brand = fields.brand
  if (fields.notes) formData.notes = fields.notes
  if (fields.favorite !== undefined) formData.favorite = String(fields.favorite)
  if (fields.quantity !== undefined) formData.quantity = String(fields.quantity)

  return formData
}

export async function createItemWithImages(
  filePaths: string[],
  fields: CreateItemInput = {}
): Promise<Item> {
  if (filePaths.length === 0) {
    throw new Error('请至少选择一张图片')
  }

  if (filePaths.length > 5) {
    throw new Error('单品最多支持 5 张图片')
  }

  const [primaryImage, ...additionalImages] = filePaths
  const origin = resolveApiOrigin()
  const headers = buildUploadHeaders()

  const primaryResponse = await Taro.uploadFile({
    url: `${origin}/api/v1/items`,
    filePath: primaryImage,
    name: 'image',
    header: headers,
    formData: buildPrimaryFormData(fields),
  })
  const item = normalizeUploadResponse<Item>(primaryResponse)

  for (const filePath of additionalImages) {
    const extraResponse = await Taro.uploadFile({
      url: `${origin}/api/v1/items/${item.id}/images`,
      filePath,
      name: 'image',
      header: headers,
    })
    normalizeUploadResponse(extraResponse)
  }

  return item
}
