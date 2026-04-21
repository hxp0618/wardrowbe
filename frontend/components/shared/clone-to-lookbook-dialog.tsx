'use client';

import { useEffect, useState } from 'react';
import { enUS, zhCN } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCloneToLookbook } from '@/lib/hooks/use-studio';
import { getErrorMessage } from '@/lib/api';
import { getOccasionLabel } from '@/lib/taxonomy-i18n';
import { formatDefaultLookbookName } from '@/lib/outfit-i18n';

interface CloneToLookbookDialogProps {
  open: boolean;
  sourceOutfitId: string;
  sourceOccasion: string;
  onClose: () => void;
  onSuccess?: (newOutfitId: string) => void;
}

export function CloneToLookbookDialog({
  open,
  sourceOutfitId,
  sourceOccasion,
  onClose,
  onSuccess,
}: CloneToLookbookDialogProps) {
  const t = useTranslations('cloneToLookbook');
  const tc = useTranslations('common');
  const tt = useTranslations('taxonomy');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? zhCN : enUS;
  const defaultName = formatDefaultLookbookName(sourceOccasion, {
    occasionLabel: (occasion) =>
      getOccasionLabel(occasion, (key) => tt(key as Parameters<typeof tt>[0])),
    dateLocale,
  });
  const [name, setName] = useState(defaultName);
  const clone = useCloneToLookbook(sourceOutfitId);

  useEffect(() => {
    if (open) setName(defaultName);
  }, [defaultName, open]);

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('validation.nameRequired'));
      return;
    }
    try {
      const result = await clone.mutateAsync({ name: trimmed });
      toast.success(t('toasts.saved'));
      onSuccess?.(result.id);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, t('toasts.saveFailed')));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="lookbook-name">{t('name')}</Label>
          <Input
            id="lookbook-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder={t('namePlaceholder')}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={clone.isPending}>
            {tc('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={clone.isPending || !name.trim()}
          >
            {clone.isPending ? t('saving') : tc('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
