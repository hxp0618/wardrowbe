import { afterEach, describe, expect, it, vi } from 'vitest'
import { enUS, zhCN } from 'date-fns/locale'

import {
  formatDefaultLookbookName,
  formatOutfitMetaLabel,
  getOutfitBadgeKey,
  getOutfitTitle,
} from '@/lib/outfit-i18n'
import type { Outfit } from '@/lib/hooks/use-outfits'

function makeOutfit(overrides: Partial<Outfit> = {}): Outfit {
  return {
    id: 'outfit-1',
    occasion: 'casual',
    scheduled_for: null,
    status: 'accepted',
    source: 'on_demand',
    name: null,
    replaces_outfit_id: null,
    cloned_from_outfit_id: null,
    reasoning: null,
    style_notes: null,
    highlights: null,
    weather: null,
    items: [],
    feedback: null,
    family_ratings: null,
    family_rating_average: null,
    family_rating_count: null,
    created_at: '2026-04-21T10:00:00Z',
    ...overrides,
  }
}

describe('outfit i18n helpers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('derives the outfit badge key from outfit lineage and source', () => {
    expect(getOutfitBadgeKey(makeOutfit({ replaces_outfit_id: 'old-1' }))).toBe('replacement')
    expect(
      getOutfitBadgeKey(
        makeOutfit({
          source: 'manual',
          cloned_from_outfit_id: 'template-1',
          scheduled_for: '2026-04-21',
        }),
      ),
    ).toBe('worn')
    expect(getOutfitBadgeKey(makeOutfit({ source: 'manual' }))).toBe('studio')
    expect(getOutfitBadgeKey(makeOutfit({ source: 'pairing' }))).toBe('pairing')
    expect(getOutfitBadgeKey(makeOutfit({ source: 'scheduled' }))).toBe('ai')
  })

  it('builds a localized default outfit title when no explicit name exists', () => {
    expect(
      getOutfitTitle(
        makeOutfit({ occasion: 'office' }),
        {
          occasionLabel: (occasion) => ({ office: 'Office' }[occasion] ?? occasion),
          outfitLabel: 'Outfit',
        },
      ),
    ).toBe('Office Outfit')

    expect(
      getOutfitTitle(
        makeOutfit({ occasion: 'office' }),
        {
          occasionLabel: (occasion) => ({ office: '通勤' }[occasion] ?? occasion),
          outfitLabel: '穿搭',
        },
      ),
    ).toBe('通勤穿搭')
  })

  it('formats lookbook template and relative scheduled labels with the active locale', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-21T12:00:00Z'))

    expect(
      formatOutfitMetaLabel(makeOutfit(), {
        dateLocale: enUS,
        lookbookTemplateLabel: 'Lookbook template',
      }),
    ).toBe('Lookbook template')

    expect(
      formatOutfitMetaLabel(makeOutfit({ scheduled_for: '2026-04-23' }), {
        dateLocale: enUS,
        lookbookTemplateLabel: 'Lookbook template',
      }),
    ).toContain('1 day')

    expect(
      formatOutfitMetaLabel(makeOutfit({ scheduled_for: '2026-04-23' }), {
        dateLocale: zhCN,
        lookbookTemplateLabel: '灵感模板',
      }),
    ).toContain('1 天')
  })

  it('creates locale-aware default lookbook names', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-21T12:00:00Z'))

    expect(
      formatDefaultLookbookName('office', {
        occasionLabel: (occasion) => ({ office: 'Office' }[occasion] ?? occasion),
        dateLocale: enUS,
      }),
    ).toBe('Office - Apr 21')

    expect(
      formatDefaultLookbookName('office', {
        occasionLabel: (occasion) => ({ office: '通勤' }[occasion] ?? occasion),
        dateLocale: zhCN,
      }),
    ).toBe('通勤 - 4月21日')
  })
})
