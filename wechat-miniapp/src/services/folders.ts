import { api } from '../lib/api'

export interface Folder {
  id: string
  user_id: string
  name: string
  icon?: string | null
  color?: string | null
  position: number
  item_count: number
  created_at: string
  updated_at: string
}

export interface FolderMutationPayload {
  name: string
  icon?: string | null
  color?: string | null
  position?: number
}

export function listFolders(): Promise<Folder[]> {
  return api.get<Folder[]>('/folders')
}

export function createFolder(payload: FolderMutationPayload): Promise<Folder> {
  return api.post<Folder>('/folders', payload)
}

export function updateFolder(id: string, payload: Partial<FolderMutationPayload>): Promise<Folder> {
  return api.patch<Folder>(`/folders/${id}`, payload)
}

export function deleteFolder(id: string): Promise<void> {
  return api.delete<void>(`/folders/${id}`)
}

export function addItemsToFolder(folderId: string, itemIds: string[]): Promise<Folder> {
  return api.post<Folder>(`/folders/${folderId}/items`, { item_ids: itemIds })
}

export function removeItemsFromFolder(folderId: string, itemIds: string[]): Promise<Folder> {
  return api.delete<Folder>(`/folders/${folderId}/items`, { item_ids: itemIds })
}
