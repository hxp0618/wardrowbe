import { useEffect, useRef, useState } from 'react'
import { Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import {
  actionRowStyle,
  actionWrapRowStyle,
  getActionButtonStyle,
  getEnabledActionHandler,
} from '../../components/action-style'
import { CompactOptionGroup } from '../../components/compact-option-group'
import { EmptyState } from '../../components/empty-state'
import { FlatList, FlatListRow } from '../../components/flat-data'
import { ItemCard } from '../../components/item-card'
import { ItemDetailSheet } from '../../components/item-detail-sheet'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useCreateFolder, useDeleteFolder, useFolders, useUpdateFolder } from '../../hooks/use-folders'
import { useCreateItemWithImages, useInfiniteItems, useItemTypes } from '../../hooks/use-items'
import { formatItemTypeLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import {
  getWardrobeChipLabelStyle,
  getWardrobeChipStyle,
} from './controls-style'
import {
  getWardrobeFilterPanelStyle,
  getWardrobeItemCardShellStyle,
  getWardrobeSectionCardStyle,
  getWardrobeUploadedItemAnchor,
  getWardrobeUploadedItemStyle,
  WARDROBE_UPLOADED_ITEM_HIGHLIGHT_MS,
} from './look-and-feel'
import { isChooseImageCanceled } from '../../lib/choose-image'
import { toastError, toastErrorFromException, toastSuccess } from '../../lib/toast'

import type { Item, ItemFilter } from '../../services/types'

export default function WardrobePage() {
  const canRender = useAuthGuard()
  const [typeIndex, setTypeIndex] = useState(0)
  const [sortIndex, setSortIndex] = useState(0)
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [filterNeedsWash, setFilterNeedsWash] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [folderIndex, setFolderIndex] = useState(0)
  const [showFolderManager, setShowFolderManager] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<Item | null>(null)
  const [uploadedItemId, setUploadedItemId] = useState<string | null>(null)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const lastScrolledItemIdRef = useRef<string | null>(null)
  const { t, tf } = useI18n()
  const { data: itemTypes } = useItemTypes()
  const { data: folders } = useFolders()
  const createFolder = useCreateFolder()
  const updateFolder = useUpdateFolder()
  const deleteFolder = useDeleteFolder()
  const createItem = useCreateItemWithImages()
  const folderList = folders ?? []
  const addItemDisabled = Boolean(createItem.isPending)
  const createFolderDisabled = !newFolderName.trim() || Boolean(createFolder.isPending)
  const updateFolderDisabled = !editingFolderName.trim() || Boolean(updateFolder.isPending)
  const deleteFolderDisabled = Boolean(deleteFolder.isPending)

  const sortOptions = [
    { label: t('wardrobe_sort_created_desc'), value: 'created_at', order: 'desc' as const },
    { label: t('wardrobe_sort_created_asc'), value: 'created_at', order: 'asc' as const },
    { label: t('wardrobe_sort_last_worn'), value: 'last_worn', order: 'desc' as const },
    { label: t('wardrobe_sort_wear_count_asc'), value: 'wear_count', order: 'asc' as const },
    { label: t('wardrobe_sort_wear_count_desc'), value: 'wear_count', order: 'desc' as const },
    { label: t('wardrobe_sort_name_asc'), value: 'name', order: 'asc' as const },
  ]
  const typeOptions = [
    { label: t('wardrobe_all_types'), value: '' },
    ...((itemTypes ?? []).map((itemType) => ({
      label: formatItemTypeLabel(itemType.type),
      value: itemType.type,
    }))),
  ]
  const typeFilter = typeIndex === 0 ? undefined : typeOptions[typeIndex]?.value
  const sortOption = sortOptions[sortIndex]
  const folderFilter = folderIndex === 0 ? undefined : folders?.[folderIndex - 1]?.id

  const filters: ItemFilter = {
    type: typeFilter,
    is_archived: showArchived,
    sort_by: sortOption.value,
    sort_order: sortOption.order,
    favorite: filterFavorite ? true : undefined,
    needs_wash: filterNeedsWash ? true : undefined,
    folder_id: folderFilter,
  }

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteItems(filters, 20)
  const items = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.total ?? 0
  const hasActiveFilters = Boolean(
    typeFilter || filterFavorite || filterNeedsWash || showArchived || folderFilter
  )

  const scrollToUploadedItem = (itemId: string) =>
    new Promise<void>((resolve) => {
      const anchorId = `#${getWardrobeUploadedItemAnchor(itemId)}`
      const query = Taro.createSelectorQuery()
      let scrollTop = 0
      let top: number | undefined

      query.selectViewport().scrollOffset((result) => {
        scrollTop = result?.scrollTop ?? 0
      })
      query.select(anchorId).boundingClientRect((result) => {
        const rect = Array.isArray(result) ? result[0] : result
        top = rect?.top
      })
      query.exec(async () => {
        if (typeof top !== 'number') {
          resolve()
          return
        }

        try {
          await Taro.pageScrollTo({
            scrollTop: Math.max(scrollTop + top - 108, 0),
            duration: 280,
          })
        } catch {
          // Ignore scroll failures so upload success still completes.
        }

        resolve()
      })
    })

  // The infinite-query result is a fresh array reference on every refetch, so
  // we depend on a stable boolean instead of `items` to keep this effect from
  // firing on every cache touch. The ref guard on top still prevents
  // re-running for an already-handled upload.
  const uploadedItemPresent = !!uploadedItemId && items.some((item) => item.id === uploadedItemId)
  useEffect(() => {
    if (!uploadedItemId || isLoading || lastScrolledItemIdRef.current === uploadedItemId) return
    if (!uploadedItemPresent) return

    lastScrolledItemIdRef.current = uploadedItemId
    void scrollToUploadedItem(uploadedItemId).finally(() => {
      setUploadedItemId((current) => (current === uploadedItemId ? null : current))
    })
  }, [uploadedItemId, isLoading, uploadedItemPresent])

  useEffect(() => {
    if (!highlightedItemId) return

    const timeoutId = setTimeout(() => {
      setHighlightedItemId((current) => (current === highlightedItemId ? null : current))
    }, WARDROBE_UPLOADED_ITEM_HIGHLIGHT_MS)

    return () => clearTimeout(timeoutId)
  }, [highlightedItemId])

  if (!canRender) return null

  const handleChooseImage = async () => {
    if (addItemDisabled) return

    try {
      const result = await Taro.chooseImage({ count: 5, sizeType: ['compressed'] })
      if (result.tempFilePaths.length === 0) return
      const createdItem = await createItem.mutateAsync({ filePaths: result.tempFilePaths })
      setUploadedItemId(createdItem.id)
      setHighlightedItemId(createdItem.id)
      lastScrolledItemIdRef.current = null
      toastSuccess(t('wardrobe_add_success'))
    } catch (error) {
      if (isChooseImageCanceled(error)) return
      toastErrorFromException(error, t('wardrobe_add_failed'))
    }
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name || createFolder.isPending) return

    try {
      await createFolder.mutateAsync({ name })
      setNewFolderName('')
      toastSuccess(t('wardrobe_folder_created'))
    } catch {
      toastError(t('wardrobe_folder_create_failed'))
    }
  }

  const clearFilters = () => {
    setTypeIndex(0)
    setSortIndex(0)
    setFilterFavorite(false)
    setFilterNeedsWash(false)
    setShowArchived(false)
    setFolderIndex(0)
  }

  const startEditFolder = (folderId: string, name: string) => {
    setEditingFolderId(folderId)
    setEditingFolderName(name)
    setConfirmDeleteFolderId(null)
  }

  const cancelEditFolder = () => {
    setEditingFolderId(null)
    setEditingFolderName('')
  }

  const handleUpdateFolder = async (folderId: string) => {
    const name = editingFolderName.trim()
    if (!name || updateFolder.isPending) return

    try {
      await updateFolder.mutateAsync({ id: folderId, payload: { name } })
      cancelEditFolder()
      toastSuccess(t('wardrobe_folder_updated'))
    } catch {
      toastError(t('wardrobe_folder_update_failed'))
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (deleteFolder.isPending) return

    try {
      await deleteFolder.mutateAsync(folderId)
      setConfirmDeleteFolderId(null)
      if (folderFilter === folderId) {
        setFolderIndex(0)
      }
      toastSuccess(t('wardrobe_folder_deleted'))
    } catch {
      toastError(t('wardrobe_folder_delete_failed'))
    }
  }

  return (
    <PageShell
      title={t('page_wardrobe_title')}
      subtitle={tf('wardrobe_subtitle', { count: total })}
      navKey='wardrobe'
      useBuiltInTabBar
      actions={
        <View
          ariaRole='button'
          ariaLabel={t('wardrobe_add_action')}
          onClick={getEnabledActionHandler(addItemDisabled, handleChooseImage)}
          style={getActionButtonStyle({ variant: 'primary', compact: true, disabled: addItemDisabled })}
        >
          <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{t('wardrobe_add_action')}</Text>
        </View>
      }
    >
      {/* Filters */}
      <SectionCard
        compact
        title={t('wardrobe_filter_sort_title')}
        style={getWardrobeFilterPanelStyle()}
      >
        <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <CompactOptionGroup
            activeIndex={typeIndex}
            options={typeOptions.map((option) => option.label)}
            onChange={(nextIndex) => {
              setTypeIndex(nextIndex)
            }}
          />
          <CompactOptionGroup
            activeIndex={sortIndex}
            options={sortOptions.map((option) => option.label)}
            onChange={(nextIndex) => {
              setSortIndex(nextIndex)
            }}
          />
          <View style={actionWrapRowStyle}>
            <View
              ariaRole='button'
              ariaLabel={t('wardrobe_filter_favorite')}
              onClick={() => {
                setFilterFavorite(!filterFavorite)
              }}
              style={getWardrobeChipStyle(filterFavorite, 'favorite')}
            >
              <Text style={getWardrobeChipLabelStyle(filterFavorite)}>
                {t('wardrobe_filter_favorite')}
              </Text>
            </View>
            <View
              ariaRole='button'
              ariaLabel={t('wardrobe_filter_needs_wash')}
              onClick={() => {
                setFilterNeedsWash(!filterNeedsWash)
              }}
              style={getWardrobeChipStyle(filterNeedsWash, 'warning')}
            >
              <Text style={getWardrobeChipLabelStyle(filterNeedsWash)}>
                {t('wardrobe_filter_needs_wash')}
              </Text>
            </View>
            <View
              ariaRole='button'
              ariaLabel={t('wardrobe_filter_archived')}
              onClick={() => {
                setShowArchived(!showArchived)
              }}
              style={getWardrobeChipStyle(showArchived)}
            >
              <Text style={getWardrobeChipLabelStyle(showArchived)}>
                {t('wardrobe_filter_archived')}
              </Text>
            </View>
          </View>
          {folders && folders.length > 0 && (
            <View style={actionWrapRowStyle}>
              <View
                ariaRole='button'
                ariaLabel={t('wardrobe_all_folders')}
                onClick={() => {
                  setFolderIndex(0)
                }}
                style={getWardrobeChipStyle(folderIndex === 0)}
              >
                <Text style={getWardrobeChipLabelStyle(folderIndex === 0)}>
                  {t('wardrobe_all_folders')}
                </Text>
              </View>
              {folderList.map((folder, index) => {
                const active = folderIndex === index + 1
                return (
                  <View
                    key={folder.id}
                    ariaRole='button'
                    ariaLabel={folder.name}
                    onClick={() => {
                      setFolderIndex(index + 1)
                    }}
                    style={getWardrobeChipStyle(active)}
                  >
                    <Text style={getWardrobeChipLabelStyle(active)}>
                      {folder.icon ? `${folder.icon} ` : ''}{folder.name}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
          <View
            ariaRole='button'
            ariaLabel={t('wardrobe_folder_manage')}
            onClick={() => setShowFolderManager((current) => !current)}
            style={{ ...getActionButtonStyle({ compact: true }), alignSelf: 'flex-start' }}
          >
            <Text style={{ fontSize: '14px', color: colors.text }}>{t('wardrobe_folder_manage')}</Text>
          </View>
        </View>
      </SectionCard>

      {showFolderManager && (
        <SectionCard
          compact
          title={t('wardrobe_folder_title')}
          style={getWardrobeSectionCardStyle()}
        >
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <View style={{ ...actionRowStyle, alignItems: 'center' }}>
              <Input
                value={newFolderName}
                placeholder={t('wardrobe_folder_name_placeholder')}
                onInput={(event) => setNewFolderName(event.detail.value)}
                style={{ ...inputStyle, flex: 1, minHeight: '44px' }}
              />
              <View
                ariaRole='button'
                ariaLabel={t('wardrobe_folder_create')}
                onClick={getEnabledActionHandler(createFolderDisabled, handleCreateFolder)}
                style={getActionButtonStyle({ variant: 'primary', compact: true, minWidth: '92px', disabled: createFolderDisabled })}
              >
                <Text style={{ fontSize: '13px', color: colors.accentText, fontWeight: 600 }}>
                  {t('wardrobe_folder_create')}
                </Text>
              </View>
            </View>

            {folderList.length === 0 ? (
              <Text style={{ fontSize: '13px', color: colors.textMuted }}>{t('wardrobe_folder_empty')}</Text>
            ) : (
              <FlatList>
                {folderList.map((folder) => (
                  <FlatListRow
                    key={folder.id}
                    style={{
                      padding: '8px 0',
                    }}
                  >
                    {editingFolderId === folder.id ? (
                      <View style={{ ...actionRowStyle, alignItems: 'center', gap: '6px' }}>
                        <Input
                          value={editingFolderName}
                          onInput={(event) => setEditingFolderName(event.detail.value)}
                          style={{ ...inputStyle, flex: 1, minWidth: '0', height: '44px', minHeight: '44px', padding: '0 10px' }}
                        />
                        <View ariaRole='button' ariaLabel={t('wardrobe_folder_cancel')} onClick={cancelEditFolder} style={{ ...getActionButtonStyle({ compact: true }), padding: '0 10px' }}>
                          <Text style={{ fontSize: '12px', color: colors.text }}>{t('wardrobe_folder_cancel')}</Text>
                        </View>
                        <View
                          ariaRole='button'
                          ariaLabel={t('wardrobe_folder_save')}
                          onClick={getEnabledActionHandler(updateFolderDisabled, () => void handleUpdateFolder(folder.id))}
                          style={{ ...getActionButtonStyle({ variant: 'primary', compact: true, disabled: updateFolderDisabled }), padding: '0 10px' }}
                        >
                          <Text style={{ fontSize: '12px', color: colors.accentText }}>{t('wardrobe_folder_save')}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={{ ...actionRowStyle, alignItems: 'center' }}>
                        <View style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flex: 1, minWidth: 0 }}>
                          <Text style={{ fontSize: '14px', color: colors.text, fontWeight: 600 }}>
                            {folder.icon ? `${folder.icon} ` : ''}{folder.name}
                          </Text>
                          <Text style={{ fontSize: '12px', color: colors.textMuted }}>{folder.item_count}</Text>
                        </View>
                        <View style={{ ...actionRowStyle, gap: '6px' }}>
                          <View
                            ariaRole='button'
                            ariaLabel={`${t('wardrobe_folder_edit')} ${folder.name}`}
                            onClick={() => startEditFolder(folder.id, folder.name)}
                            style={{ ...getActionButtonStyle({ compact: true }), padding: '0 10px' }}
                          >
                            <Text style={{ fontSize: '12px', color: colors.text }}>{t('wardrobe_folder_edit')}</Text>
                          </View>
                          {confirmDeleteFolderId === folder.id ? (
                            <View
                              ariaRole='button'
                              ariaLabel={`${t('wardrobe_folder_confirm_delete')} ${folder.name}`}
                              onClick={getEnabledActionHandler(deleteFolderDisabled, () => void handleDeleteFolder(folder.id))}
                              style={{ ...getActionButtonStyle({ compact: true, tone: 'danger', disabled: deleteFolderDisabled }), padding: '0 10px' }}
                            >
                              <Text style={{ fontSize: '12px', color: colors.danger }}>
                                {t('wardrobe_folder_confirm_delete')}
                              </Text>
                            </View>
                          ) : (
                            <View
                              ariaRole='button'
                              ariaLabel={`${t('wardrobe_folder_delete')} ${folder.name}`}
                              onClick={getEnabledActionHandler(deleteFolderDisabled, () => {
                                setConfirmDeleteFolderId(folder.id)
                                cancelEditFolder()
                              })}
                              style={{ ...getActionButtonStyle({ compact: true, disabled: deleteFolderDisabled }), padding: '0 10px' }}
                            >
                              <Text style={{ fontSize: '12px', color: colors.danger }}>{t('wardrobe_folder_delete')}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </FlatListRow>
                ))}
              </FlatList>
            )}
          </View>
        </SectionCard>
      )}

      {/* Items grid */}
      {isLoading ? (
        <SectionCard
          compact
          title={t('wardrobe_loading_title')}
          style={getWardrobeSectionCardStyle()}
        >
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('wardrobe_loading')}</Text>
        </SectionCard>
      ) : items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? t('wardrobe_filtered_empty_title') : t('wardrobe_empty_title')}
          description={hasActiveFilters ? t('wardrobe_filtered_empty_description') : t('wardrobe_empty_description')}
          action={hasActiveFilters ? (
            <View
              ariaRole='button'
              ariaLabel={t('wardrobe_clear_filters')}
              onClick={clearFilters}
              style={getActionButtonStyle()}
            >
              <Text style={{ fontSize: '14px', color: colors.text }}>
                {t('wardrobe_clear_filters')}
              </Text>
            </View>
          ) : (
            <View
              ariaRole='button'
              ariaLabel={t('wardrobe_add_first_item')}
              onClick={getEnabledActionHandler(addItemDisabled, handleChooseImage)}
              style={getActionButtonStyle({ variant: 'primary', disabled: addItemDisabled })}
            >
              <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
                {t('wardrobe_add_first_item')}
              </Text>
            </View>
          )}
        />
      ) : (
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }}>
          {items.map((item) => {
            const itemTitle = item.name || formatItemTypeLabel(item.type)

            return (
              <View
                key={item.id}
                id={getWardrobeUploadedItemAnchor(item.id)}
                ariaRole='button'
                ariaLabel={tf('wardrobe_view_item_detail', { title: itemTitle })}
                onClick={() => setDetailItem(item)}
                style={{
                  width: 'calc(50% - 5px)',
                  boxSizing: 'border-box',
                }}
              >
                <ItemCard
                  item={item}
                  variant='wardrobe'
                  style={{
                    ...getWardrobeItemCardShellStyle(),
                    ...getWardrobeUploadedItemStyle(highlightedItemId === item.id),
                    height: '100%',
                  }}
                />
              </View>
            )
          })}
          {hasNextPage && (
            <View
              ariaRole='button'
              ariaLabel={t('wardrobe_load_more')}
              onClick={getEnabledActionHandler(isFetchingNextPage, () => void fetchNextPage())}
              style={{ ...getActionButtonStyle({ disabled: isFetchingNextPage }), width: '100%' }}
            >
              <Text style={{ fontSize: '14px', color: colors.text }}>
                {isFetchingNextPage ? t('wardrobe_loading') : t('wardrobe_load_more')}
              </Text>
            </View>
          )}
        </View>
      )}

      <ItemDetailSheet item={detailItem} visible={!!detailItem} onClose={() => setDetailItem(null)} />
    </PageShell>
  )
}
