import { Input, Picker, Switch, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { UIBadge } from '../../components/ui-badge'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
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

type ChannelOption = 'email' | 'webhook' | 'ntfy' | 'mattermost' | 'bark'
type WebhookPreset = 'generic' | 'telegram' | 'discord' | 'slack' | 'feishu' | 'wechat_work'
type WebhookMethod = 'POST' | 'PUT'
type WebhookContentType = 'application/json' | 'application/x-www-form-urlencoded'

const CHANNEL_OPTIONS: ChannelOption[] = ['email', 'webhook', 'ntfy', 'mattermost', 'bark']
const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const WEBHOOK_PRESETS: WebhookPreset[] = ['generic', 'telegram', 'discord', 'slack', 'feishu', 'wechat_work']
const WEBHOOK_METHODS: WebhookMethod[] = ['POST', 'PUT']
const WEBHOOK_CONTENT_TYPES: WebhookContentType[] = ['application/json', 'application/x-www-form-urlencoded']

function parseWebhookHeaders(value: string): Record<string, string> | undefined {
  const entries = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex <= 0) return null
      const key = line.slice(0, separatorIndex).trim()
      const headerValue = line.slice(separatorIndex + 1).trim()
      if (!key || !headerValue) return null
      return [key, headerValue] as const
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry))

  return entries.length ? Object.fromEntries(entries) : undefined
}

