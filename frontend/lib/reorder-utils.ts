export interface ReorderableItem {
  id: string
}

export function reorderByIds<T extends ReorderableItem>(
  items: T[],
  draggedId: string,
  targetId: string,
  mapItem: (item: T, index: number) => T = (item) => item,
): T[] {
  const next = [...items]
  const fromIndex = next.findIndex((item) => item.id === draggedId)
  const toIndex = next.findIndex((item) => item.id === targetId)

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return next
  }

  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)

  return next.map((item, index) => mapItem(item, index))
}
