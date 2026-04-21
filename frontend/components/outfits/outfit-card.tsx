'use client';

import Image from 'next/image';
import { enUS, zhCN } from 'date-fns/locale';
import {
  BookmarkCheck,
  Layers,
  RefreshCw,
  Shirt,
  Sparkles,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { getOccasionLabel } from '@/lib/taxonomy-i18n';
import {
  formatOutfitMetaLabel,
  getOutfitBadgeKey,
  getOutfitTitle,
} from '@/lib/outfit-i18n';
import { cn } from '@/lib/utils';
import type { Outfit } from '@/lib/hooks/use-outfits';

interface OutfitCardProps {
  outfit: Outfit;
  onClick?: () => void;
}

function getSourceBadge(
  badgeKey: ReturnType<typeof getOutfitBadgeKey>,
  t: (key: `badge.${'replacement' | 'worn' | 'studio' | 'pairing' | 'ai'}`) => string,
): {
  label: string;
  icon: React.ReactNode;
  className: string;
} | null {
  if (badgeKey === 'replacement') {
    return {
      label: t('badge.replacement'),
      icon: <RefreshCw className="h-3 w-3" />,
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    };
  }
  if (badgeKey === 'worn') {
    return {
      label: t('badge.worn'),
      icon: <BookmarkCheck className="h-3 w-3" />,
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
  }
  if (badgeKey === 'studio') {
    return {
      label: t('badge.studio'),
      icon: <Shirt className="h-3 w-3" />,
      className: 'bg-purple-100 text-purple-700 border-purple-200',
    };
  }
  if (badgeKey === 'pairing') {
    return {
      label: t('badge.pairing'),
      icon: <Layers className="h-3 w-3" />,
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    };
  }
  return {
    label: t('badge.ai'),
    icon: <Sparkles className="h-3 w-3" />,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  };
}

export function OutfitCard({ outfit, onClick }: OutfitCardProps) {
  const t = useTranslations('outfitCard');
  const tt = useTranslations('taxonomy');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const badge = getSourceBadge(getOutfitBadgeKey(outfit), t);
  const visibleItems = outfit.items.slice(0, 4);
  const overflow = outfit.items.length - visibleItems.length;
  const occasionLabel = getOccasionLabel(outfit.occasion, (key) => tt(key as Parameters<typeof tt>[0]));
  const title = getOutfitTitle(outfit, {
    occasionLabel: () => occasionLabel,
    outfitLabel: t('outfit'),
  });
  const metaLabel = formatOutfitMetaLabel(outfit, {
    dateLocale,
    lookbookTemplateLabel: t('lookbookTemplate'),
  });

  const content = (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[5/4] bg-muted">
          <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-2">
            {visibleItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="relative rounded overflow-hidden bg-background"
              >
                {item.thumbnail_url || item.image_url ? (
                  <Image
                    src={(item.thumbnail_url || item.image_url)!}
                    alt={item.name || item.type}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 25vw, 15vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">
                      {item.type}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {overflow > 0 && (
              <div className="relative rounded overflow-hidden bg-background flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  +{overflow}
                </span>
              </div>
            )}
          </div>
          {badge && (
            <div
              className={cn(
                'absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                badge.className
              )}
            >
              {badge.icon}
              <span>{badge.label}</span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-1">
          <h3 className="text-sm font-semibold leading-tight truncate">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {occasionLabel}
            </Badge>
            <span>{metaLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (onClick) return content;
  return (
    <Link href={`/dashboard/outfits/${outfit.id}`} className="block">
      {content}
    </Link>
  );
}
