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

type ChannelOption = 'email' | 'webhook' | 'ntfy' | 'mattermost' | 'bark'
type WebhookPreset = 'generic' | 'telegram' | 'discord' | 'slack' | 'feishu' | 'wechat_work'
type WebhookMethod = 'POST' | 'PUT'
type WebhookContentType = 'application/json' | 'application/x-www-form-urlencoded'

const CHANNEL_OPTIONS: ChannelOption[] = ['email', 'webhook', 'ntfy', 'mattermost', 'bark']
const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const WEBHOOK_PRESETS: WebhookPreset[] = ['generic', 'telegram', 'discord', 'slack', 'feishu', 'wechat_work']
const WEBHOOK_PRESET_LABELS: Record<WebhookPreset, string> = {
  generic: '通用',
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
  feishu: '飞书',
  wechat_work: '企业微信',
}
const WEBHOOK_METHODS: WebhookMethod[] = ['POST', 'PUT']
const WEBHOOK_CONTENT_TYPES: WebhookContentType[] = ['application/json', 'application/x-www-form-urlencoded']
const CHANNEL_DESCRIPTIONS: Record<string, string> = {
  email: '向邮箱发送提醒和测试消息',
  webhook: '接入自定义 webhook 或机器人',
  ntfy: '通过 ntfy topic 推送通知',
  mattermost: '通过 Mattermost Webhook 推送通知',
  bark: '向 Bark iOS 设备推送提醒',
}

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

function getChannelPlaceholder(channel: ChannelOption) {
  switch (channel) {
    case 'email':
      return '输入邮箱地址'
    case 'webhook':
      return '输入 webhook URL'
    case 'ntfy':
      return '输入 ntfy topic'
    case 'mattermost':
      return '输入 Mattermost webhook URL'
    case 'bark':
      return '输入 Bark 设备密钥'
    default:
      return '请输入'
  }
}

function getDefaultBarkServer(server?: string): string {
  return server || 'https://api.day.app'
}

