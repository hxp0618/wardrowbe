import { describe, expect, it } from 'vitest'

import { reorderFoldersLocally } from '@/lib/folder-utils'

describe('reorderFoldersLocally', () => {
  it('moves the dragged folder before the target folder and rewrites positions', () => {
    const result = reorderFoldersLocally(
      [
        { id: 'a', name: 'A', position: 0 },
        { id: 'b', name: 'B', position: 1 },
        { id: 'c', name: 'C', position: 2 },
      ],
      'c',
      'a',
    )

    expect(result.map((folder) => folder.id)).toEqual(['c', 'a', 'b'])
    expect(result.map((folder) => folder.position)).toEqual([0, 1, 2])
  })
})
