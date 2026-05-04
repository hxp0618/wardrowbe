// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  joinByTokenMutateAsync: vi.fn(),
  params: { token: 'invite-token' } as Record<string, string>,
  redirectTo: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
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
    getCurrentInstance: () => ({
      router: {
        params: mocks.params,
      },
    }),
    redirectTo: mocks.redirectTo,
    showToast: mocks.showToast,
  },
}))

vi.mock('../../components/empty-state', () => ({
  EmptyState: ({
    action,
    description,
    title,
  }: {
    action?: React.ReactNode
    description: string
    title: string
  }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
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

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-family', () => ({
  useJoinFamilyByToken: () => ({
    error: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    mutateAsync: mocks.joinByTokenMutateAsync,
  }),
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        invite_accept_button: '接受邀请',
        invite_accept_title: '接受邀请',
        invite_accepted: '已接受邀请',
        invite_explain_body: '已检测到分享邀请。确认后会直接尝试加入对应家庭，无需手动输入 token。',
        invite_explain_title: '邀请说明',
        invite_go_family: '去家庭页',
        invite_invalid: '邀请不可用或已失效',
        invite_missing_description: '请从家庭邀请链接重新进入，或先去家庭页查看当前状态。',
        invite_missing_title: '未检测到邀请链接',
        invite_processing: '处理中...',
        invite_status_title: '邀请状态',
        page_invite_subtitle: '通过邀请加入家庭',
        page_invite_title: '家庭邀请',
      }
      return translations[key] ?? key
    },
  }),
}))

describe('InvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.params = { token: 'invite-token' }
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps the detected invite explanation inside the accept section', async () => {
    const { default: InvitePage } = await import('./index')

    render(<InvitePage />)

    expect(screen.queryByText('邀请说明')).toBeNull()
    expect(screen.getByText('已检测到分享邀请。确认后会直接尝试加入对应家庭，无需手动输入 token。')).toBeTruthy()
    expect(screen.getAllByText('接受邀请').length).toBeGreaterThan(0)
  })
})
