import { useState } from 'react'
import { Image, Picker, ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
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
import { formatItemTypeLabel, formatOccasionLabel, formatStyleLabel, formatSubtypeLabel } from '../lib/display'
import type { Item } from '../services/types'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from './ui-theme'

type ItemDetailSheetProps = {
  item: Item | null
  visible: boolean
  onClose: () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const WASH_METHODS = ['手洗', '机洗', '干洗', '免洗']
export function ItemDetailSheet(props: ItemDetailSheetProps) {
  const { item, visible, onClose } = props
  const toggleFavorite = useToggleFavorite()
  const toggleNeedsWash = useToggleNeedsWash()
  const reanalyze = useReanalyzeItem()
  const archive = useArchiveItem()
  const unarchive = useUnarchiveItem()
  const deleteItem = useDeleteItem()
  const logWear = useLogWear()
  const logWash = useLogWash()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showLogWear, setShowLogWear] = useState(false)
  const [showLogWash, setShowLogWash] = useState(false)
  const [wearOccasionIndex, setWearOccasionIndex] = useState(0)
  const [washMethodIndex, setWashMethodIndex] = useState(0)

  if (!visible || !item) return null

  const imageUrl = item.medium_url || item.thumbnail_url || item.image_url
  const typeLabel = formatItemTypeLabel(item.type)
  const subtypeLabel = formatSubtypeLabel(item.subtype)
  const title = item.name || typeLabel
  const statusLabel =
    item.status === 'processing' ? '分析中'
    : item.status === 'error' ? '分析失败'
    : item.status === 'archived' ? '已归档' : '就绪'
  const statusColor =
    item.status === 'error' ? '#EF4444'
    : item.status === 'processing' ? '#F59E0B'
    : item.status === 'archived' ? '#6B7280' : '#22C55E'

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite.mutateAsync({ id: item.id, favorite: !item.favorite })
      void Taro.showToast({ title: item.favorite ? '已取消收藏' : '已收藏', icon: 'success' })
    } catch { void Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  const handleToggleWash = async () => {
    try {
      await toggleNeedsWash.mutateAsync({ id: item.id, needsWash: !item.needs_wash })
      void Taro.showToast({ title: item.needs_wash ? '已标记干净' : '已标记需清洗', icon: 'success' })
    } catch { void Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  const handleReanalyze = async () => {
    try {
      await reanalyze.mutateAsync(item.id)
      void Taro.showToast({ title: '已重新分析', icon: 'success' })
    } catch { void Taro.showToast({ title: '重新分析失败', icon: 'none' }) }
  }

  const handleArchive = async () => {
    try {
      await archive.mutateAsync({ id: item.id })
      void Taro.showToast({ title: '已归档', icon: 'success' })
      onClose()
    } catch { void Taro.showToast({ title: '归档失败', icon: 'none' }) }
  }

  const handleUnarchive = async () => {
    try {
      await unarchive.mutateAsync(item.id)
      void Taro.showToast({ title: '已取消归档', icon: 'success' })
    } catch { void Taro.showToast({ title: '操作失败', icon: 'none' }) }
  }

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(item.id)
      void Taro.showToast({ title: '已删除', icon: 'success' })
      onClose()
    } catch { void Taro.showToast({ title: '删除失败', icon: 'none' }) }
  }

  const handleLogWear = async () => {
    try {
      await logWear.mutateAsync({ id: item.id, occasion: OCCASIONS[wearOccasionIndex] })
      void Taro.showToast({ title: '已记录穿着', icon: 'success' })
      setShowLogWear(false)
    } catch { void Taro.showToast({ title: '记录失败', icon: 'none' }) }
  }

  const handleLogWash = async () => {
    try {
      await logWash.mutateAsync({ id: item.id, method: WASH_METHODS[washMethodIndex] })
      void Taro.showToast({ title: '已记录清洗', icon: 'success' })
      setShowLogWash(false)
    } catch { void Taro.showToast({ title: '记录失败', icon: 'none' }) }
  }

  const additionalImages = item.additional_images || []
  const allImages = [imageUrl, ...additionalImages.map((img) => img.medium_url || img.thumbnail_url || img.image_url)].filter(Boolean) as string[]

  return (
    <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <View onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '85vh', backgroundColor: colors.surface, borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', borderTop: `1px solid ${colors.border}` }}>
        <View style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <View style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: '#3f3f46' }} />
        </View>
        <ScrollView scrollY style={{ flex: 1 }}>
          <View style={{ padding: '0 20px 40px' }}>
            {allImages.length > 0 && (
              <ScrollView scrollX style={{ marginBottom: '16px' }}>
                <View style={{ display: 'inline-flex', gap: '10px' }}>
                  {allImages.map((url, i) => (
                    <Image key={i} src={url} mode='aspectFill' style={{ width: '200px', height: '200px', borderRadius: '16px', backgroundColor: colors.surfaceMuted, display: 'inline-block' }}
                      onClick={() => Taro.previewImage({ current: url, urls: allImages })} />
                  ))}
                </View>
              </ScrollView>
            )}
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Text style={{ fontSize: '22px', fontWeight: 600, color: colors.text }}>{title}</Text>
              <Text style={{ fontSize: '12px', color: statusColor, backgroundColor: `${statusColor}15`, padding: '4px 12px', borderRadius: '999px' }}>{statusLabel}</Text>
            </View>
            <Text style={{ display: 'block', fontSize: '13px', color: colors.textMuted, marginBottom: '8px' }}>
              {typeLabel}{subtypeLabel ? ` · ${subtypeLabel}` : ''}{item.brand ? ` · ${item.brand}` : ''}
            </Text>
            <View style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <View style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ fontSize: '12px', color: colors.textMuted }}>穿着次数</Text>
                <Text style={{ display: 'block', fontSize: '20px', fontWeight: 600, color: colors.text }}>{item.wear_count}</Text>
              </View>
              <View style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ fontSize: '12px', color: colors.textMuted }}>数量</Text>
                <Text style={{ display: 'block', fontSize: '20px', fontWeight: 600, color: colors.text }}>{item.quantity}</Text>
              </View>
              {item.last_worn_at && (
                <View style={{ padding: '10px 14px', borderRadius: '12px', backgroundColor: colors.surfaceMuted }}>
                  <Text style={{ fontSize: '12px', color: colors.textMuted }}>上次穿着</Text>
                  <Text style={{ display: 'block', fontSize: '13px', color: colors.text }}>{formatDate(item.last_worn_at)}</Text>
                </View>
              )}
            </View>
            {item.tags && (
              <View style={{ marginBottom: '16px' }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>标签</Text>
                <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {item.tags.style?.map((s) => <Text key={s} style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '4px 10px', borderRadius: '999px' }}>{formatStyleLabel(s)}</Text>)}
                  {item.tags.season?.map((s) => <Text key={s} style={{ fontSize: '11px', color: colors.warning, backgroundColor: 'rgba(251, 191, 36, 0.12)', padding: '4px 10px', borderRadius: '999px' }}>{s}</Text>)}
                  {item.tags.material && <Text style={{ fontSize: '11px', color: colors.success, backgroundColor: 'rgba(52, 211, 153, 0.12)', padding: '4px 10px', borderRadius: '999px' }}>{item.tags.material}</Text>}
                  {item.tags.pattern && <Text style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: '#1f2937', padding: '4px 10px', borderRadius: '999px' }}>{item.tags.pattern}</Text>}
                </View>
              </View>
            )}
            {item.ai_description && (
              <View style={{ marginBottom: '16px', padding: '12px', borderRadius: '12px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>AI 描述</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{item.ai_description}</Text>
              </View>
            )}
            {item.notes && (
              <View style={{ marginBottom: '16px', padding: '12px', borderRadius: '12px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>备注</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{item.notes}</Text>
              </View>
            )}

            {/* Log wear form */}
            {showLogWear && (
              <View style={{ marginBottom: '12px', padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.22)' }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '10px' }}>记录穿着</Text>
                <Picker mode='selector' range={OCCASIONS} value={wearOccasionIndex} onChange={(e) => setWearOccasionIndex(Number(e.detail.value))}>
                  <View style={{ ...inputStyle, marginBottom: '10px' }}>
                    <Text style={{ fontSize: '13px', color: colors.text }}>
                      场景：{formatOccasionLabel(OCCASIONS[wearOccasionIndex])}
                    </Text>
                  </View>
                </Picker>
                <View style={{ display: 'flex', gap: '10px' }}>
                  <View onClick={() => setShowLogWear(false)} style={{ ...secondaryButtonStyle, flex: 1 }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>取消</Text>
                  </View>
                  <View onClick={handleLogWear} style={{ ...primaryButtonStyle, flex: 1, backgroundColor: '#166534' }}>
                    <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>确认</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Log wash form */}
            {showLogWash && (
              <View style={{ marginBottom: '12px', padding: '14px', borderRadius: '14px', backgroundColor: '#172554', border: '1px solid #1d4ed8' }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '10px' }}>记录清洗</Text>
                <Picker mode='selector' range={WASH_METHODS} value={washMethodIndex} onChange={(e) => setWashMethodIndex(Number(e.detail.value))}>
                  <View style={{ ...inputStyle, marginBottom: '10px' }}>
                    <Text style={{ fontSize: '13px', color: colors.text }}>方式：{WASH_METHODS[washMethodIndex]}</Text>
                  </View>
                </Picker>
                <View style={{ display: 'flex', gap: '10px' }}>
                  <View onClick={() => setShowLogWash(false)} style={{ ...secondaryButtonStyle, flex: 1 }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>取消</Text>
                  </View>
                  <View onClick={handleLogWash} style={{ ...primaryButtonStyle, flex: 1, backgroundColor: '#1D4ED8' }}>
                    <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>确认</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action buttons */}
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <View style={{ display: 'flex', gap: '10px' }}>
                <View onClick={handleToggleFavorite} style={{ flex: 1, padding: '12px', borderRadius: '14px', backgroundColor: item.favorite ? 'rgba(248, 113, 113, 0.12)' : colors.surfaceMuted, border: item.favorite ? '1px solid rgba(248, 113, 113, 0.22)' : `1px solid ${colors.border}`, textAlign: 'center' }}>
                  <Text style={{ fontSize: '14px', color: item.favorite ? colors.danger : colors.text }}>{item.favorite ? '已收藏' : '收藏'}</Text>
                </View>
                <View onClick={handleToggleWash} style={{ flex: 1, padding: '12px', borderRadius: '14px', backgroundColor: item.needs_wash ? 'rgba(251, 191, 36, 0.12)' : colors.surfaceMuted, border: item.needs_wash ? '1px solid rgba(251, 191, 36, 0.22)' : `1px solid ${colors.border}`, textAlign: 'center' }}>
                  <Text style={{ fontSize: '14px', color: item.needs_wash ? colors.warning : colors.text }}>{item.needs_wash ? '需清洗' : '已干净'}</Text>
                </View>
              </View>

              {!showLogWear && !showLogWash && (
                <View style={{ display: 'flex', gap: '10px' }}>
                  <View onClick={() => setShowLogWear(true)} style={{ flex: 1, padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.22)', textAlign: 'center' }}>
                    <Text style={{ fontSize: '14px', color: colors.success }}>记录穿着</Text>
                  </View>
                  <View onClick={() => setShowLogWash(true)} style={{ flex: 1, padding: '12px', borderRadius: '14px', backgroundColor: '#172554', border: '1px solid #1d4ed8', textAlign: 'center' }}>
                    <Text style={{ fontSize: '14px', color: '#93C5FD' }}>记录清洗</Text>
                  </View>
                </View>
              )}

              {(item.status === 'error' || item.status === 'ready') && (
                <View onClick={handleReanalyze} style={secondaryButtonStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>重新分析</Text>
                </View>
              )}

              {item.is_archived ? (
                <View onClick={handleUnarchive} style={secondaryButtonStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>取消归档</Text>
                </View>
              ) : (
                <View onClick={handleArchive} style={secondaryButtonStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>归档</Text>
                </View>
              )}

              {!showConfirmDelete ? (
                <View onClick={() => setShowConfirmDelete(true)} style={{ ...secondaryButtonStyle, backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)' }}>
                  <Text style={{ fontSize: '14px', color: colors.danger }}>删除</Text>
                </View>
              ) : (
                <View style={{ display: 'flex', gap: '10px' }}>
                  <View onClick={() => setShowConfirmDelete(false)} style={{ ...secondaryButtonStyle, flex: 1 }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>取消</Text>
                  </View>
                  <View onClick={handleDelete} style={{ ...primaryButtonStyle, flex: 1, backgroundColor: '#dc2626' }}>
                    <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>确认删除</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
