import { Input, Picker, Switch, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { actionWrapRowStyle, getActionButtonStyle, getEnabledActionHandler } from '../../components/action-style'
import { EmptyState } from '../../components/empty-state'
import { FlatList, FlatListRow } from '../../components/flat-data'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { UIBadge } from '../../components/ui-badge'
import { colors, inputStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useBarkDefaults,
  useCreateNotificationSetting,
  useCreateSchedule,
  useDeleteNotificationSetting,
  useDeleteSchedule,
  useNtfyDefaults,
  useNotificationHistory,
  useNotificationSettings,
  useSchedules,
  useTestNotificationSetting,
  useUpdateNotificationSetting,
  useUpdateSchedule,
} from '../../hooks/use-notifications'
import { formatNotificationChannelLabel, formatOccasionLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import {
  NOTIFICATION_CHANNEL_OPTIONS as CHANNEL_OPTIONS,
  WEBHOOK_CONTENT_TYPE_OPTIONS as WEBHOOK_CONTENT_TYPES,
  WEBHOOK_METHOD_OPTIONS as WEBHOOK_METHODS,
  WEBHOOK_PRESET_OPTIONS as WEBHOOK_PRESETS,
  getDefaultBarkServer,
  type NotificationChannelOption as ChannelOption,
  type WebhookPresetOption as WebhookPreset,
} from '../../lib/notification-options'
import { OCCASION_VALUES } from '../../lib/options'

type ParsedWebhookHeaders = {
  headers: Record<string, string> | undefined
  invalidLineNumbers: number[]
}

function parseWebhookHeaders(value: string): ParsedWebhookHeaders {
  const invalidLineNumbers: number[] = []
  const entries: Array<readonly [string, string]> = []

  value.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line) return

    const separatorIndex = line.indexOf(':')
    const key = separatorIndex > 0 ? line.slice(0, separatorIndex).trim() : ''
    const headerValue = separatorIndex > 0 ? line.slice(separatorIndex + 1).trim() : ''

    if (!key || !headerValue) {
      invalidLineNumbers.push(index + 1)
      return
    }
    entries.push([key, headerValue] as const)
  })

  return {
    headers: entries.length ? Object.fromEntries(entries) : undefined,
    invalidLineNumbers,
  }
}

