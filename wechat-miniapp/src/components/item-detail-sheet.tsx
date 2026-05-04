import { useEffect, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  useAddItemsToFolder,
  useFolders,
  useRemoveItemsFromFolder,
} from '../hooks/use-folders'
import {
  useArchiveItem,
  useDeleteItem,
  useLogWash,
  useLogWear,
  useReanalyzeItem,
  useToggleFavorite,
  useToggleNeedsWash,
  useUnarchiveItem,
} from '../hooks/use-items'
import { useGeneratePairings } from '../hooks/use-pairings'
import { formatChineseDate } from '../lib/date-utils'
import { formatItemTypeLabel, formatOccasionLabel, formatStyleLabel, formatSubtypeLabel } from '../lib/display'
import { getItemPreviewUrls, getPreviewImageUrl } from '../lib/image-preview'
import type { Item } from '../services/types'
import type { Folder } from '../services/folders'
import {
  actionRowStyle,
  actionStackStyle,
  getActionButtonStyle,
  getDisabledActionStyle,
  getEnabledActionHandler,
  getToneActionSurfaceStyle,
} from './action-style'
import { buildOccasionOptions } from '../lib/options'
import { CompactOptionGroup } from './compact-option-group'
import { PreviewableImage } from './previewable-image'
import {
  flatActionFormStyle,
  flatDetailBlockStyle,
  sheetBackdropStyle,
  sheetContentStyle,
  sheetHandleStyle,
  sheetHandleTrackStyle,
  sheetOverlayStyle,
  sheetPanelStyle,
  sheetScrollBodyStyle,
} from './sheet-style'
import { colors } from './ui-theme'

type ItemDetailSheetProps = {
  item: Item | null
  visible: boolean
  onClose: () => void
}

const OCCASION_OPTIONS = buildOccasionOptions(formatOccasionLabel)
const WASH_METHODS = ['手洗', '机洗', '干洗', '免洗']