function getDefaultBarkServer(server?: string): string {
  return server || 'https://api.day.app'
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
  const { t, locale } = useI18n()
  const copy =
    locale === 'en'
      ? {
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          presetLabels: {
            generic: 'Generic',
            telegram: 'Telegram',
            discord: 'Discord',
            slack: 'Slack',
            feishu: 'Feishu',
            wechat_work: 'WeCom',
          } as Record<WebhookPreset, string>,
          channelDescriptions: {
            email: 'Send reminders and test messages by email',
            webhook: 'Connect a custom webhook or bot',
            ntfy: 'Push notifications through an ntfy topic',
            mattermost: 'Push notifications through a Mattermost webhook',
            bark: 'Push alerts to Bark iOS devices',
          } as Record<ChannelOption, string>,
          placeholders: {
            email: 'Enter email address',
            webhook: 'Enter webhook URL',
            ntfy: 'Enter ntfy topic',
            mattermost: 'Enter Mattermost webhook URL',
            bark: 'Enter Bark device key',
            default: 'Enter value',
            ntfyToken: 'Enter ntfy access token (optional)',
            barkServer: 'Enter Bark server URL (optional)',
            barkGroup: 'Enter Bark group (optional)',
            telegramChatId: 'Enter Telegram chat_id',
            headers: 'Headers (optional), one per line: Header-Name: value',
            template: 'Custom payload template (optional)',
          },
          barkKeyConfigured: 'device key configured',
          channelCreated: 'Channel created',
          scheduleCreated: 'Schedule created',
          createFailed: 'Create failed',
          enabledChannels: 'Enabled channels',
          channelsHint: (count: number) => `${count} total`,
          schedules: 'Schedules',
          historyHint: (count: number) => `${count} deliveries`,
          addChannelTitle: 'Add Channel',
          defaultServer: (server: string) => `Default server ${server}`,
          defaultPostJson: 'Default POST / JSON',
          incomingWebhook: 'Uses Incoming Webhook',
          presetLabel: (label: string) => `Preset: ${label}`,
          methodLabel: (method: string) => `Method: ${method}`,
          contentTypeLabel: (value: string) => `Content type: ${value}`,
          adding: 'Adding...',
          add: 'Add channel',
          channelsTitle: 'Channels',
          statusEnabled: 'Enabled',
          statusDisabled: 'Disabled',
          priority: (value: number) => `Priority ${value}`,
          test: 'Test',
          delete: 'Delete',
          channelsEmptyTitle: 'No notification channels yet',
          channelsEmptyDescription: 'Add an email, ntfy, Mattermost, Bark, or webhook channel first.',
          schedulesTitle: 'Reminder Schedules',
          timeLabel: (value: string) => `Time: ${value}`,
          notifyDayBefore: 'Notify one day earlier',
          notifyDayBeforeDescription: 'When enabled, a reminder is sent at the same time on the previous day.',
          creating: 'Creating...',
          createSchedule: 'Create schedule',
          scheduleEnabled: 'Enabled',
          scheduleDisabled: 'Disabled',
          badgeDayBefore: 'Day-before reminder',
          badgeSameDay: 'Same-day reminder',
          badgeEnabled: 'Enabled',
          badgeClosed: 'Disabled',
          disableSchedule: 'Disable schedule',
          enableSchedule: 'Enable schedule',
          switchSameDay: 'Switch to same day',
          switchDayBefore: 'Switch to day before',
          deleteSchedule: 'Delete schedule',
          historyTitle: 'Recent Deliveries',
          historyEmptyTitle: 'No delivery history yet',
          historyEmptyDescription: 'History will appear here after you send test notifications or real reminders.',
        }
      : {
          days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          presetLabels: {
            generic: '通用',
            telegram: 'Telegram',
            discord: 'Discord',
            slack: 'Slack',
            feishu: '飞书',
            wechat_work: '企业微信',
          } as Record<WebhookPreset, string>,
          channelDescriptions: {
            email: '向邮箱发送提醒和测试消息',
            webhook: '接入自定义 webhook 或机器人',
            ntfy: '通过 ntfy topic 推送通知',
            mattermost: '通过 Mattermost Webhook 推送通知',
            bark: '向 Bark iOS 设备推送提醒',
          } as Record<ChannelOption, string>,
          placeholders: {
            email: '输入邮箱地址',
            webhook: '输入 webhook URL',
            ntfy: '输入 ntfy topic',
            mattermost: '输入 Mattermost webhook URL',
            bark: '输入 Bark 设备密钥',
            default: '请输入',
            ntfyToken: '输入 ntfy access token（可选）',
            barkServer: '输入 Bark 服务地址（可选）',
            barkGroup: '输入 Bark 分组（可选）',
            telegramChatId: '输入 Telegram chat_id',
            headers: '请求头（可选），每行一个，格式：Header-Name: value',
            template: '自定义 payload 模板（可选）',
          },
          barkKeyConfigured: '已配置设备密钥',
          channelCreated: '通知渠道已创建',
          scheduleCreated: '提醒计划已创建',
          createFailed: '创建失败',
          enabledChannels: '已启用渠道',
          channelsHint: (count: number) => `共 ${count} 个渠道`,
          schedules: '提醒计划',
          historyHint: (count: number) => `历史 ${count} 条`,
          addChannelTitle: '新增渠道',
          defaultServer: (server: string) => `默认服务 ${server}`,
          defaultPostJson: '默认 POST / JSON',
          incomingWebhook: '使用 Incoming Webhook',
          presetLabel: (label: string) => `模板：${label}`,
          methodLabel: (method: string) => `方法：${method}`,
          contentTypeLabel: (value: string) => `内容类型：${value}`,
          adding: '添加中...',
          add: '添加渠道',
          channelsTitle: '通知渠道',
          statusEnabled: '已启用',
          statusDisabled: '已停用',
          priority: (value: number) => `优先级 ${value}`,
          test: '测试',
          delete: '删除',
          channelsEmptyTitle: '还没有通知渠道',
          channelsEmptyDescription: '先添加一个 email、ntfy、Mattermost、Bark 或 webhook 渠道。',
          schedulesTitle: '提醒计划',
          timeLabel: (value: string) => `时间：${value}`,
          notifyDayBefore: '提前一天提醒',
          notifyDayBeforeDescription: '开启后会在前一天同一时间发送',
          creating: '创建中...',
          createSchedule: '新增计划',
          scheduleEnabled: '启用',
          scheduleDisabled: '停用',
          badgeDayBefore: '提前一天提醒',
          badgeSameDay: '当天提醒',
          badgeEnabled: '启用中',
          badgeClosed: '已关闭',
          disableSchedule: '停用计划',
          enableSchedule: '启用计划',
          switchSameDay: '改为当天提醒',
          switchDayBefore: '改为提前一天',
          deleteSchedule: '删除计划',
          historyTitle: '最近投递',
          historyEmptyTitle: '还没有投递记录',
          historyEmptyDescription: '发送过测试通知或实际提醒后，这里会出现历史记录。',
        }
  const occasionOptions =
    locale === 'en'
      ? ['Casual', 'Office', 'Formal', 'Date', 'Sporty', 'Outdoor']
      : ['休闲', '办公', '正式', '约会', '运动', '户外']

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
    let config: Record<string, unknown>
    if (channel === 'email') {
      config = { address: channelTarget }
    } else if (channel === 'webhook') {
      const preset = WEBHOOK_PRESETS[webhookPresetIndex]
      config = {
        url: channelTarget,
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
        topic: channelTarget,
        server: ntfyDefaults?.server,
      }
      if (channelSecondary.trim()) {
        config.token = channelSecondary.trim()
      }
    } else if (channel === 'mattermost') {
      config = { webhook_url: channelTarget }
    } else {
      config = {
        device_key: channelTarget,
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
    try {
      await createScheduleMutation.mutateAsync({
        day_of_week: dayIndex,
        notification_time: notificationTime,
        occasion: OCCASIONS[occasionIndex],
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

      <SectionCard title={copy.addChannelTitle}>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker
            mode='selector'
            range={CHANNEL_OPTIONS}
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
          <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
            value={channelTarget}
            placeholder={getChannelPlaceholder(currentChannel)}
            onInput={(event) => setChannelTarget(event.detail.value)}
            style={inputStyle}
          />
          {currentChannel === 'ntfy' ? (
            <Input
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
                value={channelSecondary}
                placeholder={copy.placeholders.barkServer}
                onInput={(event) => setChannelSecondary(event.detail.value)}
                style={inputStyle}
              />
              <Input
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
                  value={webhookChatId}
                  placeholder={copy.placeholders.telegramChatId}
                  onInput={(event) => setWebhookChatId(event.detail.value)}
                  style={inputStyle}
                />
              ) : null}
              <Picker mode='selector' range={WEBHOOK_METHODS} value={webhookMethodIndex} onChange={(event) => setWebhookMethodIndex(Number(event.detail.value))}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{copy.methodLabel(WEBHOOK_METHODS[webhookMethodIndex])}</Text>
                </View>
              </Picker>
              <Picker mode='selector' range={WEBHOOK_CONTENT_TYPES} value={webhookContentTypeIndex} onChange={(event) => setWebhookContentTypeIndex(Number(event.detail.value))}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{copy.contentTypeLabel(WEBHOOK_CONTENT_TYPES[webhookContentTypeIndex])}</Text>
                </View>
              </Picker>
              <Textarea
                value={webhookHeadersText}
                placeholder={copy.placeholders.headers}
                onInput={(event) => setWebhookHeadersText(event.detail.value)}
                style={{ width: '100%', minHeight: '90px', padding: '12px 14px', borderRadius: '14px', border: `1px solid ${colors.border}`, backgroundColor: colors.surfaceMuted, color: colors.text, boxSizing: 'border-box', fontSize: '13px' }}
              />
              <Textarea
                value={webhookTemplate}
                placeholder={copy.placeholders.template}
                onInput={(event) => setWebhookTemplate(event.detail.value)}
                style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '14px', border: `1px solid ${colors.border}`, backgroundColor: colors.surfaceMuted, color: colors.text, boxSizing: 'border-box', fontSize: '13px' }}
              />
            </>
          ) : null}
          <View onClick={handleCreateSetting} style={{ ...primaryButtonStyle, opacity: !channelTarget.trim() || createSetting.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createSetting.isPending ? copy.adding : copy.add}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title={copy.channelsTitle}>
        {settings?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settings.map((setting) => (
              <View key={setting.id} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{formatNotificationChannelLabel(setting.channel)}</Text>
                    <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                      {getChannelSummary(setting)}
                    </Text>
                  </View>
                  <Switch
                    checked={setting.enabled}
                    onChange={(event) =>
                      updateSetting.mutate({
                        id: setting.id,
                        data: { enabled: event.detail.value },
                      })
                    }
                  />
                </View>
                <View style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <UIBadge label={setting.enabled ? copy.statusEnabled : copy.statusDisabled} tone={setting.enabled ? 'success' : 'default'} />
                  <UIBadge label={copy.priority(setting.priority)} />
                </View>
                <View style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <View onClick={() => testSetting.mutate(setting.id)} style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', opacity: testSetting.isPending ? 0.7 : 1 }}>
                    <Text style={{ fontSize: '12px', color: colors.text }}>{copy.test}</Text>
                  </View>
                  <View onClick={() => deleteSetting.mutate(setting.id)} style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)', opacity: deleteSetting.isPending ? 0.7 : 1 }}>
                    <Text style={{ fontSize: '12px', color: colors.danger }}>{copy.delete}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title={copy.channelsEmptyTitle} description={copy.channelsEmptyDescription} />
        )}
      </SectionCard>

      <SectionCard title={copy.schedulesTitle}>
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
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
            <View>
              <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{copy.notifyDayBefore}</Text>
              <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                {copy.notifyDayBeforeDescription}
              </Text>
            </View>
            <Switch checked={notifyDayBefore} onChange={(event) => setNotifyDayBefore(event.detail.value)} />
          </View>
          <View onClick={handleCreateSchedule} style={{ ...primaryButtonStyle, opacity: createScheduleMutation.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createScheduleMutation.isPending ? copy.creating : copy.createSchedule}</Text>
          </View>
        </View>
        {schedules?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {schedules.map((schedule) => (
              <View key={schedule.id} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>
                  {copy.days[schedule.day_of_week]} {schedule.notification_time}
                </Text>
                <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                  {formatOccasionLabel(schedule.occasion)} · {schedule.enabled ? copy.scheduleEnabled : copy.scheduleDisabled}
                </Text>
                <View style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <UIBadge label={schedule.notify_day_before ? copy.badgeDayBefore : copy.badgeSameDay} />
                  <UIBadge label={schedule.enabled ? copy.badgeEnabled : copy.badgeClosed} tone={schedule.enabled ? 'success' : 'default'} />
                </View>
                <View style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <View
                    onClick={() =>
                      updateSchedule.mutate({
                        id: schedule.id,
                        data: { enabled: !schedule.enabled },
                      })
                    }
                    style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', opacity: updateSchedule.isPending ? 0.7 : 1 }}
                  >
                    <Text style={{ fontSize: '12px', color: colors.text }}>{schedule.enabled ? copy.disableSchedule : copy.enableSchedule}</Text>
                  </View>
                  <View
                    onClick={() =>
                      updateSchedule.mutate({
                        id: schedule.id,
                        data: { notify_day_before: !schedule.notify_day_before },
                      })
                    }
                    style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', opacity: updateSchedule.isPending ? 0.7 : 1 }}
                  >
                    <Text style={{ fontSize: '12px', color: colors.text }}>
                      {schedule.notify_day_before ? copy.switchSameDay : copy.switchDayBefore}
                    </Text>
                  </View>
                  <View onClick={() => deleteScheduleMutation.mutate(schedule.id)} style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)', opacity: deleteScheduleMutation.isPending ? 0.7 : 1 }}>
                    <Text style={{ fontSize: '12px', color: colors.danger }}>{copy.deleteSchedule}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title={copy.historyTitle}>
        {history?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map((item) => (
              <View key={item.id} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{formatNotificationChannelLabel(item.channel)}</Text>
                <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                  {item.status} · {item.created_at}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title={copy.historyEmptyTitle} description={copy.historyEmptyDescription} />
        )}
      </SectionCard>
    </PageShell>
  )
}
