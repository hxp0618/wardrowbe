import { reorderByIds } from './reorder-utils'

export interface ReorderableFolder {
  id: string
  position: number
}

export function reorderFoldersLocally<T extends ReorderableFolder>(
  folders: T[],
  draggedId: string,
  targetId: string,
): T[] {
  return reorderByIds(folders, draggedId, targetId, (folder, index) => ({
    ...folder,
    position: index,
  }))
}