function getChannelSummary(setting: {
  channel: string
  config: Record<string, unknown>
}, ntfyServer?: string, barkServer?: string) {
  switch (setting.channel) {
    case 'email':
      return String(setting.config.address ?? '-')
    case 'ntfy':
      return `${String(setting.config.server ?? ntfyServer ?? '')} / ${String(setting.config.topic ?? '')}`
    case 'mattermost':
      return String(setting.config.webhook_url ?? '-')
    case 'bark': {
      const deviceKey = String(setting.config.device_key ?? '')
      const masked = deviceKey.length >= 4 ? `***${deviceKey.slice(-4)}` : '已配置设备密钥'
      return `${String(setting.config.server ?? barkServer ?? '')} / ${masked}`
    }
    case 'webhook':
      return String(setting.config.url ?? '-')
    default:
      return '-'
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
      void Taro.showToast({ title: '通知渠道已创建', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
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
      void Taro.showToast({ title: '提醒计划已创建', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='通知' subtitle='管理通知渠道和提醒计划' navKey='settings'>
      <View style={{ display: 'flex', gap: '12px' }}>
        <StatCard
          label='已启用渠道'
          value={String(settings?.filter((setting) => setting.enabled).length ?? 0)}
          hint={`共 ${settings?.length ?? 0} 个渠道`}
        />
        <StatCard
          label='提醒计划'
          value={String(schedules?.filter((schedule) => schedule.enabled).length ?? 0)}
          hint={`历史 ${history?.length ?? 0} 条`}
        />
      </View>

      <SectionCard title='新增渠道'>
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
            <UIBadge label={CHANNEL_DESCRIPTIONS[currentChannel]} />
            {currentChannel === 'ntfy' && ntfyDefaults?.server ? (
              <UIBadge label={`默认服务 ${ntfyDefaults.server}`} tone='success' />
            ) : null}
            {currentChannel === 'bark' && barkDefaults?.server ? (
              <UIBadge label={`默认服务 ${barkDefaults.server}`} tone='success' />
            ) : null}
            {currentChannel === 'webhook' ? (
              <UIBadge label='默认 POST / JSON' tone='warning' />
            ) : null}
            {currentChannel === 'mattermost' ? (
              <UIBadge label='使用 Incoming Webhook' tone='warning' />
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
              placeholder='输入 ntfy access token（可选）'
              password
              onInput={(event) => setChannelSecondary(event.detail.value)}
              style={inputStyle}
            />
          ) : null}
          {currentChannel === 'bark' ? (
            <>
              <Input
                value={channelSecondary}
                placeholder='输入 Bark 服务地址（可选）'
                onInput={(event) => setChannelSecondary(event.detail.value)}
                style={inputStyle}
              />
              <Input
                value={channelTertiary}
                placeholder='输入 Bark 分组（可选）'
                onInput={(event) => setChannelTertiary(event.detail.value)}
                style={inputStyle}
              />
            </>
          ) : null}
          {currentChannel === 'webhook' ? (
            <>
              <Picker mode='selector' range={WEBHOOK_PRESETS.map((preset) => WEBHOOK_PRESET_LABELS[preset])} value={webhookPresetIndex} onChange={(event) => setWebhookPresetIndex(Number(event.detail.value))}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>模板：{WEBHOOK_PRESET_LABELS[WEBHOOK_PRESETS[webhookPresetIndex]]}</Text>
                </View>
              </Picker>
              {WEBHOOK_PRESETS[webhookPresetIndex] === 'telegram' ? (
                <Input
                  value={webhookChatId}
                  placeholder='输入 Telegram chat_id'
                  onInput={(event) => setWebhookChatId(event.detail.value)}
                  style={inputStyle}
                />
              ) : null}
              <Picker mode='selector' range={WEBHOOK_METHODS} value={webhookMethodIndex} onChange={(event) => setWebhookMethodIndex(Number(event.detail.value))}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>方法：{WEBHOOK_METHODS[webhookMethodIndex]}</Text>
                </View>
              </Picker>
              <Picker mode='selector' range={WEBHOOK_CONTENT_TYPES} value={webhookContentTypeIndex} onChange={(event) => setWebhookContentTypeIndex(Number(event.detail.value))}>
                <View style={inputStyle}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>内容类型：{WEBHOOK_CONTENT_TYPES[webhookContentTypeIndex]}</Text>
                </View>
              </Picker>
              <Textarea
                value={webhookHeadersText}
                placeholder={'请求头（可选），每行一个，格式：Header-Name: value'}
                onInput={(event) => setWebhookHeadersText(event.detail.value)}
                style={{ width: '100%', minHeight: '90px', padding: '12px 14px', borderRadius: '14px', border: `1px solid ${colors.border}`, backgroundColor: colors.surfaceMuted, color: colors.text, boxSizing: 'border-box', fontSize: '13px' }}
              />
              <Textarea
                value={webhookTemplate}
                placeholder='自定义 payload 模板（可选）'
                onInput={(event) => setWebhookTemplate(event.detail.value)}
                style={{ width: '100%', minHeight: '110px', padding: '12px 14px', borderRadius: '14px', border: `1px solid ${colors.border}`, backgroundColor: colors.surfaceMuted, color: colors.text, boxSizing: 'border-box', fontSize: '13px' }}
              />
            </>
          ) : null}
          <View onClick={handleCreateSetting} style={{ ...primaryButtonStyle, opacity: !channelTarget.trim() || createSetting.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createSetting.isPending ? '添加中...' : '添加渠道'}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title='通知渠道'>
        {settings?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settings.map((setting) => (
              <View key={setting.id} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{formatNotificationChannelLabel(setting.channel)}</Text>
                    <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                      {getChannelSummary(setting, ntfyDefaults?.server, barkDefaults?.server)}
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
                  <UIBadge label={setting.enabled ? '已启用' : '已停用'} tone={setting.enabled ? 'success' : 'default'} />
                  <UIBadge label={`优先级 ${setting.priority}`} />
                </View>
                <View style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <View onClick={() => testSetting.mutate(setting.id)} style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', opacity: testSetting.isPending ? 0.7 : 1 }}>
                    <Text style={{ fontSize: '12px', color: colors.text }}>测试</Text>
                  </View>
                  <View onClick={() => deleteSetting.mutate(setting.id)} style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)', opacity: deleteSetting.isPending ? 0.7 : 1 }}>
                    <Text style={{ fontSize: '12px', color: colors.danger }}>删除</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title='还没有通知渠道' description='先添加一个 email、ntfy、Mattermost、Bark 或 webhook 渠道。' />
        )}
      </SectionCard>

      <SectionCard title='提醒计划'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          <Picker mode='selector' range={DAYS} value={dayIndex} onChange={(event) => setDayIndex(Number(event.detail.value))}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{DAYS[dayIndex]}</Text>
            </View>
          </Picker>
          <Picker mode='time' value={notificationTime} onChange={(event) => setNotificationTime(event.detail.value)}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>时间：{notificationTime}</Text>
            </View>
          </Picker>
          <Picker mode='selector' range={OCCASIONS} value={occasionIndex} onChange={(event) => setOccasionIndex(Number(event.detail.value))}>
            <View style={inputStyle}>
              <Text style={{ fontSize: '14px', color: colors.text }}>{formatOccasionLabel(OCCASIONS[occasionIndex])}</Text>
            </View>
          </Picker>
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
            <View>
              <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>提前一天提醒</Text>
              <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                开启后会在前一天同一时间发送
              </Text>
            </View>
            <Switch checked={notifyDayBefore} onChange={(event) => setNotifyDayBefore(event.detail.value)} />
          </View>
          <View onClick={handleCreateSchedule} style={{ ...primaryButtonStyle, opacity: createScheduleMutation.isPending ? 0.7 : 1 }}>
            <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createScheduleMutation.isPending ? '创建中...' : '新增计划'}</Text>
          </View>
        </View>
        {schedules?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {schedules.map((schedule) => (
              <View key={schedule.id} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: colors.surfaceMuted }}>
                <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>
                  {DAYS[schedule.day_of_week]} {schedule.notification_time}
                </Text>
                <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                  {formatOccasionLabel(schedule.occasion)} · {schedule.enabled ? '启用' : '停用'}
                </Text>
                <View style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <UIBadge label={schedule.notify_day_before ? '提前一天提醒' : '当天提醒'} />
                  <UIBadge label={schedule.enabled ? '启用中' : '已关闭'} tone={schedule.enabled ? 'success' : 'default'} />
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
                    <Text style={{ fontSize: '12px', color: colors.text }}>{schedule.enabled ? '停用计划' : '启用计划'}</Text>
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
                      {schedule.notify_day_before ? '改为当天提醒' : '改为提前一天'}
                    </Text>
                  </View>
                  <View onClick={() => deleteScheduleMutation.mutate(schedule.id)} style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)', opacity: deleteScheduleMutation.isPending ? 0.7 : 1 }}>
                    <Text style={{ fontSize: '12px', color: colors.danger }}>删除计划</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title='最近投递'>
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
          <EmptyState title='还没有投递记录' description='发送过测试通知或实际提醒后，这里会出现历史记录。' />
        )}
      </SectionCard>
    </PageShell>
  )
}
