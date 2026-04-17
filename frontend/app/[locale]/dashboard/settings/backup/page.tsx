'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Download, Upload, Archive, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAccessToken } from '@/lib/api';
import { getApiMessage } from '@/lib/api-messages';
import { toast } from 'sonner';

interface ImportResult {
  status: string;
  version: number;
  imported: {
    items: number;
    folders: number;
    outfits: number;
    notifications: number;
  };
}

export default function BackupPage() {
  const t = useTranslations('backup');
  const { data: session } = useSession();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    const token = session?.accessToken || getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await fetch('/api/v1/backup/export', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (typeof data.detail === 'string' ? data.detail : data.detail?.message) ||
            getApiMessage('generic'),
        );
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] ||
        `wardrowbe-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t('exportCard.started'));
    } catch (err) {
      const message = err instanceof Error ? err.message : getApiMessage('generic');
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportConfirmed() {
    if (!selectedFile) return;
    setConfirmOpen(false);
    setIsImporting(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      const response = await fetch('/api/v1/backup/import', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: form,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (typeof data.detail === 'string' ? data.detail : data.detail?.message) ||
            t('importCard.failure'),
        );
      }
      const data: ImportResult = await response.json();
      toast.success(
        t('importCard.success', {
          items: data.imported.items,
          folders: data.imported.folders,
          outfits: data.imported.outfits,
          notifications: data.imported.notifications,
        }),
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const message = err instanceof Error ? err.message : t('importCard.failure');
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <Archive className="mt-1 h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('exportCard.title')}
          </CardTitle>
          <CardDescription>{t('exportCard.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('exportCard.preparing')}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t('exportCard.button')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('importCard.title')}
          </CardTitle>
          <CardDescription>{t('importCard.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              disabled={isImporting}
              className="block w-full max-w-md cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
            />
          </div>
          {selectedFile ? (
            <p className="text-sm text-muted-foreground">
              {t('importCard.selectedFile', { name: selectedFile.name })}
            </p>
          ) : null}
          <div>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!selectedFile || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('importCard.uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {t('importCard.button')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5" />
            {t('warning.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t('warning.secrets')}</p>
          <p>{t('warning.size')}</p>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('importCard.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('importCard.confirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('importCard.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirmed}>
              {t('importCard.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
