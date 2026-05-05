// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSetting: vi.fn(),
  createSchedule: vi.fn(),
  deleteSetting: vi.fn(),
  deleteSchedule: vi.fn(),
  pending: {
    createSchedule: false,
    createSetting: false,
    deleteSchedule: false,
    deleteSetting: false,
    testSetting: false,
    updateSchedule: false,
    updateSetting: false,
  },
  schedules: [] as Array<{
    id: string
    day_of_week: number
    notification_time: string
    occasion: string
    enabled: boolean
    notify_day_before: boolean
  }>,
  settings: [] as Array<{
    id: string
    channel: string
    enabled: boolean
    priority: number
    config: Record<string, unknown>
  }>,
  testSetting: vi.fn(),
  updateSchedule: vi.fn(),
  updateSetting: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Input: ({
    ariaLabel,
    onInput,
    placeholder,
    value,
  }: {
    ariaLabel?: string
    onInput?: (event: { detail: { value: string } }) => void
    placeholder?: string
    value?: string
  }) => (
    <input
      aria-label={ariaLabel}
      onChange={(event) => onInput?.({ detail: { value: event.currentTarget.value } })}
      placeholder={placeholder}
      value={value || ''}
    />
  ),
  Picker: ({
    children,
    onChange,
    range,
    value,
  }: {
    children?: React.ReactNode
    onChange?: (event: { detail: { value: string } }) => void
    range?: string[]
    value?: number
  }) => (
    <label>
      <span>{children}</span>
      <select
        aria-label='picker'
        onChange={(event) => onChange?.({ detail: { value: event.currentTarget.value } })}
        value={String(value ?? 0)}
      >
        {(range ?? []).map((option, index) => (
          <option key={option} value={String(index)}>
            {option}
          </option>
        ))}
      </select>
    </label>
  ),
  Switch: ({
    checked,
    disabled,
    onChange,
  }: {
    checked?: boolean
    disabled?: boolean
    onChange?: (event: { detail: { value: boolean } }) => void
  }) => (
    <input
      aria-label='switch'
      checked={!!checked}
      disabled={disabled}
      onChange={(event) => onChange?.({ detail: { value: event.currentTarget.checked } })}
      type='checkbox'
    />
  ),
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Textarea: ({
    ariaLabel,
    onInput,
    placeholder,
    value,
  }: {
    ariaLabel?: string
    onInput?: (event: { detail: { value: string } }) => void
    placeholder?: string
    value?: string
  }) => (
    <textarea
      aria-label={ariaLabel}
      onChange={(event) => onInput?.({ detail: { value: event.currentTarget.value } })}
      placeholder={placeholder}
      value={value || ''}
    />
  ),
  View: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode
    onClick?: () => void
  }) => <div onClick={onClick}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    showToast: vi.fn(),
  },
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: ({ description, title }: { description?: string; title: string }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children, title }: { children?: React.ReactNode; title: string }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}))

vi.mock('../../components/stat-card', () => ({
  StatCard: ({ hint, label, value }: { hint?: string; label: string; value: string }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
      <span>{hint}</span>
    </div>
  ),
}))

vi.mock('../../components/ui-badge', () => ({
  UIBadge: ({ label }: { label: string }) => <span>{label}</span>,
}))

