import { Button, Input, Picker, Switch, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useCreateNotificationSetting,
  useCreateSchedule,
  useDeleteNotificationSetting,
  useDeleteSchedule,
  useNotificationHistory,
  useNotificationSettings,
  useSchedules,
  useTestNotificationSetting,
  useUpdateNotificationSetting,
} from '../../hooks/use-notifications'

const CHANNEL_OPTIONS = ['email', 'webhook', 'ntfy']
const OCCASIONS = ['casual', 'office', 'formal', 'date', 'sporty', 'outdoor']
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export default function NotificationsPage() {
  const canRender = useAuthGuard()
  const { data: settings } = useNotificationSettings()
  const { data: schedules } = useSchedules()
  const { data: history } = useNotificationHistory(10)
  const createSetting = useCreateNotificationSetting()
  const updateSetting = useUpdateNotificationSetting()
  const deleteSetting = useDeleteNotificationSetting()
  const testSetting = useTestNotificationSetting()
  const createScheduleMutation = useCreateSchedule()
  const deleteScheduleMutation = useDeleteSchedule()
  const [channelIndex, setChannelIndex] = useState(0)
  const [channelTarget, setChannelTarget] = useState('')
  const [dayIndex, setDayIndex] = useState(0)
  const [occasionIndex, setOccasionIndex] = useState(0)
  const [notificationTime, setNotificationTime] = useState('08:00')

  if (!canRender) {
    return null
  }

  const handleCreateSetting = async () => {
    const channel = CHANNEL_OPTIONS[channelIndex] as 'email' | 'webhook' | 'ntfy'
    let config: Record<string, unknown>
    if (channel === 'email') {
      config = { address: channelTarget }
    } else if (channel === 'webhook') {
      config = { url: channelTarget, preset: 'generic', method: 'POST', content_type: 'application/json' }
    } else {
      config = { topic: channelTarget }
    }

    try {
      await createSetting.mutateAsync({
        channel,
        enabled: true,
        priority: 1,
        config,
      })
      setChannelTarget('')
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
      })
      void Taro.showToast({ title: '提醒计划已创建', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='通知' subtitle='管理通知渠道、提醒计划和最近投递记录。'>
      <SectionCard title='新增渠道'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Picker mode='selector' range={CHANNEL_OPTIONS} value={channelIndex} onChange={(event) => setChannelIndex(Number(event.detail.value))}>
            <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Text style={{ fontSize: '22px', color: '#111827' }}>{CHANNEL_OPTIONS[channelIndex]}</Text>
            </View>
          </Picker>
          <Input
            value={channelTarget}
            placeholder={CHANNEL_OPTIONS[channelIndex] === 'email' ? '输入邮箱地址' : '输入 topic 或 URL'}
            onInput={(event) => setChannelTarget(event.detail.value)}
            style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', boxSizing: 'border-box' }}
          />
          <Button onClick={handleCreateSetting} loading={createSetting.isPending} disabled={!channelTarget.trim()}>
            添加渠道
          </Button>
        </View>
      </SectionCard>

      <SectionCard title='通知渠道'>
        {settings?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settings.map((setting) => (
              <View key={setting.id} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC' }}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ display: 'block', fontSize: '22px', color: '#111827' }}>{setting.channel}</Text>
                    <Text style={{ display: 'block', marginTop: '4px', fontSize: '20px', color: '#6B7280' }}>
                      {JSON.stringify(setting.config)}
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
                <View style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <Button size='mini' onClick={() => testSetting.mutate(setting.id)} loading={testSetting.isPending}>测试</Button>
                  <Button size='mini' onClick={() => deleteSetting.mutate(setting.id)} loading={deleteSetting.isPending}>删除</Button>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title='还没有通知渠道' description='先添加一个 email、ntfy 或 webhook 渠道。' />
        )}
      </SectionCard>

      <SectionCard title='提醒计划'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          <Picker mode='selector' range={DAYS} value={dayIndex} onChange={(event) => setDayIndex(Number(event.detail.value))}>
            <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Text style={{ fontSize: '22px', color: '#111827' }}>{DAYS[dayIndex]}</Text>
            </View>
          </Picker>
          <Input
            value={notificationTime}
            placeholder='08:00'
            onInput={(event) => setNotificationTime(event.detail.value)}
            style={{ width: '100%', height: '44px', padding: '0 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', boxSizing: 'border-box' }}
          />
          <Picker mode='selector' range={OCCASIONS} value={occasionIndex} onChange={(event) => setOccasionIndex(Number(event.detail.value))}>
            <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <Text style={{ fontSize: '22px', color: '#111827' }}>{OCCASIONS[occasionIndex]}</Text>
            </View>
          </Picker>
          <Button onClick={handleCreateSchedule} loading={createScheduleMutation.isPending}>新增计划</Button>
        </View>
        {schedules?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {schedules.map((schedule) => (
              <View key={schedule.id} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC' }}>
                <Text style={{ display: 'block', fontSize: '22px', color: '#111827' }}>
                  {DAYS[schedule.day_of_week]} {schedule.notification_time}
                </Text>
                <Text style={{ display: 'block', marginTop: '4px', fontSize: '20px', color: '#6B7280' }}>
                  {schedule.occasion} · {schedule.enabled ? '启用' : '停用'}
                </Text>
                <View style={{ marginTop: '10px' }}>
                  <Button size='mini' onClick={() => deleteScheduleMutation.mutate(schedule.id)} loading={deleteScheduleMutation.isPending}>
                    删除计划
                  </Button>
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
              <View key={item.id} style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC' }}>
                <Text style={{ display: 'block', fontSize: '22px', color: '#111827' }}>{item.channel}</Text>
                <Text style={{ display: 'block', marginTop: '4px', fontSize: '20px', color: '#6B7280' }}>
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
