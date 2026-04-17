'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { api, ApiError, setAccessToken } from '@/lib/api';
import { useItems } from '@/lib/hooks/use-items';
import { toLocalISODate } from '@/lib/date-utils';
import { Item, ManualOutfitRequest, OCCASIONS, Outfit } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ManualOutfitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (outfit: Outfit) => void;
}

const GROUP_ORDER = ['top', 'bottom', 'outerwear', 'shoes', 'accessory', 'other'] as const;
type GroupKey = (typeof GROUP_ORDER)[number];

const TYPE_TO_GROUP: Record<string, GroupKey> = {
  top: 'top',
  shirt: 'top',
  tshirt: 'top',
  sweater: 'top',
  blouse: 'top',
  bottom: 'bottom',
  pants: 'bottom',
  jeans: 'bottom',
  skirt: 'bottom',
  shorts: 'bottom',
  outerwear: 'outerwear',
  jacket: 'outerwear',
  coat: 'outerwear',
  shoes: 'shoes',
  sneakers: 'shoes',
  boots: 'shoes',
  accessory: 'accessory',
  accessories: 'accessory',
  hat: 'accessory',
  bag: 'accessory',
};

function groupOf(item: Item): GroupKey {
  const key = (item.type || '').toLowerCase();
  return TYPE_TO_GROUP[key] ?? 'other';
}

export function ManualOutfitDialog({ open, onOpenChange, onCreated }: ManualOutfitDialogProps) {
  const t = useTranslations('manualOutfit');
  const tc = useTranslations('common');
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useItems({
    is_archived: false,
    sort_by: 'wear_count',
    sort_order: 'desc',
  });

  const allItems = useMemo(() => data?.items ?? [], [data]);
  const grouped = useMemo(() => {
    const result: Record<GroupKey, Item[]> = {
      top: [],
      bottom: [],
      outerwear: [],
      shoes: [],
      accessory: [],
      other: [],
    };
    for (const item of allItems) {
      result[groupOf(item)].push(item);
    }
    return result;
  }, [allItems]);

  const [selected, setSelected] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string>('casual');
  const [scheduledFor, setScheduledFor] = useState<string>(() => toLocalISODate(new Date()));
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [useForLearning, setUseForLearning] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
    setTimeout(() => {
      setSelected([]);
      setScheduledFor(toLocalISODate(new Date()));
      setName('');
      setNotes('');
      setUseForLearning(true);
    }, 200);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error(t('selectAtLeastOne'));
      return;
    }
    if (session?.accessToken) setAccessToken(session.accessToken as string);
    setSubmitting(true);
    try {
      const payload: ManualOutfitRequest = {
        item_ids: selected,
        occasion,
        scheduled_for: scheduledFor || undefined,
        name: name.trim() || undefined,
        notes: notes.trim() || undefined,
        use_for_learning: useForLearning,
      };
      const outfit = await api.post<Outfit>('/outfits', payload);
      toast.success(t('createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['outfits'] });
      onCreated?.(outfit);
      onOpenChange(false);
      setSelected([]);
      setScheduledFor(toLocalISODate(new Date()));
      setName('');
      setNotes('');
      setUseForLearning(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('createFailed');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItems = useMemo(
    () => allItems.filter((i) => selected.includes(i.id)),
    [allItems, selected],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[1fr_240px] flex-1 min-h-0">
          {/* Left: item picker */}
          <div className="flex flex-col min-h-0">
            <ScrollArea className="flex-1 rounded-md border">
              <div className="p-3 space-y-4">
                {isLoading && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoading && allItems.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    {t('noItems')}
                  </p>
                )}
                {!isLoading &&
                  GROUP_ORDER.filter((g) => grouped[g].length > 0).map((g) => (
                    <div key={g} className="space-y-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t(`group.${g}`)}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {grouped[g].map((item) => {
                          const isSelected = selected.includes(item.id);
                          const thumb = item.thumbnail_url || item.image_url;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={cn(
                                'relative aspect-square rounded-md border overflow-hidden group hover:border-primary transition-colors',
                                isSelected && 'border-primary ring-2 ring-primary/40',
                              )}
                            >
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt={item.name || item.type}
                                  fill
                                  sizes="120px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="h-full w-full bg-muted" />
                              )}
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: config + preview */}
          <div className="space-y-3 flex flex-col min-h-0">
            <div className="space-y-1">
              <Label htmlFor="manual-occasion">{t('occasion')}</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger id="manual-occasion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="manual-date">{t('date')}</Label>
              <Input
                id="manual-date"
                type="date"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="manual-name">{t('name')}</Label>
              <Input
                id="manual-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                maxLength={100}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="manual-notes">{t('notes')}</Label>
              <Textarea
                id="manual-notes"
                placeholder={t('notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="space-y-0.5">
                <Label htmlFor="use-learning" className="text-sm cursor-pointer">
                  {t('useForLearning')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('useForLearningHint')}
                </p>
              </div>
              <Switch
                id="use-learning"
                checked={useForLearning}
                onCheckedChange={setUseForLearning}
              />
            </div>

            <div className="space-y-1 min-h-0 flex flex-col">
              <Label>{t('selectedCount', { count: selected.length })}</Label>
              <ScrollArea className="flex-1 rounded-md border min-h-[80px]">
                <div className="p-2 flex flex-wrap gap-1">
                  {selectedItems.length === 0 && (
                    <p className="text-xs text-muted-foreground p-1">
                      {t('emptyPreview')}
                    </p>
                  )}
                  {selectedItems.map((item) => {
                    const thumb = item.thumbnail_url || item.image_url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="relative h-10 w-10 rounded border overflow-hidden hover:opacity-80"
                        title={item.name || item.type}
                      >
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || selected.length === 0}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