vi.mock('../../components/ui-theme', () => ({
  colors: {
    border: '#ddd',
    surface: '#fff',
    surfaceMuted: '#f6f6f6',
    text: '#111',
    textMuted: '#666',
  },
  inputStyle: {},
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

vi.mock('../../hooks/use-notifications', () => ({
  useBarkDefaults: () => ({ data: { server: 'https://api.day.app' } }),
  useCreateNotificationSetting: () => ({
    isPending: mocks.pending.createSetting,
    mutateAsync: mocks.createSetting,
  }),
  useCreateSchedule: () => ({
    isPending: mocks.pending.createSchedule,
    mutateAsync: mocks.createSchedule,
  }),
  useDeleteNotificationSetting: () => ({
    isPending: mocks.pending.deleteSetting,
    mutate: mocks.deleteSetting,
    mutateAsync: mocks.deleteSetting,
  }),
  useDeleteSchedule: () => ({
    isPending: mocks.pending.deleteSchedule,
    mutate: mocks.deleteSchedule,
    mutateAsync: mocks.deleteSchedule,
  }),
  useNotificationHistory: () => ({ data: [] }),
  useNotificationSettings: () => ({ data: mocks.settings }),
  useNtfyDefaults: () => ({ data: { server: 'https://ntfy.sh' } }),
  useSchedules: () => ({ data: mocks.schedules }),
  useTestNotificationSetting: () => ({
    isPending: mocks.pending.testSetting,
    mutate: mocks.testSetting,
    mutateAsync: mocks.testSetting,
  }),
  useUpdateNotificationSetting: () => ({
    isPending: mocks.pending.updateSetting,
    mutate: mocks.updateSetting,
    mutateAsync: mocks.updateSetting,
  }),
  useUpdateSchedule: () => ({
    isPending: mocks.pending.updateSchedule,
    mutate: mocks.updateSchedule,
    mutateAsync: mocks.updateSchedule,
  }),
}))

vi.mock('../../lib/i18n', async () => {
  const actual = await vi.importActual<typeof import('../../lib/i18n')>('../../lib/i18n')
  return {
    ...actual,
    useI18n: () => ({
      locale: 'zh' as const,
      t: actual.translate,
      tf: actual.formatMessage,
      greeting: actual.formatGreeting,
    }),
  }
})

describe('NotificationsPage channel form', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.settings = []
    mocks.schedules = []
    Object.assign(mocks.pending, {
      createSchedule: false,
      createSetting: false,
      deleteSchedule: false,
      deleteSetting: false,
      testSetting: false,
      updateSchedule: false,
      updateSetting: false,
    })
  })

  it('updates the primary target input accessibility label when the channel changes', async () => {
    const { default: NotificationsPage } = await import('./index')
    render(<NotificationsPage />)

    expect(screen.getByLabelText('输入邮箱地址')).toBeTruthy()

    fireEvent.change(screen.getAllByLabelText('picker')[0], {
      target: { value: '4' },
    })

    expect(screen.getByLabelText('输入 Bark 设备密钥')).toBeTruthy()
  })

  it('does not create a channel when the required target is empty', async () => {
    const { default: NotificationsPage } = await import('./index')
    render(<NotificationsPage />)

    fireEvent.click(screen.getByText('添加渠道'))

    expect(mocks.createSetting).not.toHaveBeenCalled()
  })

  it('does not run channel row actions while their mutations are pending', async () => {
    mocks.settings = [
      {
        id: 'setting-1',
        channel: 'email',
        enabled: true,
        priority: 1,
        config: { address: 'qa@example.com' },
      },
    ]
    mocks.pending.testSetting = true
    mocks.pending.deleteSetting = true
    const { default: NotificationsPage } = await import('./index')
    render(<NotificationsPage />)

    fireEvent.click(screen.getByText('测试'))
    fireEvent.click(screen.getByText('删除'))

    expect(mocks.testSetting).not.toHaveBeenCalled()
    expect(mocks.deleteSetting).not.toHaveBeenCalled()
  })

  it('does not toggle channel settings while the update mutation is pending', async () => {
    mocks.settings = [
      {
        id: 'setting-1',
        channel: 'email',
        enabled: true,
        priority: 1,
        config: { address: 'qa@example.com' },
      },
    ]
    mocks.pending.updateSetting = true
    const { default: NotificationsPage } = await import('./index')
    render(<NotificationsPage />)

    const switchControl = screen.getAllByLabelText('switch')[0] as HTMLInputElement
    expect(switchControl.disabled).toBe(true)

    fireEvent.click(switchControl)

    expect(mocks.updateSetting).not.toHaveBeenCalled()
  })

  it('does not run schedule actions while their mutations are pending', async () => {
    mocks.schedules = [
      {
        id: 'schedule-1',
        day_of_week: 0,
        notification_time: '08:00',
        occasion: 'casual',
        enabled: true,
        notify_day_before: false,
      },
    ]
    mocks.pending.createSchedule = true
    mocks.pending.deleteSchedule = true
    mocks.pending.updateSchedule = true
    const { default: NotificationsPage } = await import('./index')
    render(<NotificationsPage />)

    fireEvent.click(screen.getByText('创建中...'))
    fireEvent.click(screen.getByText('停用计划'))
    fireEvent.click(screen.getByText('改为提前一天'))
    fireEvent.click(screen.getByText('删除计划'))

    expect(mocks.createSchedule).not.toHaveBeenCalled()
    expect(mocks.updateSchedule).not.toHaveBeenCalled()
    expect(mocks.deleteSchedule).not.toHaveBeenCalled()
  })
})
