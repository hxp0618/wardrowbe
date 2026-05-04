// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Outfit } from '../../services/types'

const mocks = vi.hoisted(() => ({
  analyticsInsights: [] as string[],
  family: null as null | {
    name: string
    members: Array<{ id: string; display_name: string }>
  },
  notificationSettings: [] as Array<{ id: string; channel: string; enabled: boolean }>,
  pendingOutfit: null as Outfit | null,
  pendingTotal: 0,
  schedules: [] as Array<{
    id: string
    enabled: boolean
    day_of_week: number
    notification_time: string
    occasion: string
  }>,
}))

function makeOutfit(overrides: Partial<Outfit> = {}): Outfit {
  return {
    id: 'pending-1',
    occasion: 'office',
    scheduled_for: '2026-05-03',
    status: 'pending',
    source: 'scheduled',
    name: 'Office review look',
    replaces_outfit_id: null,
    cloned_from_outfit_id: null,
    reasoning: 'Layered for a cool day.',
    style_notes: null,
    highlights: [],
    weather: null,
    items: [
      {
        id: 'item-1',
        type: 'shirt',
        name: 'White shirt',
        image_url: null,
        thumbnail_url: null,
        layer_type: null,
      },
    ],
    feedback: null,
    family_ratings: null,
    family_rating_average: null,
    family_rating_count: null,
    created_at: '2026-05-03T00:00:00Z',
    ...overrides,
  }
}

vi.mock('@tarojs/components', () => ({
  Image: ({ src }: { src?: string }) => <img alt='' src={src} />,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    ariaLabel,
    ariaRole,
    children,
    onClick,
    style,
  }: {
    ariaLabel?: string
    ariaRole?: string
    children?: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    navigateTo: vi.fn(),
    redirectTo: vi.fn(),
    switchTab: vi.fn(),
  },
}))

vi.mock('../../components/editorial-style', () => ({
  getEditorialCardStyle: () => ({}),
  getEditorialChipLabelStyle: () => ({}),
  getEditorialChipStyle: () => ({}),
  getEditorialCompactButtonStyle: () => ({}),
}))

vi.mock('../../components/outfit-detail-sheet', () => ({
  OutfitDetailSheet: ({ outfit, visible }: { outfit: Outfit | null; visible: boolean }) =>
    visible && outfit ? <aside>detail:{outfit.id}</aside> : null,
}))

vi.mock('../../components/outfit-card', () => ({
  OutfitCard: ({ outfit }: { outfit: Outfit }) => <article>outfit-card:{outfit.id}</article>,
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({
    children,
    extra,
    onClick,
    title,
  }: {
    children?: React.ReactNode
    extra?: React.ReactNode
    onClick?: () => void
    title: string
  }) => (
    <section onClick={onClick}>
      <h2>{title}</h2>
      {extra}
      {children}
    </section>
  ),
}))

vi.mock('../../components/ui-theme', () => ({
  colors: {
    accentText: '#fff',
    border: '#ddd',
    danger: '#dc2626',
    page: '#f7f5f2',
    surface: '#fff',
    text: '#111',
    textMuted: '#666',
    textSoft: '#999',
  },
  primaryButtonStyle: {},
  secondaryButtonStyle: {},
  toneSurfaceStyle: (tone: string) => ({
    backgroundColor: tone,
    border: tone,
  }),
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-analytics', () => ({
  useAnalytics: () => ({
    data: {
      wardrobe: {
        acceptance_rate: null,
        outfits_this_week: 0,
        total_items: 4,
      },
      insights: mocks.analyticsInsights,
    },
  }),
}))

vi.mock('../../hooks/use-family', () => ({
  useFamily: () => ({ data: mocks.family }),
}))

vi.mock('../../hooks/use-notifications', () => ({
  useNotificationSettings: () => ({ data: mocks.notificationSettings }),
  useSchedules: () => ({ data: mocks.schedules }),
}))

vi.mock('../../hooks/use-outfits', () => ({
  usePendingOutfits: () => ({
    data: {
      outfits: mocks.pendingOutfit ? [mocks.pendingOutfit] : [],
      total: mocks.pendingTotal,
    },
    isLoading: false,
  }),
  useWeather: () => ({ data: null, error: null, isLoading: false, refetch: vi.fn() }),
}))

vi.mock('../../hooks/use-preferences', () => ({
  usePreferences: () => ({ data: { temperature_unit: 'celsius' } }),
}))

vi.mock('../../hooks/use-user', () => ({
  useUserProfile: () => ({
    data: {
      display_name: 'Dev',
      location_lat: null,
      location_lon: null,
    },
    isLoading: false,
  }),
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    greeting: (name?: string) => `你好，${name}`,
    t: (key: string) => ({
      dashboard_family_connected: '可连接家庭空间',
      dashboard_family_title: '家庭',
      dashboard_get_suggestion: '获取穿搭推荐',
      dashboard_hero_missing_title: '先把今日衣橱节奏定下来',
      dashboard_acceptance_rate: '接受率',
      dashboard_insights_title: '洞察',
      dashboard_location_missing: '未设置位置信息',
      dashboard_next_schedule_title: '下次提醒',
      dashboard_notification_status_title: '通知状态',
      dashboard_outfit_fallback: '穿搭推荐',
      dashboard_pending_empty: '没有待处理的推荐',
      dashboard_pending_empty_title: '全部处理完毕',
      dashboard_set_location: '设置位置',
      dashboard_stat_pending: '待确认',
      dashboard_stat_pending_hint: '待确认搭配',
      dashboard_stat_reminders: '提醒',
      dashboard_stat_reminders_hint: '提醒计划',
      dashboard_stat_wardrobe: '衣橱',
      dashboard_stat_wardrobe_hint: '衣橱单品',
      dashboard_today_label: '今日',
      dashboard_view_detail: '查看详情',
      dashboard_view_all: '查看全部',
      dashboard_weekly_outfits: '本周穿搭',
      dashboard_weekly_overview_title: '周概览',
      dashboard_weather_title: '天气',
      dashboard_weather_waiting: '等待天气同步',
      page_dashboard_subtitle: '今天穿什么？',
    }[key] ?? key),
    tf: (key: string, values?: Record<string, string | number>) => {
      if (key === 'dashboard_pending_title') return `待确认 (${values?.count})`
      if (key === 'dashboard_hero_summary_missing') return `当前衣橱 ${values?.count} 件`
      if (key === 'dashboard_notification_enabled') return `${values?.channel} 已启用`
      if (key === 'dashboard_notification_summary') return `${values?.enabled}/${values?.total} 个渠道启用`
      if (key === 'dashboard_family_members') return `${values?.name} ${values?.count} 人`
      if (key === 'dashboard_family_members_summary') return `${values?.name} ${values?.count} 人`
      return key
    },
  }),
}))

