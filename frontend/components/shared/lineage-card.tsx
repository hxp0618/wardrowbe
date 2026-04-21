'use client';

import { ArrowRight, BookmarkCheck } from 'lucide-react';
import { enUS, zhCN } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { getOccasionLabel } from '@/lib/taxonomy-i18n';
import { formatShortOutfitDate, getOutfitTitle } from '@/lib/outfit-i18n';
import { useOutfit } from '@/lib/hooks/use-outfits';
import type { Outfit } from '@/lib/hooks/use-outfits';

interface LineageCardProps {
  outfit: Outfit;
}

export function LineageCard({ outfit }: LineageCardProps) {
  const t = useTranslations('lineageCard');
  const tt = useTranslations('taxonomy');
  const tc = useTranslations('outfitCard');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const replacesId = outfit.replaces_outfit_id;
  const clonedFromId = outfit.cloned_from_outfit_id;

  const { data: referenced } = useOutfit(replacesId ?? clonedFromId ?? undefined);

  if (!replacesId && !clonedFromId) return null;
  if (!referenced) return null;

  const isReplacement = !!replacesId;
  const Icon = isReplacement ? ArrowRight : BookmarkCheck;
  const referencedOccasion = getOccasionLabel(
    referenced.occasion,
    (key) => tt(key as Parameters<typeof tt>[0]),
  );
  const referencedTitle = getOutfitTitle(referenced, {
    occasionLabel: () => referencedOccasion,
    outfitLabel: tc('outfit'),
  });

  const label = isReplacement
    ? t('replacement', {
        occasion: referencedOccasion,
        date: referenced.scheduled_for
          ? formatShortOutfitDate(referenced.scheduled_for, { dateLocale })
          : 'none',
      })
    : t('fromLookbook', { name: referencedTitle });

  return (
    <Card className="border-muted bg-muted/30">
      <CardContent className="p-3">
        <Link
          href={`/dashboard/outfits/${referenced.id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </Link>
      </CardContent>
    </Card>
  );
}
