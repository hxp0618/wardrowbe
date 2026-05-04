import { useEffect, useState } from 'react'
import { Slider, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAcceptOutfit, useDeleteOutfit, useRejectOutfit, useSubmitOutfitFeedback } from '../hooks/use-outfits'
import { formatItemTypeLabel, formatOccasionLabel, formatOutfitSourceLabel, formatOutfitStatusLabel, formatWeatherConditionLabel } from '../lib/display'
import { useI18n } from '../lib/i18n'
import type { Outfit } from '../services/types'
import {
  actionRowStyle,
  actionStackStyle,
  getActionButtonStyle,
  getEnabledActionHandler,
} from './action-style'
import { OutfitImageGrid } from './outfit-image-grid'
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
  const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(outfit)

  useEffect(() => {
    setCurrentOutfit(outfit)
    setShowFeedback(false)
    setShowConfirmDelete(false)
    setRating(3)
    setComment('')
  }, [outfit, visible])

  useEffect(() => {
    if (!visible) return undefined

    void Taro.hideTabBar({ animation: false }).catch(() => undefined)

    return () => {
      void Taro.showTabBar({ animation: false }).catch(() => undefined)
    }
  }, [visible])

  if (!visible || !currentOutfit) return null

  const statusActionPending = acceptOutfit.isPending || rejectOutfit.isPending
  const deletePending = deleteOutfitMutation.isPending
  const feedbackPending = submitFeedback.isPending

  const handleAccept = async () => {
    if (statusActionPending) return

    try {
      const updated = await acceptOutfit.mutateAsync(currentOutfit.id)
      setCurrentOutfit(updated)
      void Taro.showToast({ title: t('outfit_detail_toast_accepted'), icon: 'success' })
    } catch { void Taro.showToast({ title: t('outfit_detail_toast_action_failed'), icon: 'none' }) }
  }

  const handleReject = async () => {
    if (statusActionPending) return

    try {
      const updated = await rejectOutfit.mutateAsync(currentOutfit.id)
      setCurrentOutfit(updated)
      void Taro.showToast({ title: t('outfit_detail_toast_rejected'), icon: 'success' })
    } catch { void Taro.showToast({ title: t('outfit_detail_toast_action_failed'), icon: 'none' }) }
  }

  const handleDelete = async () => {
    if (deletePending) return

    try {
      await deleteOutfitMutation.mutateAsync(currentOutfit.id)
      void Taro.showToast({ title: t('outfit_detail_toast_deleted'), icon: 'success' })
      onClose()
    } catch { void Taro.showToast({ title: t('outfit_detail_toast_delete_failed'), icon: 'none' }) }
  }

  const handleSubmitFeedback = async () => {
    if (feedbackPending) return

    try {
      const updated = await submitFeedback.mutateAsync({
        outfitId: currentOutfit.id,
        feedback: {
          rating,
          comment: comment.trim() || undefined,
          actually_worn: true,
          worn: true,
        },
      })
      setCurrentOutfit(updated)
      void Taro.showToast({ title: t('outfit_detail_toast_feedback_submitted'), icon: 'success' })
      setShowFeedback(false)
    } catch { void Taro.showToast({ title: t('outfit_detail_toast_feedback_failed'), icon: 'none' }) }
  }

  return (
    <View catchMove style={sheetOverlayStyle}>
      <View ariaRole='button' ariaLabel={t('outfit_detail_close')} catchMove onClick={onClose} style={sheetBackdropStyle} />
      <View catchMove style={sheetPanelStyle}>
        <View style={sheetHandleTrackStyle}>
          <View style={sheetHandleStyle} />
        </View>
        <View catchMove style={sheetScrollBodyStyle}>
          <View style={sheetContentStyle}>
            {/* Header */}
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: colors.text }}>
                {currentOutfit.name || formatOccasionLabel(currentOutfit.occasion)}
              </Text>
              <View style={{ display: 'flex', gap: '8px' }}>
                <Text style={{ fontSize: '12px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '4px 10px', borderRadius: '999px' }}>
                  {formatOutfitSourceLabel(currentOutfit.source)}
                </Text>
                <Text style={{ fontSize: '12px', color: colors.textMuted, backgroundColor: colors.surfaceMuted, padding: '4px 10px', borderRadius: '999px' }}>
                  {formatOutfitStatusLabel(currentOutfit.status)}
                </Text>
              </View>
            </View>

            {/* Date */}
            {currentOutfit.scheduled_for && (
              <Text style={{ display: 'block', fontSize: '13px', color: colors.textMuted, marginBottom: '10px' }}>
                {currentOutfit.scheduled_for}
              </Text>
            )}

            {/* Items */}
            <View style={{ marginBottom: '12px' }}>
              <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>{t('outfit_detail_items_title')}</Text>
              <OutfitImageGrid items={currentOutfit.items} />
              <View style={{ borderTop: `1px solid ${colors.border}`, marginTop: '10px' }}>
                {currentOutfit.items.map((item) => (
                  <View key={item.id} style={{ minHeight: '38px', padding: '8px 0', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <Text style={{ flex: 1, fontSize: '13px', color: colors.text }} numberOfLines={1}>
                      {item.name || formatItemTypeLabel(item.type)}
                    </Text>
                    {item.layer_type ? (
                      <Text style={{ fontSize: '11px', color: colors.textMuted }}>{item.layer_type}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>

            {/* Reasoning */}
            {currentOutfit.reasoning && (
              <View style={flatDetailBlockStyle}>
                <Text style={{ fontSize: '13px', color: colors.success, lineHeight: 1.5 }}>{currentOutfit.reasoning}</Text>
              </View>
            )}

            {/* Highlights */}
            {currentOutfit.highlights && currentOutfit.highlights.length > 0 && (
              <View style={{ marginBottom: '12px' }}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '8px' }}>{t('outfit_detail_highlights_title')}</Text>
                {currentOutfit.highlights.map((h, i) => (
                  <Text key={i} style={{ display: 'block', fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{h}</Text>
                ))}
              </View>
            )}

            {/* Style notes */}
            {currentOutfit.style_notes && (
              <View style={flatDetailBlockStyle}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>{t('outfit_detail_style_notes_title')}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>{currentOutfit.style_notes}</Text>
              </View>
            )}

            {/* Weather */}
            {currentOutfit.weather && (
              <View style={flatDetailBlockStyle}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>{t('outfit_detail_weather_title')}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>
                  {tf('outfit_detail_weather_summary', {
                    temp: `${currentOutfit.weather.temperature}°C`,
                    condition: formatWeatherConditionLabel(currentOutfit.weather.condition),
                    chance: currentOutfit.weather.precipitation_chance,
                  })}
                </Text>
              </View>
            )}

            {/* Existing feedback */}
            {currentOutfit.feedback && currentOutfit.feedback.rating != null && (
              <View style={flatDetailBlockStyle}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '6px' }}>{t('outfit_detail_feedback_title')}</Text>
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>
                  {tf('outfit_detail_feedback_summary', {
                    rating: currentOutfit.feedback.rating,
                    comment: currentOutfit.feedback.comment ? ` · ${currentOutfit.feedback.comment}` : '',
                  })}
                </Text>
              </View>
            )}

            {/* Feedback form */}
            {showFeedback && (
              <View style={flatActionFormStyle}>
                <Text style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '10px' }}>{t('outfit_detail_rate_title')}</Text>
                <View style={{ marginBottom: '10px' }}>
                  <Text style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '8px' }}>{tf('outfit_detail_rating', { rating })}</Text>
                  <Slider min={1} max={5} step={1} value={rating} onChange={(e) => setRating(e.detail.value)} activeColor={colors.accent} backgroundColor={colors.surfaceSelected} />
                </View>
                <Textarea
                  value={comment}
                  placeholder={t('outfit_detail_comment_placeholder')}
                  onInput={(e) => setComment(e.detail.value)}
                  style={{ width: '100%', height: '72px', padding: '10px', borderRadius: '10px', border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.text, boxSizing: 'border-box', fontSize: '13px' }}
                />
                <View style={{ ...actionRowStyle, marginTop: '10px' }}>
                  <View ariaRole='button' ariaLabel={t('outfit_detail_cancel')} onClick={() => setShowFeedback(false)} style={getActionButtonStyle({ flex: 1 })}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{t('outfit_detail_cancel')}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={t('outfit_detail_submit')}
                    onClick={getEnabledActionHandler(feedbackPending, handleSubmitFeedback)}
                    style={getActionButtonStyle({ variant: 'primary', flex: 1, disabled: feedbackPending })}
                  >
                    <Text style={{ fontSize: '14px', color: colors.accentText }}>{t('outfit_detail_submit')}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={actionStackStyle}>
              {currentOutfit.status === 'pending' && (
                <View style={actionRowStyle}>
                  <View
                    ariaRole='button'
                    ariaLabel={t('outfit_detail_accept')}
                    onClick={getEnabledActionHandler(statusActionPending, handleAccept)}
                    style={{ ...getActionButtonStyle({ variant: 'plain', tone: 'success', flex: 1, disabled: statusActionPending }), textAlign: 'center' }}
                  >
                    <Text style={{ fontSize: '14px', color: colors.success }}>{t('outfit_detail_accept')}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={t('outfit_detail_reject')}
                    onClick={getEnabledActionHandler(statusActionPending, handleReject)}
                    style={{ ...getActionButtonStyle({ variant: 'plain', tone: 'danger', flex: 1, disabled: statusActionPending }), textAlign: 'center' }}
                  >
                    <Text style={{ fontSize: '14px', color: colors.danger }}>{t('outfit_detail_reject')}</Text>
                  </View>
                </View>
              )}

              {currentOutfit.status === 'accepted' && !showFeedback && (
                <View ariaRole='button' ariaLabel={t('outfit_detail_rate_action')} onClick={() => setShowFeedback(true)} style={getActionButtonStyle()}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{t('outfit_detail_rate_action')}</Text>
                </View>
              )}

              {!showConfirmDelete ? (
                <View
                  ariaRole='button'
                  ariaLabel={t('outfit_detail_delete_action')}
                  onClick={getEnabledActionHandler(deletePending, () => setShowConfirmDelete(true))}
                  style={getActionButtonStyle({ tone: 'danger', disabled: deletePending })}
                >
                  <Text style={{ fontSize: '14px', color: colors.danger }}>{t('outfit_detail_delete_action')}</Text>
                </View>
              ) : (
                <View style={actionRowStyle}>
                  <View ariaRole='button' ariaLabel={t('outfit_detail_cancel')} onClick={() => setShowConfirmDelete(false)} style={getActionButtonStyle({ flex: 1 })}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{t('outfit_detail_cancel')}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={t('outfit_detail_delete_confirm')}
                    onClick={getEnabledActionHandler(deletePending, handleDelete)}
                    style={{ ...getActionButtonStyle({ variant: 'primary', flex: 1, disabled: deletePending }), backgroundColor: '#dc2626' }}
                  >
                    <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>{t('outfit_detail_delete_confirm')}</Text>
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
