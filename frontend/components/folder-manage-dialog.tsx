'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GripVertical, Loader2, Plus, Trash2, Save, X } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  useCreateFolder,
  useDeleteFolder,
  useFolders,
  useReorderFolders,
  useUpdateFolder,
} from '@/lib/hooks/use-folders';
import { reorderFoldersLocally } from '@/lib/folder-utils';
import { Folder } from '@/lib/types';

interface FolderManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FolderManageDialog({ open, onOpenChange }: FolderManageDialogProps) {
  const t = useTranslations('folders');
  const tc = useTranslations('common');
  const { data: folders = [], isLoading } = useFolders();
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const reorderFolders = useReorderFolders();

  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newColor, setNewColor] = useState('');
  const [editing, setEditing] = useState<Record<string, { name: string; icon: string; color: string }>>({});
  const [orderedFolders, setOrderedFolders] = useState<Folder[]>([]);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);

  useEffect(() => {
    setOrderedFolders(folders);
  }, [folders]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createFolder.mutateAsync({
        name: newName.trim(),
        icon: newIcon.trim() || null,
        color: newColor.trim() || null,
      });
      setNewName('');
      setNewIcon('');
      setNewColor('');
      toast.success(t('createSuccess'));
    } catch {
      toast.error(t('createFailed'));
    }
  };

  const handleSave = async (folder: Folder) => {
    const edit = editing[folder.id];
    if (!edit) return;
    try {
      await updateFolder.mutateAsync({
        id: folder.id,
        payload: {
          name: edit.name,
          icon: edit.icon || null,
          color: edit.color || null,
        },
      });
      setEditing((prev) => {
        const next = { ...prev };
        delete next[folder.id];
        return next;
      });
      toast.success(t('updateSuccess'));
    } catch {
      toast.error(t('updateFailed'));
    }
  };

  const handleDelete = async (folder: Folder) => {
    if (!window.confirm(t('deleteConfirm', { name: folder.name }))) return;
    try {
      await deleteFolder.mutateAsync(folder.id);
      toast.success(t('deleteSuccess'));
    } catch {
      toast.error(t('deleteFailed'));
    }
  };

  const startEdit = (folder: Folder) => {
    setEditing((prev) => ({
      ...prev,
      [folder.id]: { name: folder.name, icon: folder.icon ?? '', color: folder.color ?? '' },
    }));
  };

  const handleReorder = async (targetId: string) => {
    if (!draggedFolderId || draggedFolderId === targetId) return;
    const nextOrder = reorderFoldersLocally(orderedFolders, draggedFolderId, targetId);
    setOrderedFolders(nextOrder);
    setDraggedFolderId(null);
    try {
      await reorderFolders.mutateAsync(nextOrder.map((folder) => folder.id));
      toast.success(t('reorderSuccess'));
    } catch {
      setOrderedFolders(folders);
      toast.error(t('reorderFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('manageTitle')}</DialogTitle>
          <DialogDescription>{t('manageDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">{t('createNew')}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 space-y-1">
                <Label htmlFor="folder-name">{t('name')}</Label>
                <Input
                  id="folder-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  maxLength={50}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="folder-icon">{t('icon')}</Label>
                <Input
                  id="folder-icon"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  placeholder="👔"
                  maxLength={32}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="folder-color">{t('color')}</Label>
                <Input
                  id="folder-color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="#7C3AED"
                  maxLength={16}
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || createFolder.isPending}
            >
              {createFolder.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {t('addFolder')}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('existing', { count: folders.length })}</p>
            <ScrollArea className="h-[280px] rounded-md border">
              <div className="p-2 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : folders.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    {t('emptyList')}
                  </p>
                ) : (
                  orderedFolders.map((folder) => {
                    const edit = editing[folder.id];
                    return (
                      <div
                        key={folder.id}
                        className="flex items-center gap-2 rounded-md border p-2"
                        draggable={!edit}
                        onDragStart={() => setDraggedFolderId(folder.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleReorder(folder.id)}
                        onDragEnd={() => setDraggedFolderId(null)}
                      >
                        <button
                          type="button"
                          className="cursor-grab text-muted-foreground hover:text-foreground"
                          aria-label={t('reorder')}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        {edit ? (
                          <div className="grid grid-cols-6 gap-1 flex-1 items-center">
                            <Input
                              className="col-span-3"
                              value={edit.name}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [folder.id]: { ...edit, name: e.target.value },
                                }))
                              }
                            />
                            <Input
                              className="col-span-1"
                              value={edit.icon}
                              placeholder="👔"
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [folder.id]: { ...edit, icon: e.target.value },
                                }))
                              }
                            />
                            <Input
                              className="col-span-2"
                              value={edit.color}
                              placeholder="#7C3AED"
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [folder.id]: { ...edit, color: e.target.value },
                                }))
                              }
                            />
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            {folder.icon && (
                              <span className="text-base" aria-hidden>
                                {folder.icon}
                              </span>
                            )}
                            {folder.color && (
                              <span
                                className="h-3 w-3 rounded-full border"
                                style={{ backgroundColor: folder.color }}
                                aria-hidden
                              />
                            )}
                            <span className="text-sm font-medium truncate">{folder.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              · {folder.item_count}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {edit ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleSave(folder)}
                                disabled={updateFolder.isPending}
                              >
                                <Save className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() =>
                                  setEditing((prev) => {
                                    const next = { ...prev };
                                    delete next[folder.id];
                                    return next;
                                  })
                                }
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => startEdit(folder)}
                            >
                              {t('edit')}
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(folder)}
                            disabled={deleteFolder.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
