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
import { useHideTabBar } from '../hooks/use-hide-tab-bar'
import { formatChineseDate } from '../lib/date-utils'
import { formatItemTypeLabel, formatOccasionLabel, formatStyleLabel, formatSubtypeLabel } from '../lib/display'
import { useI18n } from '../lib/i18n'
import { getItemPreviewUrls, getPreviewImageUrl } from '../lib/image-preview'
import { runMutationWithToast } from '../lib/mutation-toast'
import { toastSuccess } from '../lib/toast'
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
import { ConfirmActionRow } from './confirm-action-row'
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
import { colors, pillBaseStyle, solidActionBackgrounds, solidActionTextColor } from './ui-theme'

type ItemDetailSheetProps = {
  item: Item | null
  visible: boolean
  onClose: () => void
}

const OCCASION_OPTIONS = buildOccasionOptions(formatOccasionLabel)
const WASH_METHOD_KEYS = [
  'item_detail_wash_method_hand',
  'item_detail_wash_method_machine',
  'item_detail_wash_method_dry',
  'item_detail_wash_method_none',
] as const

export function ItemDetailSheet(props: ItemDetailSheetProps) {
  const { item: initialItem, visible, onClose } = props
  const { t, tf } = useI18n()
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

  useHideTabBar(visible)

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
  const washMethodLabels = WASH_METHOD_KEYS.map((key) => t(key))
  const copy = {
    statusProcessing: t('item_detail_status_processing'),
    statusError: t('item_detail_status_error'),
    statusArchived: t('item_detail_status_archived'),
    statusReady: t('item_detail_status_ready'),
    favoriteRemoved: t('item_detail_favorite_removed'),
    favoriteAdded: t('item_detail_favorite_added'),
    actionFailed: t('item_detail_action_failed'),
    washClean: t('item_detail_wash_clean'),
    washNeeded: t('item_detail_wash_needed'),
    reanalyzed: t('item_detail_reanalyzed'),
    reanalyzeFailed: t('item_detail_reanalyze_failed'),
    archived: t('item_detail_archived'),
    archiveFailed: t('item_detail_archive_failed'),
    unarchived: t('item_detail_unarchived'),
    deleted: t('item_detail_deleted'),
    deleteFailed: t('item_detail_delete_failed'),
    wearLogged: t('item_detail_wear_logged'),
    washLogged: t('item_detail_wash_logged'),
    logFailed: t('item_detail_log_failed'),
    closeDetail: t('item_detail_close_detail'),
    wearCount: t('item_detail_wear_count'),
    quantity: t('item_detail_quantity'),
    lastWorn: t('item_detail_last_worn'),
    tags: t('item_detail_tags'),
    aiDescription: t('item_detail_ai_description'),
    notes: t('item_detail_notes'),
    logWear: t('item_detail_log_wear'),
    occasion: t('item_detail_occasion'),
    cancel: t('item_detail_cancel'),
    confirm: t('item_detail_confirm'),
    logWash: t('item_detail_log_wash'),
    method: t('item_detail_method'),
    folders: t('item_detail_folders'),
    folderCount: (count: number) => tf('item_detail_folder_count', { count }),
    noFolders: t('item_detail_no_folders'),
    addToFolder: t('item_detail_add_to_folder'),
    removeFromFolder: t('item_detail_remove_from_folder'),
    folderAdded: t('item_detail_folder_added'),
    folderRemoved: t('item_detail_folder_removed'),
    folderActionFailed: t('item_detail_folder_action_failed'),
    favorite: t('item_detail_favorite'),
    favorited: t('item_detail_favorited'),
    needsWash: t('item_detail_needs_wash'),
    clean: t('item_detail_clean'),
    wearAction: t('item_detail_wear_action'),
    washAction: t('item_detail_wash_action'),
    reanalyze: t('item_detail_reanalyze'),
    unarchive: t('item_detail_unarchive'),
    archive: t('item_detail_archive'),
    archiveConfirm: t('item_detail_archive_confirm'),
    generatePairings: t('item_detail_generate_pairings'),
    generatingPairings: t('item_detail_generating_pairings'),
    pairingsGenerated: (count: number) => tf('item_detail_pairings_generated', { count }),
    generatePairingsFailed: t('item_detail_generate_pairings_failed'),
    delete: t('item_detail_delete'),
    deleteConfirm: t('item_detail_delete_confirm'),
  }
  const statusLabel =
    item.status === 'processing' ? copy.statusProcessing
    : item.status === 'error' ? copy.statusError
    : item.status === 'archived' ? copy.statusArchived : copy.statusReady
  const statusTone: 'danger' | 'warning' | 'default' | 'success' =
    item.status === 'error' ? 'danger'
    : item.status === 'processing' ? 'warning'
    : item.status === 'archived' ? 'default' : 'success'
  const statusBadgeStyle = {
    color:
      statusTone === 'danger' ? colors.danger
      : statusTone === 'warning' ? colors.warning
      : statusTone === 'success' ? colors.success
      : colors.textMuted,
    ...(statusTone === 'default'
      ? { backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.border}` }
      : getToneActionSurfaceStyle(statusTone)),
  }
  const detailMetrics = [
    { label: copy.wearCount, value: String(item.wear_count), valueSize: '18px' },
    { label: copy.quantity, value: String(item.quantity), valueSize: '18px' },
    ...(item.last_worn_at
      ? [{ label: copy.lastWorn, value: formatChineseDate(item.last_worn_at), valueSize: '13px' }]
      : []),
  ]

  const handleToggleFavorite = async () => {
    if (favoritePending) return
    const outcome = await runMutationWithToast(
      toggleFavorite,
      { id: item.id, favorite: !item.favorite },
      {
        success: item.favorite ? copy.favoriteRemoved : copy.favoriteAdded,
        failure: copy.actionFailed,
      },
    )
    if (outcome.ok) setCurrentItem(outcome.result)
  }

  const handleToggleWash = async () => {
    if (needsWashPending) return
    const outcome = await runMutationWithToast(
      toggleNeedsWash,
      { id: item.id, needsWash: !item.needs_wash },
      {
        success: item.needs_wash ? copy.washClean : copy.washNeeded,
        failure: copy.actionFailed,
      },
    )
    if (outcome.ok) setCurrentItem(outcome.result)
  }

  const handleReanalyze = async () => {
    if (reanalyzePending) return
    const outcome = await runMutationWithToast(reanalyze, item.id, {
      success: copy.reanalyzed,
      failure: copy.reanalyzeFailed,
    })
    if (outcome.ok) setCurrentItem(outcome.result)
  }

  const handleArchive = async () => {
    if (archivePending) return
    const outcome = await runMutationWithToast(archive, { id: item.id }, {
      success: copy.archived,
      failure: copy.archiveFailed,
    })
    if (outcome.ok) {
      setShowConfirmArchive(false)
      onClose()
    }
  }

  const handleUnarchive = async () => {
    if (unarchivePending) return
    const outcome = await runMutationWithToast(unarchive, item.id, {
      success: copy.unarchived,
      failure: copy.actionFailed,
    })
    if (outcome.ok) setCurrentItem(outcome.result)
  }

  const handleDelete = async () => {
    if (deletePending) return
    const outcome = await runMutationWithToast(deleteItem, item.id, {
      success: copy.deleted,
      failure: copy.deleteFailed,
    })
    if (outcome.ok) onClose()
  }

  const handleLogWear = async () => {
    if (logWearPending) return
    const outcome = await runMutationWithToast(
      logWear,
      {
        id: item.id,
        occasion: OCCASION_OPTIONS[wearOccasionIndex]?.value ?? OCCASION_OPTIONS[0]?.value ?? '',
      },
      {
        success: copy.wearLogged,
        failure: copy.logFailed,
      },
    )
    if (outcome.ok) {
      setCurrentItem(outcome.result)
      setShowLogWear(false)
    }
  }

  const handleLogWash = async () => {
    if (logWashPending) return
    const outcome = await runMutationWithToast(
      logWash,
      { id: item.id, method: washMethodLabels[washMethodIndex] },
      {
        success: copy.washLogged,
        failure: copy.logFailed,
      },
    )
    if (outcome.ok) {
      setCurrentItem(outcome.result)
      setShowLogWash(false)
    }
  }

  const handleGeneratePairings = async () => {
    if (generatePairingsPending) return
    const outcome = await runMutationWithToast(
      generatePairings,
      { itemId: item.id, num_pairings: 5 },
      { failure: copy.generatePairingsFailed },
    )
    if (outcome.ok) {
      toastSuccess(copy.pairingsGenerated(outcome.result.generated))
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
    const outcome = await runMutationWithToast(
      addItemsToFolder,
      { folderId: folder.id, itemIds: [item.id] },
      {
        success: copy.folderAdded,
        failure: copy.folderActionFailed,
      },
    )
    if (outcome.ok) {
      setCurrentItem({
        ...item,
        folders: [...itemFolders, folderToRef(folder)],
      })
    }
  }

  const handleRemoveFromFolder = async (folderId: string) => {
    if (removeFolderPending) return
    const outcome = await runMutationWithToast(
      removeItemsFromFolder,
      { folderId, itemIds: [item.id] },
      {
        success: copy.folderRemoved,
        failure: copy.folderActionFailed,
      },
    )
    if (outcome.ok) {
      setCurrentItem({
        ...item,
        folders: itemFolders.filter((folder) => folder.id !== folderId),
      })
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
                  ariaLabel={tf('item_detail_view_image_at', { title, index: 1 })}
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
                          ariaLabel={tf('item_detail_view_image_at', { title, index: i + 2 })}
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
              <Text style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', ...statusBadgeStyle }}>{statusLabel}</Text>
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
                  {item.tags.style?.map((s) => <Text key={s} style={{ ...pillBaseStyle, color: colors.textMuted, backgroundColor: colors.surfaceMuted }}>{formatStyleLabel(s)}</Text>)}
                  {item.tags.season?.map((s) => <Text key={s} style={{ ...pillBaseStyle, color: colors.warning, ...getToneActionSurfaceStyle('warning') }}>{s}</Text>)}
                  {item.tags.material && <Text style={{ ...pillBaseStyle, color: colors.success, ...getToneActionSurfaceStyle('success') }}>{item.tags.material}</Text>}
                  {item.tags.pattern && <Text style={{ ...pillBaseStyle, color: colors.textMuted, backgroundColor: colors.surfaceSelected }}>{item.tags.pattern}</Text>}
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
                    style={{ ...getActionButtonStyle({ variant: 'primary', flex: 1, disabled: logWearPending }), backgroundColor: solidActionBackgrounds.success }}
                  >
                    <Text style={{ fontSize: '14px', color: solidActionTextColor }}>{copy.confirm}</Text>
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
                    style={{ ...getActionButtonStyle({ variant: 'primary', flex: 1, disabled: logWashPending }), backgroundColor: solidActionBackgrounds.info }}
                  >
                    <Text style={{ fontSize: '14px', color: solidActionTextColor }}>{copy.confirm}</Text>
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
                <ConfirmActionRow
                  cancelLabel={copy.cancel}
                  confirmLabel={copy.archiveConfirm}
                  onCancel={() => setShowConfirmArchive(false)}
                  onConfirm={handleArchive}
                  pending={archivePending}
                />
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
                <ConfirmActionRow
                  tone='danger'
                  cancelLabel={copy.cancel}
                  confirmLabel={copy.deleteConfirm}
                  onCancel={() => setShowConfirmDelete(false)}
                  onConfirm={handleDelete}
                  pending={deletePending}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