export default function NotificationsPage() {
  const canRender = useAuthGuard()
  const { data: settings } = useNotificationSettings()
  const { data: schedules } = useSchedules()
  const { data: history } = useNotificationHistory(10)
  const { data: ntfyDefaults } = useNtfyDefaults()
  const { data: barkDefaults } = useBarkDefaults()
  const createSetting = useCreateNotificationSetting()
  const updateSetting = useUpdateNotificationSetting()
  const deleteSetting = useDeleteNotificationSetting()
  const updateSchedule = useUpdateSchedule()
  const testSetting = useTestNotificationSetting()
  const createScheduleMutation = useCreateSchedule()
  const deleteScheduleMutation = useDeleteSchedule()
  const [channelIndex, setChannelIndex] = useState(0)
  const [channelTarget, setChannelTarget] = useState('')
  const [channelSecondary, setChannelSecondary] = useState('')
  const [channelTertiary, setChannelTertiary] = useState('')
  const [webhookPresetIndex, setWebhookPresetIndex] = useState(0)
  const [webhookMethodIndex, setWebhookMethodIndex] = useState(0)
  const [webhookContentTypeIndex, setWebhookContentTypeIndex] = useState(0)
  const [webhookChatId, setWebhookChatId] = useState('')
  const [webhookHeadersText, setWebhookHeadersText] = useState('')
  const [webhookTemplate, setWebhookTemplate] = useState('')
  const [dayIndex, setDayIndex] = useState(0)
  const [occasionIndex, setOccasionIndex] = useState(0)
  const [notificationTime, setNotificationTime] = useState('08:00')
  const [notifyDayBefore, setNotifyDayBefore] = useState(false)
  const { t, tf } = useI18n()
  const copy = {
    days: [
      t('notifications_day_mon'),
      t('notifications_day_tue'),
      t('notifications_day_wed'),
      t('notifications_day_thu'),
      t('notifications_day_fri'),
      t('notifications_day_sat'),
      t('notifications_day_sun'),
    ],
    presetLabels: {
      generic: t('notifications_preset_generic'),
      telegram: 'Telegram',
      discord: 'Discord',
      slack: 'Slack',
      feishu: t('notifications_preset_feishu'),
      wechat_work: t('notifications_preset_wechat_work'),
    } as Record<WebhookPreset, string>,
    channelDescriptions: {
      email: t('notifications_channel_desc_email'),
      webhook: t('notifications_channel_desc_webhook'),
      ntfy: t('notifications_channel_desc_ntfy'),
      mattermost: t('notifications_channel_desc_mattermost'),
      bark: t('notifications_channel_desc_bark'),
    } as Record<ChannelOption, string>,
    placeholders: {
      email: t('notifications_placeholder_email'),
      webhook: t('notifications_placeholder_webhook'),
      ntfy: t('notifications_placeholder_ntfy'),
      mattermost: t('notifications_placeholder_mattermost'),
      bark: t('notifications_placeholder_bark'),
      default: t('notifications_placeholder_default'),
      ntfyToken: t('notifications_placeholder_ntfy_token'),
      barkServer: t('notifications_placeholder_bark_server'),
      barkGroup: t('notifications_placeholder_bark_group'),
      telegramChatId: t('notifications_placeholder_telegram_chat_id'),
      headers: t('notifications_placeholder_headers'),
      template: t('notifications_placeholder_template'),
    },
    barkKeyConfigured: t('notifications_bark_key_configured'),
    channelCreated: t('notifications_channel_created'),
    scheduleCreated: t('notifications_schedule_created'),
    createFailed: t('notifications_create_failed'),
    enabledChannels: t('notifications_enabled_channels'),
    channelsHint: (count: number) => tf('notifications_channels_hint', { count }),
    schedules: t('notifications_schedules'),
    historyHint: (count: number) => tf('notifications_history_hint', { count }),
    addChannelTitle: t('notifications_add_channel_title'),
    defaultServer: (server: string) => tf('notifications_default_server', { server }),
    defaultPostJson: t('notifications_default_post_json'),
    incomingWebhook: t('notifications_incoming_webhook'),
    presetLabel: (label: string) => tf('notifications_preset_label', { label }),
    methodLabel: (method: string) => tf('notifications_method_label', { method }),
    contentTypeLabel: (value: string) => tf('notifications_content_type_label', { value }),
    adding: t('notifications_adding'),
    add: t('notifications_add'),
    channelsTitle: t('notifications_channels_title'),
    statusEnabled: t('notifications_status_enabled'),
    statusDisabled: t('notifications_status_disabled'),
    priority: (value: number) => tf('notifications_priority', { value }),
    test: t('notifications_test'),
    delete: t('notifications_delete'),
    channelsEmptyTitle: t('notifications_channels_empty_title'),
    channelsEmptyDescription: t('notifications_channels_empty_description'),
    schedulesTitle: t('notifications_schedules_title'),
    timeLabel: (value: string) => tf('notifications_time_label', { value }),
    notifyDayBefore: t('notifications_notify_day_before'),
    notifyDayBeforeDescription: t('notifications_notify_day_before_description'),
    creating: t('notifications_creating'),
    createSchedule: t('notifications_create_schedule'),
    scheduleEnabled: t('notifications_schedule_enabled'),
    scheduleDisabled: t('notifications_schedule_disabled'),
    badgeDayBefore: t('notifications_badge_day_before'),
    badgeSameDay: t('notifications_badge_same_day'),
    badgeEnabled: t('notifications_badge_enabled'),
    badgeClosed: t('notifications_badge_closed'),
    disableSchedule: t('notifications_disable_schedule'),
    enableSchedule: t('notifications_enable_schedule'),
    switchSameDay: t('notifications_switch_same_day'),
    switchDayBefore: t('notifications_switch_day_before'),
    deleteSchedule: t('notifications_delete_schedule'),
    historyTitle: t('notifications_history_title'),
    historyEmptyTitle: t('notifications_history_empty_title'),
    historyEmptyDescription: t('notifications_history_empty_description'),
  }
  const occasionOptions = OCCASION_VALUES.map((value) => formatOccasionLabel(value))

  const getChannelPlaceholder = (channel: ChannelOption) => copy.placeholders[channel] ?? copy.placeholders.default
  const getChannelSummary = (setting: { channel: string; config: Record<string, unknown> }) => {
    switch (setting.channel) {
      case 'email':
        return String(setting.config.address ?? '-')
      case 'ntfy':
        return `${String(setting.config.server ?? ntfyDefaults?.server ?? '')} / ${String(setting.config.topic ?? '')}`
      case 'mattermost':
        return String(setting.config.webhook_url ?? '-')
      case 'bark': {
        const deviceKey = String(setting.config.device_key ?? '')
        const masked = deviceKey.length >= 4 ? `***${deviceKey.slice(-4)}` : copy.barkKeyConfigured
        return `${String(setting.config.server ?? barkDefaults?.server ?? '')} / ${masked}`
      }
      case 'webhook':
        return String(setting.config.url ?? '-')
      default:
        return '-'
    }
  }

  if (!canRender) {
    return null
  }

  const currentChannel = CHANNEL_OPTIONS[channelIndex]

  const resetChannelForm = (channel: ChannelOption) => {
    setChannelTarget('')
    setChannelSecondary(channel === 'bark' ? getDefaultBarkServer(barkDefaults?.server) : '')
    setChannelTertiary(channel === 'bark' ? 'Wardrowbe' : '')
    setWebhookPresetIndex(0)
    setWebhookMethodIndex(0)
    setWebhookContentTypeIndex(0)
    setWebhookChatId('')
    setWebhookHeadersText('')
    setWebhookTemplate('')
  }

  const handleCreateSetting = async () => {
    const channel = CHANNEL_OPTIONS[channelIndex]
    const target = channelTarget.trim()
    if (!target || createSetting.isPending) {
      return
    }
    let config: Record<string, unknown>
    if (channel === 'email') {
      config = { address: target }
    } else if (channel === 'webhook') {
      const preset = WEBHOOK_PRESETS[webhookPresetIndex]
      config = {
        url: target,
        preset,
        method: WEBHOOK_METHODS[webhookMethodIndex],
        content_type: WEBHOOK_CONTENT_TYPES[webhookContentTypeIndex],
      }
      if (preset === 'telegram' && webhookChatId.trim()) {
        config.chat_id = webhookChatId.trim()
      }
      const headers = parseWebhookHeaders(webhookHeadersText)
      if (headers) {
        config.headers = headers
      }
      if (webhookTemplate.trim()) {
        config.template = webhookTemplate.trim()
      }
    } else if (channel === 'ntfy') {
      config = {
        topic: target,
        server: ntfyDefaults?.server,
      }
      if (channelSecondary.trim()) {
        config.token = channelSecondary.trim()
      }
    } else if (channel === 'mattermost') {
      config = { webhook_url: target }
    } else {
      config = {
        device_key: target,
        server: channelSecondary.trim() || getDefaultBarkServer(barkDefaults?.server),
        group: channelTertiary.trim() || 'Wardrowbe',
      }
    }

    try {
      await createSetting.mutateAsync({
        channel,
        enabled: true,
        priority: 1,
        config,
      })
      resetChannelForm(channel)
      void Taro.showToast({ title: copy.channelCreated, icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.createFailed
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleCreateSchedule = async () => {
    if (createScheduleMutation.isPending) {
      return
    }

    try {
      await createScheduleMutation.mutateAsync({
        day_of_week: dayIndex,
        notification_time: notificationTime,
        occasion: OCCASION_VALUES[occasionIndex],
        enabled: true,
        notify_day_before: notifyDayBefore,
      })
      setNotifyDayBefore(false)
      void Taro.showToast({ title: copy.scheduleCreated, icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.createFailed
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title={t('page_notifications_title')} subtitle={t('page_notifications_subtitle')} navKey='settings'>
      <View style={{ display: 'flex', gap: '12px' }}>
        <StatCard
          label={copy.enabledChannels}
          value={String(settings?.filter((setting) => setting.enabled).length ?? 0)}
          hint={copy.channelsHint(settings?.length ?? 0)}
        />
        <StatCard
          label={copy.schedules}
          value={String(schedules?.filter((schedule) => schedule.enabled).length ?? 0)}
          hint={copy.historyHint(history?.length ?? 0)}
        />
      </View>

      <SectionCard compact title={copy.addChannelTitle}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker
            mode='selector'
            range={[...CHANNEL_OPTIONS]}
            value={channelIndex}
            onChange={(event) => {
              const nextIndex = Number(event.detail.value)
              setChannelIndex(nextIndex)
              resetChannelForm(CHANNEL_OPTIONS[nextIndex])
            }}
          >
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{formatNotificationChannelLabel(currentChannel)}</Text>
            </View>
          </Picker>
          <View style={actionWrapRowStyle}>
            <UIBadge label={formatNotificationChannelLabel(currentChannel)} />
            <UIBadge label={copy.channelDescriptions[currentChannel]} />
            {currentChannel === 'ntfy' && ntfyDefaults?.server ? (
              <UIBadge label={copy.defaultServer(ntfyDefaults.server)} tone='success' />
            ) : null}
            {currentChannel === 'bark' && barkDefaults?.server ? (
              <UIBadge label={copy.defaultServer(barkDefaults.server)} tone='success' />
            ) : null}
            {currentChannel === 'webhook' ? (
              <UIBadge label={copy.defaultPostJson} tone='warning' />
            ) : null}
            {currentChannel === 'mattermost' ? (
              <UIBadge label={copy.incomingWebhook} tone='warning' />
            ) : null}
          </View>
          <Input
            key={`target-${currentChannel}`}
            ariaLabel={getChannelPlaceholder(currentChannel)}
            value={channelTarget}
            placeholder={getChannelPlaceholder(currentChannel)}
            onInput={(event) => setChannelTarget(event.detail.value)}
            style={inputStyle}
          />
          {currentChannel === 'ntfy' ? (
            <Input
              key='ntfy-token'
              ariaLabel={copy.placeholders.ntfyToken}
              value={channelSecondary}
              placeholder={copy.placeholders.ntfyToken}
              password
              onInput={(event) => setChannelSecondary(event.detail.value)}
              style={inputStyle}
            />
          ) : null}
          {currentChannel === 'bark' ? (
            <>
              <Input
                key='bark-server'
                ariaLabel={copy.placeholders.barkServer}
                value={channelSecondary}
                placeholder={copy.placeholders.barkServer}
                onInput={(event) => setChannelSecondary(event.detail.value)}
                style={inputStyle}
              />
              <Input
                key='bark-group'
                ariaLabel={copy.placeholders.barkGroup}
                value={channelTertiary}
                placeholder={copy.placeholders.barkGroup}
                onInput={(event) => setChannelTertiary(event.detail.value)}
                style={inputStyle}
              />
            </>
          ) : null}
          {currentChannel === 'webhook' ? (
            <>
              <Picker mode='selector' range={WEBHOOK_PRESETS.map((preset) => copy.presetLabels[preset])} value={webhookPresetIndex} onChange={(event) => setWebhookPresetIndex(Number(event.detail.value))}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{copy.presetLabel(copy.presetLabels[WEBHOOK_PRESETS[webhookPresetIndex]])}</Text>
                </View>
              </Picker>
              {WEBHOOK_PRESETS[webhookPresetIndex] === 'telegram' ? (
                <Input
                  key='telegram-chat-id'
                  ariaLabel={copy.placeholders.telegramChatId}
                  value={webhookChatId}
                  placeholder={copy.placeholders.telegramChatId}
                  onInput={(event) => setWebhookChatId(event.detail.value)}
                  style={inputStyle}
                />
              ) : null}
              <Picker mode='selector' range={[...WEBHOOK_METHODS]} value={webhookMethodIndex} onChange={(event) => setWebhookMethodIndex(Number(event.detail.value))}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{copy.methodLabel(WEBHOOK_METHODS[webhookMethodIndex])}</Text>
                </View>
              </Picker>
              <Picker mode='selector' range={[...WEBHOOK_CONTENT_TYPES]} value={webhookContentTypeIndex} onChange={(event) => setWebhookContentTypeIndex(Number(event.detail.value))}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{copy.contentTypeLabel(WEBHOOK_CONTENT_TYPES[webhookContentTypeIndex])}</Text>
                </View>
              </Picker>
              <Textarea
                ariaLabel={copy.placeholders.headers}
                value={webhookHeadersText}
                placeholder={copy.placeholders.headers}
                onInput={(event) => setWebhookHeadersText(event.detail.value)}
                style={{ width: '100%', minHeight: '90px', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.text, boxSizing: 'border-box', fontSize: '13px' }}
              />
              <Textarea
                ariaLabel={copy.placeholders.template}
                value={webhookTemplate}
                placeholder={copy.placeholders.template}
                onInput={(event) => setWebhookTemplate(event.detail.value)}
                style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.text, boxSizing: 'border-box', fontSize: '13px' }}
              />
            </>
          ) : null}
          <View
            ariaRole='button'
            ariaLabel={copy.add}
            onClick={getEnabledActionHandler(!channelTarget.trim() || createSetting.isPending, handleCreateSetting)}
            style={getActionButtonStyle({ variant: 'primary', disabled: !channelTarget.trim() || createSetting.isPending })}
          >
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createSetting.isPending ? copy.adding : copy.add}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard compact title={copy.channelsTitle}>
        {settings?.length ? (
          <FlatList>
            {settings.map((setting) => (
              <FlatListRow key={setting.id}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{formatNotificationChannelLabel(setting.channel)}</Text>
                    <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                      {getChannelSummary(setting)}
                    </Text>
                  </View>
                  <Switch
                    checked={setting.enabled}
                    disabled={updateSetting.isPending}
                    onChange={(event) => {
                      if (updateSetting.isPending) return
                      updateSetting.mutate({
                        id: setting.id,
                        data: { enabled: event.detail.value },
                      })
                    }}
                  />
                </View>
                <View style={{ ...actionWrapRowStyle, marginTop: '10px' }}>
                  <UIBadge label={setting.enabled ? copy.statusEnabled : copy.statusDisabled} tone={setting.enabled ? 'success' : 'default'} />
                  <UIBadge label={copy.priority(setting.priority)} />
                </View>
                <View style={{ ...actionWrapRowStyle, gap: '12px', marginTop: '10px' }}>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.test}
                    onClick={getEnabledActionHandler(testSetting.isPending, () => testSetting.mutate(setting.id))}
                    style={getActionButtonStyle({ compact: true, disabled: testSetting.isPending })}
                  >
                    <Text style={{ fontSize: '12px', color: colors.text }}>{copy.test}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.delete}
                    onClick={getEnabledActionHandler(deleteSetting.isPending, () => deleteSetting.mutate(setting.id))}
                    style={getActionButtonStyle({ compact: true, tone: 'danger', disabled: deleteSetting.isPending })}
                  >
                    <Text style={{ fontSize: '12px', color: colors.danger }}>{copy.delete}</Text>
                  </View>
                </View>
              </FlatListRow>
            ))}
          </FlatList>
        ) : (
          <EmptyState title={copy.channelsEmptyTitle} description={copy.channelsEmptyDescription} />
        )}
      </SectionCard>

      <SectionCard compact title={copy.schedulesTitle}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          <Picker mode='selector' range={copy.days} value={dayIndex} onChange={(event) => setDayIndex(Number(event.detail.value))}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{copy.days[dayIndex]}</Text>
            </View>
          </Picker>
          <Picker mode='time' value={notificationTime} onChange={(event) => setNotificationTime(event.detail.value)}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{copy.timeLabel(notificationTime)}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={occasionOptions} value={occasionIndex} onChange={(event) => setOccasionIndex(Number(event.detail.value))}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{occasionOptions[occasionIndex]}</Text>
            </View>
          </Picker>
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
            <View>
              <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{copy.notifyDayBefore}</Text>
              <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                {copy.notifyDayBeforeDescription}
              </Text>
            </View>
            <Switch checked={notifyDayBefore} onChange={(event) => setNotifyDayBefore(event.detail.value)} />
          </View>
          <View
            ariaRole='button'
            ariaLabel={copy.createSchedule}
            onClick={getEnabledActionHandler(createScheduleMutation.isPending, handleCreateSchedule)}
            style={getActionButtonStyle({ variant: 'primary', disabled: createScheduleMutation.isPending })}
          >
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createScheduleMutation.isPending ? copy.creating : copy.createSchedule}</Text>
          </View>
        </View>
        {schedules?.length ? (
          <FlatList>
            {schedules.map((schedule) => (
              <FlatListRow key={schedule.id}>
                <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>
                  {copy.days[schedule.day_of_week]} {schedule.notification_time}
                </Text>
                <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                  {formatOccasionLabel(schedule.occasion)} · {schedule.enabled ? copy.scheduleEnabled : copy.scheduleDisabled}
                </Text>
                <View style={{ ...actionWrapRowStyle, marginTop: '10px' }}>
                  <UIBadge label={schedule.notify_day_before ? copy.badgeDayBefore : copy.badgeSameDay} />
                  <UIBadge label={schedule.enabled ? copy.badgeEnabled : copy.badgeClosed} tone={schedule.enabled ? 'success' : 'default'} />
                </View>
                <View style={{ ...actionWrapRowStyle, gap: '12px', marginTop: '10px' }}>
                  <View
                    ariaRole='button'
                    ariaLabel={schedule.enabled ? copy.disableSchedule : copy.enableSchedule}
                    onClick={getEnabledActionHandler(updateSchedule.isPending, () =>
                      updateSchedule.mutate({
                        id: schedule.id,
                        data: { enabled: !schedule.enabled },
                      })
                    )}
                    style={getActionButtonStyle({ compact: true, disabled: updateSchedule.isPending })}
                  >
                    <Text style={{ fontSize: '12px', color: colors.text }}>{schedule.enabled ? copy.disableSchedule : copy.enableSchedule}</Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={schedule.notify_day_before ? copy.switchSameDay : copy.switchDayBefore}
                    onClick={getEnabledActionHandler(updateSchedule.isPending, () =>
                      updateSchedule.mutate({
                        id: schedule.id,
                        data: { notify_day_before: !schedule.notify_day_before },
                      })
                    )}
                    style={getActionButtonStyle({ compact: true, disabled: updateSchedule.isPending })}
                  >
                    <Text style={{ fontSize: '12px', color: colors.text }}>
                      {schedule.notify_day_before ? copy.switchSameDay : copy.switchDayBefore}
                    </Text>
                  </View>
                  <View
                    ariaRole='button'
                    ariaLabel={copy.deleteSchedule}
                    onClick={getEnabledActionHandler(deleteScheduleMutation.isPending, () => deleteScheduleMutation.mutate(schedule.id))}
                    style={getActionButtonStyle({ compact: true, tone: 'danger', disabled: deleteScheduleMutation.isPending })}
                  >
                    <Text style={{ fontSize: '12px', color: colors.danger }}>{copy.deleteSchedule}</Text>
                  </View>
                </View>
              </FlatListRow>
            ))}
          </FlatList>
        ) : null}
      </SectionCard>

      <SectionCard compact title={copy.historyTitle}>
        {history?.length ? (
          <FlatList>
            {history.map((item) => (
              <FlatListRow key={item.id}>
                <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{formatNotificationChannelLabel(item.channel)}</Text>
                <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                  {item.status} · {item.created_at}
                </Text>
              </FlatListRow>
            ))}
          </FlatList>
        ) : (
          <EmptyState title={copy.historyEmptyTitle} description={copy.historyEmptyDescription} />
        )}
      </SectionCard>
    </PageShell>
  )
}
