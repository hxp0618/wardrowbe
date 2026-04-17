'use client';

import { useTranslations } from 'next-intl';
import { X, Trash2, RefreshCw, Loader2, CheckSquare, Square, MinusSquare, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { FolderRef } from '@/lib/types';

export interface BulkSelection {
  mode: 'none' | 'some' | 'all';
  selectedIds: Set<string>;    // Used when mode is 'some'
  excludedIds: Set<string>;    // Used when mode is 'all'
}

interface BulkActionToolbarProps {
  selection: BulkSelection;
  totalItems: number;
  pageItems: number;
  onSelectAll: () => void;
  onClear: () => void;
  onDelete: () => void;
  onReanalyze: () => void;
  isDeleting?: boolean;
  isReanalyzing?: boolean;
  // Folder actions
  folders?: FolderRef[];
  onAddToFolder?: (folderId: string) => void;
  isAddingToFolder?: boolean;
  // Pagination props
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function BulkActionToolbar({
  selection,
  totalItems,
  pageItems,
  onSelectAll,
  onClear,
  onDelete,
  onReanalyze,
  isDeleting = false,
  isReanalyzing = false,
  folders = [],
  onAddToFolder,
  isAddingToFolder = false,
  page,
  pageSize,
  onPageChange,
}: BulkActionToolbarProps) {
  const t = useTranslations('bulkActions');
  const tc = useTranslations('common');
  const tf = useTranslations('folders');
  const selectedCount = selection.mode === 'all'
    ? totalItems - selection.excludedIds.size
    : selection.selectedIds.size;

  // Determine checkbox state
  const isAllSelected = selection.mode === 'all' && selection.excludedIds.size === 0;
  const isPartiallySelected = selection.mode === 'all'
    ? selection.excludedIds.size > 0
    : selection.selectedIds.size > 0 && selection.selectedIds.size < pageItems;
  const hasSelection = selectedCount > 0;

  // Pagination
  const totalPages = Math.ceil(totalItems / pageSize);
  const showPagination = totalPages > 1;

  const deleteConfirmCount =
    selection.mode === 'all' && selection.excludedIds.size === 0
      ? totalItems
      : selectedCount;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 bg-background border rounded-lg shadow-lg px-2 sm:px-4 py-2 sm:py-3 max-w-[calc(100vw-1rem)]">
      {/* Select All Checkbox */}
      <div
        className="flex items-center gap-1 sm:gap-2 cursor-pointer shrink-0"
        onClick={onSelectAll}
      >
        {isAllSelected ? (
          <CheckSquare className="h-5 w-5 text-primary" />
        ) : isPartiallySelected ? (
          <MinusSquare className="h-5 w-5 text-primary" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">
          {isAllSelected ? t('all') : t('selectAll')}
        </span>
      </div>

      <div className="h-4 w-px bg-border shrink-0" />

      <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
        {selectedCount === 0 ? (
          <span className="hidden sm:inline">{t('noneSelected')}</span>
        ) : selection.mode === 'all' && selection.excludedIds.size > 0 ? (
          <>
            <span className="sm:hidden">{totalItems - selection.excludedIds.size}</span>
            <span className="hidden sm:inline">
              {t('allExcept', { count: selection.excludedIds.size })}
            </span>
          </>
        ) : selection.mode === 'all' ? (
          <>
            <span className="sm:hidden">
              {t('all')} ({totalItems})
            </span>
            <span className="hidden sm:inline">{t('allSelected', { count: totalItems })}</span>
          </>
        ) : (
          <>
            <span className="sm:hidden">{selectedCount}</span>
            <span className="hidden sm:inline">{t('selected', { count: selectedCount })}</span>
          </>
        )}
      </span>

      {hasSelection && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-muted-foreground h-8 w-8 shrink-0"
            aria-label={t('clearSelection')}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border shrink-0" />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onReanalyze}
            disabled={isReanalyzing}
            aria-label={t('reanalyze')}
          >
            {isReanalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          {onAddToFolder && folders.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={isAddingToFolder}
                  aria-label={tf('addToFolder')}
                >
                  {isAddingToFolder ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderPlus className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                <DropdownMenuLabel>{tf('addToFolder')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => onAddToFolder(folder.id)}
                  >
                    {folder.icon && <span className="mr-2">{folder.icon}</span>}
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={isDeleting}
                aria-label={tc('delete')}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteTitle', { count: deleteConfirmCount })}</AlertDialogTitle>
                <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {tc('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Pagination */}
      {showPagination && (
        <>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden sm:flex"
              disabled={page === 1}
              onClick={() => onPageChange(1)}
              aria-label={t('firstPage')}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              aria-label={t('previousPage')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-1 sm:px-2 text-sm text-muted-foreground whitespace-nowrap">
              {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label={t('nextPage')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden sm:flex"
              disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)}
              aria-label={t('lastPage')}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
