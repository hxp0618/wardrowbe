import { useState } from 'react'
import { Image, ScrollView, Slider, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAcceptOutfit, useDeleteOutfit, useRejectOutfit, useSubmitOutfitFeedback } from '../hooks/use-outfits'
import { formatItemTypeLabel, formatOccasionLabel, formatOutfitSourceLabel, formatOutfitStatusLabel, formatWeatherConditionLabel } from '../lib/display'
import { useI18n } from '../lib/i18n'
import type { Outfit } from '../services/types'
import { colors, primaryButtonStyle, secondaryButtonStyle } from './ui-theme'

type OutfitDetailSheetProps = {
  outfit: Outfit | null
  visible: boolean
  onClose: () => void
}

export function OutfitDetailSheet(props: OutfitDetailSheetProps) {
  const { outfit, visible, onClose } = props
  const { t, tf } = useI18n()
  const acceptOutfit = useAcceptOutfit()
  const rejectOutfit = useRejectOutfit()
  const deleteOutfitMutation = useDeleteOutfit()
  const submitFeedback = useSubmitOutfitFeedback()
  const [showFeedback, setShowFeedback] = useState(false)
  const [rating, setRating] = useState(3)
  const [comment, setComment] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  if (!visible || !outfit) return null

  const handleAccept = async () => {
    try {
      await acceptOutfit.mutateAsync(outfit.id)
      void Taro.showToast({ title: t('outfit_detail_toast_accepted'), icon: 'success' })
    } catch { void Taro.showToast({ title: t('outfit_detail_toast_action_failed'), icon: 'none' }) }
  }

  const handleReject = async () => {
    try {
      await rejectOutfit.mutateAsync(outfit.id)
      void Taro.showToast({ title: t('outfit_detail_toast_rejected'), icon: 'success' })
    } catch { void Taro.showToast({ title: t('outfit_detail_toast_action_failed'), icon: 'none' }) }
  }

  const handleDelete = async () => {
    try {
      await deleteOutfitMutation.mutateAsync(outfit.id)
      void Taro.showToast({ title: t('outfit_detail_toast_deleted'), icon: 'success' })
      onClose()
    } catch { void Taro.showToast({ title: t('outfit_detail_toast_delete_failed'), icon: 'none' }) }
  }

  const handleSubmitFeedback = async () => {
    try {
      await submitFeedback.mutateAsync({
        outfitId: outfit.id,
        feedback: {
          rating,
          comment: comment.trim() || undefined,
          actually_worn: true,
        },
      })
      void Taro.showToast({ title: t('outfit_detail_toast_feedback_submitted'), icon: 'success' })
      setShowFeedback(false)
    } catch { void Taro.showToast({ title: t('outfit_detail_toast_feedback_failed'), icon: 'none' }) }
  }

  return (
    <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <View onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '85vh', backgroundColor: colors.surface, borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', borderTop: `1px solid ${colors.border}` }}>
        <View style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <View style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: colors.sheetHandle }} />
        </View>
        <ScrollView scrollY style={{ flex: 1 }}>
          <View style={{ padding: '0 20px 40px' }}>
            {/* Header */}
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Text style={{ fontSize: '20px', fontWeight: 600, color: colors.text }}>
                {outfit.name || formatOccasionLabel(outfit.occasion)}
              </Text>
              <View style={{ display: 'flex', gap: '8px' }}>
                <Text style={{ fontSize: '12px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '4px 10px', borderRadius: '999px' }}>
                  {formatOutfitSourceLabel(outfit.source)}
                </Text>
                <Text style={{ fontSize: '12px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '4px 10px', borderRadius: '999px' }}>
                  {formatOutfitStatusLabel(outfit.status)}
                </Text>
              </View>
            </View>

            {/* Date */}
            {outfit.scheduled_for && (
              <Text style={{ display: 'block', fontSize: '13px', color: colors.textMuted, marginBottom: '12px' }}>
                📅 {outfit.scheduled_for}
              </Text>
            )}

            {/* Reasoning */}
            {outfit.reasoning && (
              <View style={{ marginBottom: '16px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.22)' }}>
                <Text style={{ fontSize: '13px', color: colors.success, lineHeight: 1.5 }}>{outfit.reasoning}</Text>
              </View>
            )}

            {/* Highlights */}
            {outfit.highlights && outfit.highlights.length > 0 && (
              <View style={{ marginBottom: '16px' }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>{t('outfit_detail_highlights_title')}</Text>
                {outfit.highlights.map((h, i) => (
                  <Text key={i} style={{ display: 'block', fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>• {h}</Text>
                ))}
              </View>
            )}

            {/* Items */}
            <View style={{ marginBottom: '16px' }}>
              <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '10px' }}>{t('outfit_detail_items_title')}</Text>
              <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {outfit.items.map((item) => {
                  const imgUrl = item.thumbnail_url || item.image_url
                  return (
                    <View key={item.id} style={{ width: '120px' }}>
                      {imgUrl ? (
                        <Image src={imgUrl} mode='aspectFill' style={{ width: '120px', height: '120px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }} />
                      ) : (
                        <View style={{ width: '120px', height: '120px', borderRadius: '14px', backgroundColor: colors.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: '12px', color: colors.textMuted }}>{formatItemTypeLabel(item.type)}</Text>
                        </View>
                      )}
                      <Text style={{ display: 'block', fontSize: '13px', color: colors.text, marginTop: '6px' }} numberOfLines={1}>
                        {item.name || formatItemTypeLabel(item.type)}
                      </Text>
                      {item.layer_type && (
                        <Text style={{ fontSize: '11px', color: colors.textMuted }}>{item.layer_type}</Text>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Style notes */}
            {outfit.style_notes && (
              <View style={{ marginBottom: '16px', padding: '12px', borderRadius: '12px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>{t('outfit_detail_style_notes_title')}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{outfit.style_notes}</Text>
              </View>
            )}

            {/* Weather */}
            {outfit.weather && (
              <View style={{ marginBottom: '16px', padding: '12px', borderRadius: '12px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>{t('outfit_detail_weather_title')}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>
                  {tf('outfit_detail_weather_summary', {
                    temp: `${outfit.weather.temperature}°C`,
                    condition: formatWeatherConditionLabel(outfit.weather.condition),
                    chance: outfit.weather.precipitation_chance,
                  })}
                </Text>
              </View>
            )}

            {/* Existing feedback */}
            {outfit.feedback && outfit.feedback.rating != null && (
              <View style={{ marginBottom: '16px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.22)' }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>{t('outfit_detail_feedback_title')}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>
                  {tf('outfit_detail_feedback_summary', {
                    rating: outfit.feedback.rating,
                    comment: outfit.feedback.comment ? ` · ${outfit.feedback.comment}` : '',
                  })}
                </Text>
              </View>
            )}

            {/* Feedback form */}
            {showFeedback && (
              <View style={{ marginBottom: '16px', padding: '16px', borderRadius: '14px', backgroundColor: colors.surfaceMuted, border: `1px solid ${colors.border}` }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '12px' }}>{t('outfit_detail_rate_title')}</Text>
                <View style={{ marginBottom: '12px' }}>
                  <Text style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '8px' }}>{tf('outfit_detail_rating', { rating })}</Text>
                  <Slider min={1} max={5} step={1} value={rating} onChange={(e) => setRating(e.detail.value)} activeColor={colors.accent} backgroundColor={colors.surfaceSelected} />
                </View>
                <Textarea
                  value={comment}
                  placeholder={t('outfit_detail_comment_placeholder')}
                  onInput={(e) => setComment(e.detail.value)}
                  style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.text, boxSizing: 'border-box', fontSize: '13px' }}
                />
                <View style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <View onClick={() => setShowFeedback(false)} style={{ ...secondaryButtonStyle, flex: 1 }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{t('outfit_detail_cancel')}</Text>
                  </View>
                  <View onClick={handleSubmitFeedback} style={{ ...primaryButtonStyle, flex: 1 }}>
                    <Text style={{ fontSize: '14px', color: colors.accentText }}>{t('outfit_detail_submit')}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {outfit.status === 'pending' && (
                <View style={{ display: 'flex', gap: '10px' }}>
                  <View onClick={handleAccept} style={{ flex: 1, padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.22)', textAlign: 'center' }}>
                    <Text style={{ fontSize: '14px', color: colors.success }}>{t('outfit_detail_accept')}</Text>
                  </View>
                  <View onClick={handleReject} style={{ flex: 1, padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)', textAlign: 'center' }}>
                    <Text style={{ fontSize: '14px', color: colors.danger }}>{t('outfit_detail_reject')}</Text>
                  </View>
                </View>
              )}

              {outfit.status === 'accepted' && !showFeedback && (
                <View onClick={() => setShowFeedback(true)} style={secondaryButtonStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{t('outfit_detail_rate_action')}</Text>
                </View>
              )}

              {!showConfirmDelete ? (
                <View onClick={() => setShowConfirmDelete(true)} style={{ ...secondaryButtonStyle, backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)' }}>
                  <Text style={{ fontSize: '14px', color: colors.danger }}>{t('outfit_detail_delete_action')}</Text>
                </View>
              ) : (
                <View style={{ display: 'flex', gap: '10px' }}>
                  <View onClick={() => setShowConfirmDelete(false)} style={{ ...secondaryButtonStyle, flex: 1 }}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{t('outfit_detail_cancel')}</Text>
                  </View>
                  <View onClick={handleDelete} style={{ ...primaryButtonStyle, flex: 1, backgroundColor: '#dc2626' }}>
                    <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>{t('outfit_detail_delete_confirm')}</Text>
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