export function ItemDetailSheet(props: ItemDetailSheetProps) {
  const { item: initialItem, visible, onClose } = props
  const toggleFavorite = useToggleFavorite()
  const toggleNeedsWash = useToggleNeedsWash()
  const reanalyze = useReanalyzeItem()
  const archive = useArchiveItem()
  const unarchive = useUnarchiveItem()
  const deleteItem = useDeleteItem()
  const logWear = useLogWear()
  const logWash = useLogWash()
  const generatePairings = useGeneratePairings()
  const { data: folders } = useFolders()
  const addItemsToFolder = useAddItemsToFolder()
  const removeItemsFromFolder = useRemoveItemsFromFolder()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmArchive, setShowConfirmArchive] = useState(false)
  const [showLogWear, setShowLogWear] = useState(false)
  const [showLogWash, setShowLogWash] = useState(false)
  const [wearOccasionIndex, setWearOccasionIndex] = useState(0)
  const [washMethodIndex, setWashMethodIndex] = useState(0)
  const [currentItem, setCurrentItem] = useState<Item | null>(initialItem)

  useEffect(() => {
    setCurrentItem(initialItem)
    setShowConfirmDelete(false)
    setShowConfirmArchive(false)
    setShowLogWear(false)
    setShowLogWash(false)
    setWearOccasionIndex(0)
    setWashMethodIndex(0)
  }, [initialItem, visible])

  useEffect(() => {
    if (!visible) return undefined

    void Taro.hideTabBar({ animation: false }).catch(() => undefined)

    return () => {
      void Taro.showTabBar({ animation: false }).catch(() => undefined)
    }
  }, [visible])

  if (!visible || !currentItem) return null

  const item = currentItem
  const itemFolders = item.folders ?? []
  const availableFolders = (folders ?? []).filter(
    (folder) => !itemFolders.some((itemFolder) => itemFolder.id === folder.id)
  )
  const favoritePending = Boolean(toggleFavorite.isPending)
  const needsWashPending = Boolean(toggleNeedsWash.isPending)
  const reanalyzePending = Boolean(reanalyze.isPending)
  const archivePending = Boolean(archive.isPending)
  const unarchivePending = Boolean(unarchive.isPending)
  const deletePending = Boolean(deleteItem.isPending)
  const logWearPending = Boolean(logWear.isPending)
  const logWashPending = Boolean(logWash.isPending)
  const addFolderPending = Boolean(addItemsToFolder.isPending)
  const removeFolderPending = Boolean(removeItemsFromFolder.isPending)
  const generatePairingsPending = Boolean(generatePairings.isPending)
  const imageUrl = item.medium_url || item.thumbnail_url || item.image_url
  const typeLabel = formatItemTypeLabel(item.type)
  const subtypeLabel = formatSubtypeLabel(item.subtype)
  const title = item.name || typeLabel
  const washMethodLabels = WASH_METHODS
  const copy = {
    statusProcessing: '分析中',
    statusError: '分析失败',
    statusArchived: '已归档',
    statusReady: '就绪',
    favoriteRemoved: '已取消收藏',
    favoriteAdded: '已收藏',
    actionFailed: '操作失败',
    washClean: '已标记干净',
    washNeeded: '已标记需清洗',
    reanalyzed: '已重新分析',
    reanalyzeFailed: '重新分析失败',
    archived: '已归档',
    archiveFailed: '归档失败',
    unarchived: '已取消归档',
    deleted: '已删除',
    deleteFailed: '删除失败',
    wearLogged: '已记录穿着',
    washLogged: '已记录清洗',
    logFailed: '记录失败',
    closeDetail: '关闭详情',
    wearCount: '穿着次数',
    quantity: '数量',
    lastWorn: '上次穿着',
    tags: '标签',
    aiDescription: 'AI 描述',
    notes: '备注',
    logWear: '记录穿着',
    occasion: '场景',
    cancel: '取消',
    confirm: '确认',
    logWash: '记录清洗',
    method: '方式',
    folders: '文件夹',
    folderCount: (count: number) => `已加入 ${count} 个`,
    noFolders: '未加入文件夹',
    addToFolder: '加入文件夹',
    removeFromFolder: '移出',
    folderAdded: '已加入文件夹',
    folderRemoved: '已移出文件夹',
    folderActionFailed: '文件夹操作失败',
    favorite: '收藏',
    favorited: '已收藏',
    needsWash: '需清洗',
    clean: '已干净',
    wearAction: '记录穿着',
    washAction: '记录清洗',
    reanalyze: '重新分析',
    unarchive: '取消归档',
    archive: '归档',
    archiveConfirm: '确认归档',
    generatePairings: '生成搭配',
    generatingPairings: '生成中...',
    pairingsGenerated: (count: number) => `已生成 ${count} 套搭配`,
    generatePairingsFailed: '生成失败',
    delete: '删除',
    deleteConfirm: '确认删除',
  }
  const statusLabel =
    item.status === 'processing' ? copy.statusProcessing
    : item.status === 'error' ? copy.statusError
    : item.status === 'archived' ? copy.statusArchived : copy.statusReady
  const statusColor =
    item.status === 'error' ? '#EF4444'
    : item.status === 'processing' ? '#F59E0B'
    : item.status === 'archived' ? '#6B7280' : '#22C55E'
  const detailMetrics = [
    { label: copy.wearCount, value: String(item.wear_count), valueSize: '18px' },
    { label: copy.quantity, value: String(item.quantity), valueSize: '18px' },
    ...(item.last_worn_at
      ? [{ label: copy.lastWorn, value: formatChineseDate(item.last_worn_at), valueSize: '13px' }]
      : []),
  ]

  const handleToggleFavorite = async () => {
    if (favoritePending) return

    try {
      const updated = await toggleFavorite.mutateAsync({ id: item.id, favorite: !item.favorite })
      setCurrentItem(updated)
      void Taro.showToast({ title: item.favorite ? copy.favoriteRemoved : copy.favoriteAdded, icon: 'success' })
    } catch { void Taro.showToast({ title: copy.actionFailed, icon: 'none' }) }
  }

  const handleToggleWash = async () => {
    if (needsWashPending) return

    try {
      const updated = await toggleNeedsWash.mutateAsync({ id: item.id, needsWash: !item.needs_wash })
      setCurrentItem(updated)
      void Taro.showToast({ title: item.needs_wash ? copy.washClean : copy.washNeeded, icon: 'success' })
    } catch { void Taro.showToast({ title: copy.actionFailed, icon: 'none' }) }
  }

  const handleReanalyze = async () => {
    if (reanalyzePending) return

    try {
      const updated = await reanalyze.mutateAsync(item.id)
      setCurrentItem(updated)
      void Taro.showToast({ title: copy.reanalyzed, icon: 'success' })
    } catch { void Taro.showToast({ title: copy.reanalyzeFailed, icon: 'none' }) }
  }

  const handleArchive = async () => {
    if (archivePending) return

    try {
      await archive.mutateAsync({ id: item.id })
      setShowConfirmArchive(false)
      void Taro.showToast({ title: copy.archived, icon: 'success' })
      onClose()
    } catch { void Taro.showToast({ title: copy.archiveFailed, icon: 'none' }) }
  }

  const handleUnarchive = async () => {
    if (unarchivePending) return

    try {
      const updated = await unarchive.mutateAsync(item.id)
      setCurrentItem(updated)
      void Taro.showToast({ title: copy.unarchived, icon: 'success' })
    } catch { void Taro.showToast({ title: copy.actionFailed, icon: 'none' }) }
  }

  const handleDelete = async () => {
    if (deletePending) return

    try {
      await deleteItem.mutateAsync(item.id)
      void Taro.showToast({ title: copy.deleted, icon: 'success' })
      onClose()
    } catch { void Taro.showToast({ title: copy.deleteFailed, icon: 'none' }) }
  }

  const handleLogWear = async () => {
    if (logWearPending) return

    try {
      const updated = await logWear.mutateAsync({
        id: item.id,
        occasion: OCCASION_OPTIONS[wearOccasionIndex]?.value || OCCASION_OPTIONS[0].value,
      })
      setCurrentItem(updated)
      void Taro.showToast({ title: copy.wearLogged, icon: 'success' })
      setShowLogWear(false)
    } catch { void Taro.showToast({ title: copy.logFailed, icon: 'none' }) }
  }

  const handleLogWash = async () => {
    if (logWashPending) return

    try {
      const updated = await logWash.mutateAsync({ id: item.id, method: WASH_METHODS[washMethodIndex] })
      setCurrentItem(updated)
      void Taro.showToast({ title: copy.washLogged, icon: 'success' })
      setShowLogWash(false)
    } catch { void Taro.showToast({ title: copy.logFailed, icon: 'none' }) }
  }

  const handleGeneratePairings = async () => {
    if (generatePairingsPending) return

    try {
      const result = await generatePairings.mutateAsync({
        itemId: item.id,
        num_pairings: 5,
      })
      void Taro.showToast({ title: copy.pairingsGenerated(result.generated), icon: 'success' })
    } catch {
      void Taro.showToast({ title: copy.generatePairingsFailed, icon: 'none' })
    }
  }

  const folderToRef = (folder: Folder) => ({
    id: folder.id,
    name: folder.name,
    icon: folder.icon ?? undefined,
    color: folder.color ?? undefined,
  })

  const handleAddToFolder = async (folder: Folder) => {
    if (addFolderPending) return

    try {
      await addItemsToFolder.mutateAsync({
        folderId: folder.id,
        itemIds: [item.id],
      })
      setCurrentItem({
        ...item,
        folders: [...itemFolders, folderToRef(folder)],
      })
      void Taro.showToast({ title: copy.folderAdded, icon: 'success' })
    } catch {
      void Taro.showToast({ title: copy.folderActionFailed, icon: 'none' })
    }
  }

  const handleRemoveFromFolder = async (folderId: string) => {
    if (removeFolderPending) return

    try {
      await removeItemsFromFolder.mutateAsync({
        folderId,
        itemIds: [item.id],
      })
      setCurrentItem({
        ...item,
        folders: itemFolders.filter((folder) => folder.id !== folderId),
      })
      void Taro.showToast({ title: copy.folderRemoved, icon: 'success' })
    } catch {
      void Taro.showToast({ title: copy.folderActionFailed, icon: 'none' })
    }
  }

  const additionalImages = item.additional_images || []
  const previewImages = getItemPreviewUrls(item)
  const imageEntries = [
    { displayUrl: imageUrl, previewUrl: getPreviewImageUrl(item) },
    ...additionalImages.map((img) => ({
      displayUrl: img.medium_url || img.thumbnail_url || img.image_url,
      previewUrl: getPreviewImageUrl(img),
    })),
  ].filter((entry): entry is { displayUrl: string; previewUrl: string } => Boolean(entry.displayUrl && entry.previewUrl))
  const primaryImageEntry = imageEntries[0]
  const secondaryImageEntries = imageEntries.slice(1)

  return (
    <View catchMove style={sheetOverlayStyle}>
      <View ariaRole='button' ariaLabel={copy.closeDetail} catchMove onClick={onClose} style={sheetBackdropStyle} />
      <View catchMove style={sheetPanelStyle}>
        <View style={sheetHandleTrackStyle}>
          <View style={sheetHandleStyle} />
        </View>
        <View catchMove style={sheetScrollBodyStyle}>
          <View style={sheetContentStyle}>
            {primaryImageEntry ? (
              <View style={{ marginBottom: '12px' }}>
                <PreviewableImage
                  ariaLabel={`查看 ${title} 第 1 张大图`}
                  src={primaryImageEntry.displayUrl}
                  previewCurrent={primaryImageEntry.previewUrl}
                  previewUrls={previewImages}
                  mode='aspectFill'
                  style={{ width: '100%', height: '220px', borderRadius: '8px', backgroundColor: colors.surfaceMuted }}
                />
                {secondaryImageEntries.length > 0 ? (
                  <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {secondaryImageEntries.map((entry, i) => (
                        <PreviewableImage
                          key={i}
                          ariaLabel={`查看 ${title} 第 ${i + 2} 张大图`}
                          src={entry.displayUrl}
                          previewCurrent={entry.previewUrl}
                          previewUrls={previewImages}
                          mode='aspectFill'
                          style={{ width: '72px', height: '72px', borderRadius: '8px', backgroundColor: colors.surfaceMuted }}
                        />
                      ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>{title}</Text>
              <Text style={{ fontSize: '12px', color: statusColor, backgroundColor: `${statusColor}15`, padding: '4px 12px', borderRadius: '999px' }}>{statusLabel}</Text>
            </View>
            <Text style={{ display: 'block', fontSize: '13px', color: colors.textMuted, marginBottom: '8px' }}>
              {typeLabel}{subtypeLabel ? ` · ${subtypeLabel}` : ''}{item.brand ? ` · ${item.brand}` : ''}
            </Text>
            <View style={{ display: 'flex', marginBottom: '12px', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
              {detailMetrics.map((metric, index) => {
                const isLast = index === detailMetrics.length - 1

                return (
                  <View
                    key={metric.label}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '9px 8px',
                      borderRight: isLast ? undefined : `1px solid ${colors.border}`,
                      boxSizing: 'border-box',
                    }}
                  >
                    <Text style={{ fontSize: '12px', color: colors.textMuted }}>{metric.label}</Text>
                    <Text style={{ display: 'block', marginTop: '4px', fontSize: metric.valueSize, fontWeight: metric.valueSize === '18px' ? 600 : 400, color: colors.text }} numberOfLines={1}>
                      {metric.value}
                    </Text>
                  </View>
                )
              })}
            </View>
            {item.tags && (
              <View style={{ marginBottom: '12px' }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>{copy.tags}</Text>
                <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {item.tags.style?.map((s) => <Text key={s} style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '4px 10px', borderRadius: '999px' }}>{formatStyleLabel(s)}</Text>)}
                  {item.tags.season?.map((s) => <Text key={s} style={{ fontSize: '11px', color: colors.warning, padding: '4px 10px', borderRadius: '999px', ...getToneActionSurfaceStyle('warning') }}>{s}</Text>)}
                  {item.tags.material && <Text style={{ fontSize: '11px', color: colors.success, padding: '4px 10px', borderRadius: '999px', ...getToneActionSurfaceStyle('success') }}>{item.tags.material}</Text>}
                  {item.tags.pattern && <Text style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.surfaceSelected, padding: '4px 10px', borderRadius: '999px' }}>{item.tags.pattern}</Text>}
                </View>
              </View>
            )}
            {item.ai_description && (
              <View style={flatDetailBlockStyle}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>{copy.aiDescription}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{item.ai_description}</Text>
              </View>
            )}
            {item.notes && (
              <View style={flatDetailBlockStyle}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>{copy.notes}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{item.notes}</Text>
              </View>
            )}

            <View style={{ marginBottom: '10px', padding: '10px 0', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
              <Text style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text }}>{copy.folders}</Text>
              <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginTop: '2px', marginBottom: itemFolders.length || availableFolders.length ? '8px' : 0 }}>
                {itemFolders.length ? copy.folderCount(itemFolders.length) : copy.noFolders}
              </Text>
              {itemFolders.length ? (
                <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: availableFolders.length ? '10px' : 0 }}>
                  {itemFolders.map((folder) => (
                    <View
                      key={folder.id}
                      style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px', borderRadius: '999px', backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
                    >
                      <Text style={{ fontSize: '12px', color: colors.text }}>
                        {folder.icon ? `${folder.icon} ` : ''}{folder.name}
                      </Text>
                      <View
                        ariaRole='button'
                        ariaLabel={`${copy.removeFromFolder} ${folder.name}`}
                        onClick={getEnabledActionHandler(removeFolderPending, () => void handleRemoveFromFolder(folder.id))}
                        style={{ minHeight: '44px', display: 'flex', alignItems: 'center', padding: '0 2px', ...getDisabledActionStyle(removeFolderPending) }}
                      >
                        <Text style={{ fontSize: '12px', color: colors.danger }}>{copy.removeFromFolder}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
              {availableFolders.length > 0 && (
                <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {availableFolders.map((folder) => (
                      <View
                        key={folder.id}
                        ariaRole='button'
                        ariaLabel={`${copy.addToFolder} ${folder.name}`}
                        onClick={getEnabledActionHandler(addFolderPending, () => void handleAddToFolder(folder))}
                        style={{ minHeight: '44px', display: 'flex', alignItems: 'center', padding: '0 10px', borderRadius: '999px', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, ...getDisabledActionStyle(addFolderPending) }}
                      >
                        <Text style={{ fontSize: '12px', color: colors.text }}>
                          + {folder.icon ? `${folder.icon} ` : ''}{folder.name}
                        </Text>
                      </View>
                    ))}
                </View>
              )}
            </View>

            {/* Log wear form */}
            {showLogWear && (
              <View style={flatActionFormStyle}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '10px' }}>{copy.logWear}</Text>
                <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>{copy.occasion}</Text>
                <CompactOptionGroup
                  activeIndex={wearOccasionIndex}
                  options={OCCASION_OPTIONS.map((option) => option.label)}
                  onChange={setWearOccasionIndex}
                  style={{ marginBottom: '10px' }}
                />
                <View style={{ ...actionRowStyle, gap: '10px' }}>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.cancel}
                    onClick={() => setShowLogWear(false)}
                    style={getActionButtonStyle({ flex: 1 })}
                  >
                    <Text style={{ fontSize: '14px', color: colors.text }}>{copy.cancel}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.confirm}
                    onClick={getEnabledActionHandler(logWearPending, handleLogWear)}
                    style={{ ...getActionButtonStyle({ variant: 'primary', flex: 1, disabled: logWearPending }), backgroundColor: '#166534' }}
                  >
                    <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>{copy.confirm}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Log wash form */}
            {showLogWash && (
              <View style={flatActionFormStyle}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '10px' }}>{copy.logWash}</Text>
                <Text style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>{copy.method}</Text>
                <CompactOptionGroup
                  activeIndex={washMethodIndex}
                  options={washMethodLabels}
                  onChange={setWashMethodIndex}
                  style={{ marginBottom: '10px' }}
                />
                <View style={{ ...actionRowStyle, gap: '10px' }}>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.cancel}
                    onClick={() => setShowLogWash(false)}
                    style={getActionButtonStyle({ flex: 1 })}
                  >
                    <Text style={{ fontSize: '14px', color: colors.text }}>{copy.cancel}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.confirm}
                    onClick={getEnabledActionHandler(logWashPending, handleLogWash)}
                    style={{ ...getActionButtonStyle({ variant: 'primary', flex: 1, disabled: logWashPending }), backgroundColor: colors.infoText }}
                  >
                    <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>{copy.confirm}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action buttons */}
            <View style={{ ...actionStackStyle, marginTop: '6px' }}>
              <View style={actionRowStyle}>
                <View
                  ariaRole='button'
                  ariaLabel={item.favorite ? copy.favorited : copy.favorite}
                  onClick={getEnabledActionHandler(favoritePending, handleToggleFavorite)}
                  style={{ ...getActionButtonStyle({ variant: 'plain', tone: item.favorite ? 'danger' : 'default', flex: 1, disabled: favoritePending }), textAlign: 'center' }}
                >
                  <Text style={{ fontSize: '14px', color: item.favorite ? colors.danger : colors.text }}>{item.favorite ? copy.favorited : copy.favorite}</Text>
                </View>
                <View
                  ariaRole='button'
                  ariaLabel={item.needs_wash ? copy.needsWash : copy.clean}
                  onClick={getEnabledActionHandler(needsWashPending, handleToggleWash)}
                  style={{ ...getActionButtonStyle({ variant: 'plain', tone: item.needs_wash ? 'warning' : 'default', flex: 1, disabled: needsWashPending }), textAlign: 'center' }}
                >
                  <Text style={{ fontSize: '14px', color: item.needs_wash ? colors.warning : colors.text }}>{item.needs_wash ? copy.needsWash : copy.clean}</Text>
                </View>
              </View>

              {!showLogWear && !showLogWash && (
                <View style={actionRowStyle}>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.wearAction}
                    onClick={getEnabledActionHandler(logWearPending, () => setShowLogWear(true))}
                    style={{ ...getActionButtonStyle({ variant: 'plain', tone: 'success', flex: 1, disabled: logWearPending }), textAlign: 'center' }}
                  >
                    <Text style={{ fontSize: '14px', color: colors.success }}>{copy.wearAction}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.washAction}
                    onClick={getEnabledActionHandler(logWashPending, () => setShowLogWash(true))}
                    style={{ ...getActionButtonStyle({ variant: 'plain', tone: 'info', flex: 1, disabled: logWashPending }), textAlign: 'center' }}
                  >
                    <Text style={{ fontSize: '14px', color: colors.infoText }}>{copy.washAction}</Text>
                  </View>
                </View>
              )}

              {(item.status === 'error' || item.status === 'ready') && (
                <View
                  ariaRole='button'
                  ariaLabel={copy.reanalyze}
                  onClick={getEnabledActionHandler(reanalyzePending, handleReanalyze)}
                  style={getActionButtonStyle({ disabled: reanalyzePending })}
                >
                  <Text style={{ fontSize: '14px', color: colors.text }}>{copy.reanalyze}</Text>
                </View>
              )}

              {item.status === 'ready' && !item.is_archived ? (
                <View
                  ariaRole='button'
                  ariaLabel={copy.generatePairings}
                  onClick={getEnabledActionHandler(generatePairingsPending, handleGeneratePairings)}
                  style={getActionButtonStyle({ disabled: generatePairingsPending })}
                >
                  <Text style={{ fontSize: '14px', color: colors.text }}>
                    {generatePairingsPending ? copy.generatingPairings : copy.generatePairings}
                  </Text>
                </View>
              ) : null}

              {item.is_archived ? (
                <View
                  ariaRole='button'
                  ariaLabel={copy.unarchive}
                  onClick={getEnabledActionHandler(unarchivePending, handleUnarchive)}
                  style={getActionButtonStyle({ disabled: unarchivePending })}
                >
                  <Text style={{ fontSize: '14px', color: colors.text }}>{copy.unarchive}</Text>
                </View>
              ) : showConfirmArchive ? (
                <View style={{ ...actionRowStyle, gap: '10px' }}>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.cancel}
                    onClick={() => setShowConfirmArchive(false)}
                    style={getActionButtonStyle({ flex: 1 })}
                  >
                    <Text style={{ fontSize: '14px', color: colors.text }}>{copy.cancel}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.archiveConfirm}
                    onClick={getEnabledActionHandler(archivePending, handleArchive)}
                    style={getActionButtonStyle({ variant: 'primary', flex: 1, disabled: archivePending })}
                  >
                    <Text style={{ fontSize: '14px', color: colors.accentText }}>{copy.archiveConfirm}</Text>
                  </View>
                </View>
              ) : (
                <View
                  ariaRole='button'
                  ariaLabel={copy.archive}
                  onClick={getEnabledActionHandler(archivePending, () => {
                    setShowConfirmArchive(true)
                    setShowConfirmDelete(false)
                  })}
                  style={getActionButtonStyle({ disabled: archivePending })}
                >
                  <Text style={{ fontSize: '14px', color: colors.text }}>{copy.archive}</Text>
                </View>
              )}

              {!showConfirmDelete ? (
                <View
                  ariaRole='button'
                  ariaLabel={copy.delete}
                  onClick={getEnabledActionHandler(deletePending, () => setShowConfirmDelete(true))}
                  style={getActionButtonStyle({ tone: 'danger', disabled: deletePending })}
                >
                  <Text style={{ fontSize: '14px', color: colors.danger }}>{copy.delete}</Text>
                </View>
              ) : (
                <View style={{ ...actionRowStyle, gap: '10px' }}>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.cancel}
                    onClick={() => setShowConfirmDelete(false)}
                    style={getActionButtonStyle({ flex: 1 })}
                  >
                    <Text style={{ fontSize: '14px', color: colors.text }}>{copy.cancel}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.deleteConfirm}
                    onClick={getEnabledActionHandler(deletePending, handleDelete)}
                    style={{ ...getActionButtonStyle({ variant: 'primary', flex: 1, disabled: deletePending }), backgroundColor: '#dc2626' }}
                  >
                    <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>{copy.deleteConfirm}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
