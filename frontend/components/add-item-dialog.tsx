'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateItem, useBulkCreateItems, BulkUploadResponse } from '@/lib/hooks/use-items';
import { CLOTHING_TYPES, CLOTHING_COLORS } from '@/lib/types';
import { getClothingColorLabel, getClothingTypeLabel } from '@/lib/taxonomy-i18n';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

export function AddItemDialog({ open, onOpenChange }: AddItemDialogProps) {
  const t = useTranslations('addItem');
  const tc = useTranslations('common');
  const tt = useTranslations('taxonomy');

  // Single upload state
  const [singleFiles, setSingleFiles] = useState<FileWithPreview[]>([]);
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const MAX_IMAGES_PER_ITEM = 5;

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<FileWithPreview[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkUploadResponse | null>(null);
  const [activeTab, setActiveTab] = useState('single');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Track blob URLs for cleanup on unmount
  const blobUrlsRef = useRef<Set<string>>(new Set());

  const createItem = useCreateItem();
  const bulkCreateItems = useBulkCreateItems();

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  // Single-item drop handler: accepts multiple images of the SAME item
  const onDropSingle = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setSingleFiles((prev) => {
      const remaining = MAX_IMAGES_PER_ITEM - prev.length;
      const taken = acceptedFiles.slice(0, Math.max(0, remaining));
      const mapped: FileWithPreview[] = taken.map((file) => {
        const preview = URL.createObjectURL(file);
        blobUrlsRef.current.add(preview);
        return {
          file,
          preview,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
        };
      });
      if (acceptedFiles.length > taken.length) {
        toast.warning(t('maxImagesReached', { max: MAX_IMAGES_PER_ITEM }));
      }
      return [...prev, ...mapped];
    });
  }, [t]);

  // Bulk file drop handler
  const onDropBulk = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithPreview[] = acceptedFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      blobUrlsRef.current.add(preview);
      return {
        file,
        preview,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      };
    });
    setBulkFiles((prev) => {
      const combined = [...prev, ...newFiles];
      // Limit to 20 files
      return combined
    });
  }, []);

  const { getRootProps: getSingleRootProps, getInputProps: getSingleInputProps, isDragActive: isSingleDragActive } = useDropzone({
    onDrop: onDropSingle,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'],
    },
    multiple: true,
  });

  const { getRootProps: getBulkRootProps, getInputProps: getBulkInputProps, isDragActive: isBulkDragActive } = useDropzone({
    onDrop: onDropBulk,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'],
    },
    // maxFiles: 20,
    multiple: true,
  });

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (singleFiles.length === 0) return;

    const formData = new FormData();
    // First image is the primary; remaining images go as additional images for the SAME item
    singleFiles.forEach((f) => {
      formData.append('images', f.file);
    });
    if (type) formData.append('type', type);
    if (name) formData.append('name', name);
    if (brand) formData.append('brand', brand);
    if (primaryColor) formData.append('primary_color', primaryColor);
    if (notes) formData.append('notes', notes);
    formData.append('quantity', String(Math.max(1, Math.min(99, quantity || 1))));

    try {
      await createItem.mutateAsync(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkFiles.length === 0) return;

    try {
      const result = await bulkCreateItems.mutateAsync(bulkFiles.map((f) => f.file));
      setBulkResult(result);

      // Show toast based on results
      if (result.failed === 0) {
        toast.success(t('uploadSuccess', { count: result.successful }));
      } else if (result.successful === 0) {
        toast.error(t('uploadAllFailed', { count: result.failed }));
      } else {
        toast.warning(t('uploadPartial', { success: result.successful, failed: result.failed }));
      }
    } catch (error) {
      console.error('Failed to bulk upload:', error);
      toast.error(t('uploadFailed'));
    }
  };

  // Check if there are unsaved files that would be lost on close
  const hasUnsavedFiles = (singleFiles.length > 0) || (bulkFiles.length > 0 && !bulkResult);

  const handleCloseRequest = () => {
    // Show confirmation if there are unsaved files and not currently uploading
    if (hasUnsavedFiles && !createItem.isPending && !bulkCreateItems.isPending) {
      setShowCloseConfirm(true);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    // Single upload cleanup
    singleFiles.forEach((f) => {
      URL.revokeObjectURL(f.preview);
      blobUrlsRef.current.delete(f.preview);
    });
    setSingleFiles([]);
    setType('');
    setName('');
    setBrand('');
    setPrimaryColor('');
    setNotes('');
    setQuantity(1);

    // Bulk upload cleanup - also clean up from the ref
    bulkFiles.forEach((f) => {
      URL.revokeObjectURL(f.preview);
      blobUrlsRef.current.delete(f.preview);
    });
    setBulkFiles([]);
    setBulkResult(null);
    setActiveTab('single');
    setShowCloseConfirm(false);

    onOpenChange(false);
  };

  const clearSingleFile = () => {
    singleFiles.forEach((f) => {
      URL.revokeObjectURL(f.preview);
      blobUrlsRef.current.delete(f.preview);
    });
    setSingleFiles([]);
  };

  const removeSingleFile = (id: string) => {
    setSingleFiles((prev) => {
      const toRemove = prev.find((f) => f.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview);
        blobUrlsRef.current.delete(toRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const promoteToPrimary = (id: string) => {
    setSingleFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
  };

  const removeBulkFile = (id: string) => {
    setBulkFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
        blobUrlsRef.current.delete(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearBulkFiles = () => {
    bulkFiles.forEach((f) => {
      URL.revokeObjectURL(f.preview);
      blobUrlsRef.current.delete(f.preview);
    });
    setBulkFiles([]);
    setBulkResult(null);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleCloseRequest}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('subtitle')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">{t('singleItem')}</TabsTrigger>
            <TabsTrigger value="bulk">{t('bulkUpload')}</TabsTrigger>
          </TabsList>

          {/* Single Item Upload */}
          <TabsContent value="single" className="space-y-4">
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              {singleFiles.length === 0 ? (
                <div
                  {...getSingleRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isSingleDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getSingleInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isSingleDragActive
                      ? t('dropImage')
                      : t('dragOrTapMulti', { max: MAX_IMAGES_PER_ITEM })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('fileTypes')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('multiImageHint')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {t('imagesOfSameItem', { count: singleFiles.length, max: MAX_IMAGES_PER_ITEM })}
                    </p>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSingleFile}>
                      {t('clearAll')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {singleFiles.map((f, idx) => (
                      <div key={f.id} className="relative group">
                        <img
                          src={f.preview}
                          alt={f.file.name}
                          className={`w-full aspect-square object-cover rounded-md border ${idx === 0 ? 'ring-2 ring-primary' : ''}`}
                        />
                        {idx === 0 ? (
                          <span className="absolute top-1 left-1 text-[10px] bg-primary text-primary-foreground rounded px-1 py-0.5">
                            {t('mainPhoto')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => promoteToPrimary(f.id)}
                            className="absolute bottom-1 left-1 text-[10px] bg-background/80 border rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {t('setAsMain')}
                          </button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeSingleFile(f.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {singleFiles.length < MAX_IMAGES_PER_ITEM && (
                      <div
                        {...getSingleRootProps()}
                        className={`flex items-center justify-center aspect-square rounded-md border-2 border-dashed cursor-pointer hover:border-primary/50 ${isSingleDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                      >
                        <input {...getSingleInputProps()} />
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Upload className="h-5 w-5" />
                          <span className="text-[10px] mt-1">{t('addMore')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="type">{t('type')} <span className="text-muted-foreground font-normal">({t('aiDetect')})</span></Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('letAiDetect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CLOTHING_TYPES.map((itemType) => (
                        <SelectItem key={itemType.value} value={itemType.value}>
                          {getClothingTypeLabel(itemType.value, (k) => tt(k as Parameters<typeof tt>[0]))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t('nameOptional')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="brand">{t('brand')}</Label>
                    <Input
                      id="brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder={t('brandPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">{t('primaryColor')}</Label>
                    <Select value={primaryColor} onValueChange={setPrimaryColor}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectColor')} />
                      </SelectTrigger>
                      <SelectContent>
                        {CLOTHING_COLORS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: c.hex }}
                              />
                              {getClothingColorLabel(c.value, (k) => tt(k as Parameters<typeof tt>[0]))}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">{t('quantity')}</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={99}
                      value={quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setQuantity(Number.isFinite(v) ? v : 1);
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground">{t('quantityHint')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('notesLabel')}</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('notesPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleCloseRequest}>
                  {tc('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={singleFiles.length === 0 || createItem.isPending}
                >
                  {createItem.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('uploading')}
                    </>
                  ) : (
                    t('addItem')
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Bulk Upload */}
          <TabsContent value="bulk" className="space-y-4">
            {!bulkResult ? (
              <>
                <div
                  {...getBulkRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isBulkDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getBulkInputProps()} />
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isBulkDragActive
                      ? t('dropImages')
                      : t('dragMultiple')}
                  </p>
                  {/* <p className="mt-1 text-xs text-muted-foreground">
                    Up to 20 images (JPEG, PNG, WebP, HEIC)
                  </p> */}
                </div>

                {bulkFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {t('imagesSelected', { count: bulkFiles.length })}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearBulkFiles}
                      >
                        {t('clearAll')}
                      </Button>
                    </div>

                    <ScrollArea className="h-[200px] rounded-md border p-2">
                      <div className="grid grid-cols-4 gap-2">
                        {bulkFiles.map((f) => (
                          <div key={f.id} className="relative group">
                            <img
                              src={f.preview}
                              alt={f.file.name}
                              className="w-full aspect-square object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeBulkFile(f.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <p className="text-[10px] text-muted-foreground truncate mt-1 px-1">
                              {f.file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <p className="text-xs text-muted-foreground">
                      {t('aiAutoTag')}
                    </p>
                  </div>
                )}

                {bulkCreateItems.isPending && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{t('uploadingItems', { count: bulkFiles.length })}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{bulkCreateItems.uploadProgress}%</span>
                    </div>
                    <Progress value={bulkCreateItems.uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleCloseRequest}>
                    {tc('cancel')}
                  </Button>
                  <Button
                    onClick={handleBulkSubmit}
                    disabled={bulkFiles.length === 0 || bulkCreateItems.isPending}
                  >
                    {bulkCreateItems.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('uploading')}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('uploadItems', { count: bulkFiles.length })}
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              /* Bulk Upload Results */
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 py-4">
                  {bulkResult.failed === 0 ? (
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  ) : bulkResult.successful === 0 ? (
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  ) : (
                    <AlertCircle className="h-12 w-12 text-yellow-500" />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-lg font-medium">
                    {t('resultTitle', { success: bulkResult.successful, total: bulkResult.total })}
                  </p>
                  {bulkResult.failed > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t('resultFailed', { count: bulkResult.failed })}
                    </p>
                  )}
                </div>

                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-3 space-y-2">
                    {bulkResult.results.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-2 rounded-md ${
                          result.success ? 'bg-green-500/10' : 'bg-destructive/10'
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.filename}</p>
                          {result.error && (
                            <p className="text-xs text-destructive">{result.error}</p>
                          )}
                        </div>
                        {result.item && (
                          <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={clearBulkFiles}>
                    {t('uploadMore')}
                  </Button>
                  <Button onClick={handleClose}>
                    {t('done')}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('discardTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('discardDescription', {
              count: activeTab === 'single' ? 1 : bulkFiles.length,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('keepEditing')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleClose}>{t('discard')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