describe('DashboardPage pending outfits', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.analyticsInsights = []
    mocks.family = null
    mocks.notificationSettings = []
    mocks.pendingOutfit = null
    mocks.pendingTotal = 0
    mocks.schedules = []
  })

  it('opens outfit details before accepting or rejecting a pending look', async () => {
    mocks.pendingOutfit = makeOutfit()
    mocks.pendingTotal = 1

    const { default: DashboardPage } = await import('./index')
    render(<DashboardPage />)

    expect(screen.queryByText('接受')).toBeNull()
    expect(screen.queryByText('拒绝')).toBeNull()

    fireEvent.click(screen.getByText('outfit-card:pending-1'))

    expect(screen.getByText('detail:pending-1')).toBeTruthy()
  })

  it('opens all pending looks with the pending history filter applied', async () => {
    mocks.pendingOutfit = makeOutfit()
    mocks.pendingTotal = 4
    const Taro = (await import('@tarojs/taro')).default
    const { default: DashboardPage } = await import('./index')

    render(<DashboardPage />)

    fireEvent.click(screen.getByText('查看全部'))

    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/history/index?status=pending',
    })
  })

  it('falls back to redirecting when pending history navigation times out', async () => {
    mocks.pendingOutfit = makeOutfit()
    mocks.pendingTotal = 4
    const Taro = (await import('@tarojs/taro')).default
    vi.mocked(Taro.navigateTo).mockRejectedValueOnce(new Error('navigateTo:fail timeout'))
    const { default: DashboardPage } = await import('./index')

    render(<DashboardPage />)

    fireEvent.click(screen.getByText('待确认'))

    await waitFor(() => {
      expect(Taro.redirectTo).toHaveBeenCalledWith({
        url: '/pages/history/index?status=pending',
      })
    })
  })

  it('uses the dashboard summary metrics as direct navigation shortcuts', async () => {
    const Taro = (await import('@tarojs/taro')).default
    const { default: DashboardPage } = await import('./index')

    render(<DashboardPage />)

    fireEvent.click(screen.getByText('衣橱'))
    expect(Taro.switchTab).toHaveBeenCalledWith({
      url: '/pages/wardrobe/index',
    })

    fireEvent.click(screen.getByText('待确认'))
    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/history/index?status=pending',
    })

    fireEvent.click(screen.getByText('提醒'))
    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/notifications/index',
    })
  })

  it('keeps dashboard summary shortcuts as a flat row inside the hero card', async () => {
    const { default: DashboardPage } = await import('./index')

    render(<DashboardPage />)

    const shortcutRowStyle = screen.getByLabelText('衣橱').parentElement?.getAttribute('style') ?? ''

    expect(shortcutRowStyle).toContain('border-top')
    expect(shortcutRowStyle).not.toContain('background-color')
    expect(shortcutRowStyle).not.toContain('overflow')
  })

  it('opens analytics from dashboard analytics summaries', async () => {
    mocks.analyticsInsights = ['棕色占比偏高']
    const Taro = (await import('@tarojs/taro')).default
    const { default: DashboardPage } = await import('./index')

    render(<DashboardPage />)

    fireEvent.click(screen.getByText('周概览'))
    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/analytics/index',
    })

    vi.clearAllMocks()

    fireEvent.click(screen.getByText('棕色占比偏高'))
    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/analytics/index',
    })
  })

  it('opens notification management from notification summary cards', async () => {
    mocks.notificationSettings = [{ id: 'channel-1', channel: 'generic', enabled: true }]
    mocks.schedules = [
      {
        id: 'schedule-1',
        enabled: true,
        day_of_week: 1,
        notification_time: '08:30:00',
        occasion: 'office',
      },
    ]
    const Taro = (await import('@tarojs/taro')).default
    const { default: DashboardPage } = await import('./index')

    render(<DashboardPage />)

    expect(screen.getByText('周二 08:30')).toBeTruthy()

    fireEvent.click(screen.getByText('通知状态'))
    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/notifications/index',
    })

    vi.clearAllMocks()

    fireEvent.click(screen.getByText('下次提醒'))
    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/notifications/index',
    })
  })

  it('opens the family feed from the family summary card', async () => {
    mocks.family = {
      name: 'QA Family',
      members: [{ id: 'member-1', display_name: 'Dev User' }],
    }
    const Taro = (await import('@tarojs/taro')).default
    const { default: DashboardPage } = await import('./index')

    render(<DashboardPage />)

    fireEvent.click(screen.getByText('家庭'))

    expect(Taro.navigateTo).toHaveBeenCalledWith({
      url: '/pages/family-feed/index',
    })
  })
})
