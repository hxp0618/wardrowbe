import { describe, expect, it } from 'vitest'

import { reorderByIds } from '@/lib/reorder-utils'

describe('reorderByIds', () => {
  it('moves an item to the target position and rewrites the derived field', () => {
    const result = reorderByIds(
      [
        { id: 'a', position: 10 },
        { id: 'b', position: 20 },
        { id: 'c', position: 30 },
      ],
      'c',
      'a',
      (item, index) => ({ ...item, position: index }),
    )

    expect(result.map((item) => item.id)).toEqual(['c', 'a', 'b'])
    expect(result.map((item) => item.position)).toEqual([0, 1, 2])
  })

  it('returns the original order when ids are invalid or unchanged', () => {
    const items = [
      { id: 'a', position: 0 },
      { id: 'b', position: 1 },
    ]

    expect(reorderByIds(items, 'a', 'a', (item, index) => ({ ...item, position: index }))).toEqual(items)
    expect(reorderByIds(items, 'missing', 'a', (item, index) => ({ ...item, position: index }))).toEqual(items)
  })
})
