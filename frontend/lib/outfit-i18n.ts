import { format, formatDistanceToNow, parseISO, type Locale } from 'date-fns'

import type { Outfit } from '@/lib/hooks/use-outfits'

export type OutfitBadgeKey =
  | 'replacement'
  | 'worn'
  | 'studio'
  | 'pairing'
  | 'ai'

export function getOutfitBadgeKey(
  outfit: Pick<
    Outfit,
    'replaces_outfit_id' | 'cloned_from_outfit_id' | 'source' | 'scheduled_for'
  >,
): OutfitBadgeKey {
  if (outfit.replaces_outfit_id) return 'replacement'
  if (outfit.cloned_from_outfit_id && outfit.source === 'manual' && outfit.scheduled_for) {
    return 'worn'
  }
  if (outfit.source === 'manual') return 'studio'
  if (outfit.source === 'pairing') return 'pairing'
  return 'ai'
}

function joinLocalizedWords(left: string, right: string): string {
  if (!left) return right
  if (!right) return left
  const needsSpace = /[A-Za-z0-9]$/.test(left) && /^[A-Za-z0-9]/.test(right)
  return `${left}${needsSpace ? ' ' : ''}${right}`
}

export function getOutfitTitle(
  outfit: Pick<Outfit, 'name' | 'highlights' | 'occasion'>,
  options: {
    occasionLabel: (occasion: string) => string
    outfitLabel: string
  },
): string {
  if (outfit.name) return outfit.name
  if (outfit.highlights && outfit.highlights.length > 0) return outfit.highlights[0]
  return joinLocalizedWords(options.occasionLabel(outfit.occasion), options.outfitLabel)
}

export function formatOutfitMetaLabel(
  outfit: Pick<Outfit, 'scheduled_for'>,
  options: {
    dateLocale: Locale
    lookbookTemplateLabel: string
  },
): string {
  if (!outfit.scheduled_for) return options.lookbookTemplateLabel
  try {
    return formatDistanceToNow(parseISO(outfit.scheduled_for), {
      addSuffix: true,
      locale: options.dateLocale,
    })
  } catch {
    return outfit.scheduled_for
  }
}

export function formatShortOutfitDate(
  date: string,
  options: {
    dateLocale: Locale
  },
): string {
  const parsed = parseISO(date)
  const pattern = options.dateLocale.code?.toLowerCase().startsWith('zh') ? 'M月d日' : 'MMM d'
  return format(parsed, pattern, { locale: options.dateLocale })
}

export function formatLongOutfitDate(
  date: string,
  options: {
    dateLocale: Locale
  },
): string {
  const parsed = parseISO(date)
  const pattern = options.dateLocale.code?.toLowerCase().startsWith('zh')
    ? 'yyyy年M月d日'
    : 'MMM d, yyyy'
  return format(parsed, pattern, { locale: options.dateLocale })
}

export function formatDefaultLookbookName(
  occasion: string,
  options: {
    occasionLabel: (occasion: string) => string
    dateLocale: Locale
  },
): string {
  const datePattern = options.dateLocale.code?.toLowerCase().startsWith('zh')
    ? 'M月d日'
    : 'MMM d'
  return `${options.occasionLabel(occasion)} - ${format(new Date(), datePattern, {
    locale: options.dateLocale,
  })}`
}
