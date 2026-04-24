import { useState } from 'react'
import { Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { EmptyState } from '../../components/empty-state'
import { ItemCard } from '../../components/item-card'
import { ItemDetailSheet } from '../../components/item-detail-sheet'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useFolders } from '../../hooks/use-folders'
import { useCreateItemWithImages, useItems, useItemTypes } from '../../hooks/use-items'
import { useI18n } from '../../lib/i18n'

import type { Item, ItemFilter } from '../../services/types'

const SORT_OPTIONS = [
  { label: '最新添加', value: 'created_at', order: 'desc' as const },
  { label: '最早添加', value: 'created_at', order: 'asc' as const },
  { label: '最近穿着', value: 'last_worn', order: 'desc' as const },
  { label: '最少穿着', value: 'wear_count', order: 'asc' as const },
  { label: '最多穿着', value: 'wear_count', order: 'desc' as const },
  { label: '名称 A-Z', value: 'name', order: 'asc' as const },
]

export default function WardrobePage() {
  const canRender = useAuthGuard()
  const [page, setPage] = useState(1)
  const [typeIndex, setTypeIndex] = useState(0)
  const [sortIndex, setSortIndex] = useState(0)
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [filterNeedsWash, setFilterNeedsWash] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [folderIndex, setFolderIndex] = useState(0)
  const [detailItem, setDetailItem] = useState<Item | null>(null)
  const { t } = useI18n()
  const { data: itemTypes } = useItemTypes()
  const { data: folders } = useFolders()
  const createItem = useCreateItemWithImages()

  const typeOptions = ['全部类型', ...(itemTypes ?? []).map((t) => t.type)]
  const typeFilter = typeIndex === 0 ? undefined : typeOptions[typeIndex]
  const sortOption = SORT_OPTIONS[sortIndex]
  const folderOptions = ['全部文件夹', ...(folders ?? []).map((f) => f.name)]
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

  const { data, isLoading } = useItems(filters, page, 20)
  const items = data?.items || []
  const total = data?.total || 0

  if (!canRender) return null

  const handleChooseImage = async () => {
    try {
      const result = await Taro.chooseImage({ count: 5, sizeType: ['compressed'] })
      if (result.tempFilePaths.length === 0) return
      await createItem.mutateAsync({ filePaths: result.tempFilePaths })
      void Taro.showToast({ title: '单品已添加', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '添加失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell
      title={t('page_wardrobe_title')}
      subtitle={`共 ${total} 件单品`}
      navKey='wardrobe'
      useBuiltInTabBar
      actions={
        <View onClick={handleChooseImage} style={{ ...primaryButtonStyle, minHeight: '40px', padding: '10px 14px' }}>
          <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>添加</Text>
        </View>
      }
    >
      {/* Filters */}
      <SectionCard title={t('wardrobe_filter_sort_title')}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <View style={{ display: 'flex', gap: '10px' }}>
            <View style={{ flex: 1 }}>
              <Picker mode='selector' range={typeOptions} value={typeIndex} onChange={(e) => { setTypeIndex(Number(e.detail.value)); setPage(1) }}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{typeOptions[typeIndex]}</Text>
                </View>
              </Picker>
            </View>
            <View style={{ flex: 1 }}>
              <Picker mode='selector' range={SORT_OPTIONS.map((o) => o.label)} value={sortIndex} onChange={(e) => { setSortIndex(Number(e.detail.value)); setPage(1) }}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{SORT_OPTIONS[sortIndex].label}</Text>
                </View>
              </Picker>
            </View>
          </View>
          <View style={{ display: 'flex', gap: '10px' }}>
            <View
              onClick={() => { setFilterFavorite(!filterFavorite); setPage(1) }}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: filterFavorite ? '1px solid rgba(248, 113, 113, 0.25)' : `1px solid ${colors.border}`,
                backgroundColor: filterFavorite ? 'rgba(248, 113, 113, 0.12)' : colors.surfaceMuted,
              }}
            >
              <Text style={{ fontSize: '12px', color: filterFavorite ? colors.danger : colors.textMuted }}>{t('wardrobe_filter_favorite')}</Text>
            </View>
            <View
              onClick={() => { setFilterNeedsWash(!filterNeedsWash); setPage(1) }}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: filterNeedsWash ? '1px solid rgba(251, 191, 36, 0.25)' : `1px solid ${colors.border}`,
                backgroundColor: filterNeedsWash ? 'rgba(251, 191, 36, 0.12)' : colors.surfaceMuted,
              }}
            >
              <Text style={{ fontSize: '12px', color: filterNeedsWash ? colors.warning : colors.textMuted }}>{t('wardrobe_filter_needs_wash')}</Text>
            </View>
            <View
              onClick={() => { setShowArchived(!showArchived); setPage(1) }}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: showArchived ? `1px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
                backgroundColor: showArchived ? colors.surfaceSelected : colors.surfaceMuted,
              }}
            >
              <Text style={{ fontSize: '12px', color: showArchived ? colors.text : colors.textMuted }}>{t('wardrobe_filter_archived')}</Text>
            </View>
          </View>
          {folders && folders.length > 0 && (
            <Picker mode='selector' range={folderOptions} value={folderIndex} onChange={(e) => { setFolderIndex(Number(e.detail.value)); setPage(1) }}>
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{folderOptions[folderIndex]}</Text>
              </View>
            </Picker>
          )}
        </View>
      </SectionCard>

      {/* Items grid */}
      {isLoading ? (
        <SectionCard title={t('wardrobe_loading_title')}>
          <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('wardrobe_loading')}</Text>
        </SectionCard>
      ) : items.length === 0 ? (
        <EmptyState
          title={t('wardrobe_empty_title')}
          description={t('wardrobe_empty_description')}
          action={
            <View onClick={handleChooseImage} style={primaryButtonStyle}>
              <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
                {t('wardrobe_add_first_item')}
              </Text>
            </View>
          }
        />
      ) : (
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => (
            <View key={item.id} onClick={() => setDetailItem(item)}>
              <ItemCard item={item} />
            </View>
          ))}
          {data?.has_more && (
            <View onClick={() => setPage((p) => p + 1)} style={secondaryButtonStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>加载更多</Text>
            </View>
          )}
        </View>
      )}

      <ItemDetailSheet item={detailItem} visible={!!detailItem} onClose={() => setDetailItem(null)} />
    </PageShell>
  )
}
