// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  cancelInvite: vi.fn(),
  leaveFamily: vi.fn(),
  navigateTo: vi.fn(),
  pageScrollTo: vi.fn(),
  redirectTo: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Input: ({
    onInput,
    placeholder,
    value,
  }: {
    onInput?: (event: { detail: { value: string } }) => void
    placeholder?: string
    value?: string
  }) => (
    <input
      aria-label={placeholder}
      onChange={(event) => onInput?.({ detail: { value: event.currentTarget.value } })}
      placeholder={placeholder}
      value={value || ''}
    />
  ),
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    children,
    onClick,
    style,
  }: {
    children?: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
  }) => (
    <div onClick={onClick} style={style}>{children}</div>
  ),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    navigateTo: mocks.navigateTo,
    pageScrollTo: mocks.pageScrollTo,
    redirectTo: mocks.redirectTo,
    showToast: mocks.showToast,
  },
}))

vi.mock('../../components/compact-option-group', () => ({
  CompactOptionGroup: () => <div>roles</div>,
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: () => <div>empty</div>,
}))

vi.mock('../../components/editorial-style', () => ({
  getEditorialCompactButtonStyle: () => ({}),
}))

vi.mock('../../components/flat-data', () => ({
  FlatMetricGrid: ({
    metrics,
  }: {
    metrics: Array<{ label: string; onClick?: () => void; value: string }>
  }) => (
    <div data-testid='flat-metrics'>
      {metrics.map((metric) => (
        <button key={metric.label} onClick={metric.onClick}>
          {metric.label}:{metric.value}
        </button>
      ))}
    </div>
  ),
  FlatList: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  FlatListRow: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children }: { children?: React.ReactNode }) => <section>{children}</section>,
}))

vi.mock('../../components/stat-card', () => ({
  StatCard: ({ label, onClick, value }: { label: string; onClick?: () => void; value: string }) => (
    <div data-testid='stat-card' onClick={onClick}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}))

vi.mock('../../components/ui-badge', () => ({
  UIBadge: ({ label }: { label: string }) => <span>{label}</span>,
}))

vi.mock('../../components/ui-theme', () => ({
  colors: {
    accentText: '#fff',
    danger: '#dc2626',
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

vi.mock('../../hooks/use-family', () => ({
  useCancelInvite: () => ({ isPending: false, mutate: mocks.cancelInvite }),
  useCreateFamily: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useFamily: () => ({
    data: {
      id: 'family-1',
      name: 'QA Family',
      invite_code: 'ABC123',
      members: [
        {
          id: 'member-1',
          display_name: 'Dev User',
          email: 'dev@wardrobe.local',
          role: 'admin',
        },
      ],
      pending_invites: [
        {
          id: 'invite-1',
          email: 'qa@example.com',
          expires_at: '2026-05-10T00:00:00Z',
        },
      ],
    },
  }),
  useInviteMember: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useJoinFamily: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useLeaveFamily: () => ({ isPending: false, mutateAsync: mocks.leaveFamily }),
  useRegenerateInviteCode: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

vi.mock('../../lib/display', () => ({
  formatRoleLabel: (role: string) => role,
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ({
      family_cancel: '取消',
      family_cancel_invite_confirm: '确认取消',
      family_has_admin: '含管理员',
      family_invite_members_title: '邀请成员',
      family_invite_email_placeholder: '输入成员邮箱',
      family_keep_family: '保留家庭',
      family_keep_invite: '保留邀请',
      family_leave: '离开家庭',
      family_leave_confirm: '确认离开',
      family_members_title: '成员',
      family_pending_invites_title: '待处理邀请',
      family_processing: '处理中...',
      family_refresh_invite: '刷新邀请码',
      family_role_admin_invite: '管理员邀请',
      family_role_member_invite: '成员邀请',
      family_send_invite: '发送邀请',
      family_stat_members_hint: '成员提示',
      family_stat_members_label: '家庭成员',
      family_stat_pending_hint: '邀请提示',
      family_stat_pending_label: '待处理邀请',
      family_toast_left: '已离开家庭',
      family_view_feed: '看家庭动态',
      page_family_subtitle: '家庭副标题',
      page_family_title: '家庭',
    }[key] ?? key),
    tf: (key: string, values?: Record<string, string | number>) => {
      if (key === 'family_members_count') return `${values?.count} 人`
      if (key === 'family_invite_code_badge') return `邀请码 ${values?.code}`
      if (key === 'family_invite_deadline') return `截止 ${values?.value}`
      return key
    },
  }),
}))

describe('FamilyPage destructive actions', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.leaveFamily.mockResolvedValue(undefined)
  })

  it('scrolls from summary stats to the matching family detail section', async () => {
    const { default: FamilyPage } = await import('./index')
    render(<FamilyPage />)

    expect(screen.getByTestId('flat-metrics')).toBeTruthy()
    expect(screen.queryByTestId('stat-card')).toBeNull()

    fireEvent.click(screen.getByText('家庭成员:1'))

    expect(mocks.pageScrollTo).toHaveBeenCalledWith({
      selector: '#family-members',
      duration: 240,
    })

    fireEvent.click(screen.getByText('待处理邀请:1'))

    expect(mocks.pageScrollTo).toHaveBeenLastCalledWith({
      selector: '#family-pending-invites',
      duration: 240,
    })
  })

  it('requires confirmation before leaving a family', async () => {
    const { default: FamilyPage } = await import('./index')
    render(<FamilyPage />)

    fireEvent.click(screen.getByText('离开家庭'))

    expect(mocks.leaveFamily).not.toHaveBeenCalled()
    expect(screen.getByText('确认离开')).toBeTruthy()

    fireEvent.click(screen.getByText('确认离开'))

    expect(mocks.leaveFamily).toHaveBeenCalledTimes(1)
  })

  it('requires confirmation before canceling a pending invite', async () => {
    const { default: FamilyPage } = await import('./index')
    render(<FamilyPage />)

    expect(screen.getByText('取消').parentElement?.style.minHeight).toBe('44px')
    fireEvent.click(screen.getByText('取消'))

    expect(mocks.cancelInvite).not.toHaveBeenCalled()
    expect(screen.getByText('确认取消')).toBeTruthy()
    expect(screen.getByText('保留邀请').parentElement?.style.minHeight).toBe('44px')
    expect(screen.getByText('确认取消').parentElement?.style.minHeight).toBe('44px')

    fireEvent.click(screen.getByText('确认取消'))

    expect(mocks.cancelInvite).toHaveBeenCalledWith('invite-1')
  })

  it('falls back to redirecting to the family feed when page navigation times out', async () => {
    mocks.navigateTo.mockRejectedValueOnce(new Error('navigateTo:fail timeout'))
    const { default: FamilyPage } = await import('./index')
    render(<FamilyPage />)

    fireEvent.click(screen.getByText('看家庭动态'))

    await waitFor(() => {
      expect(mocks.redirectTo).toHaveBeenCalledWith({
        url: '/pages/family-feed/index',
      })
    })
  })
})
