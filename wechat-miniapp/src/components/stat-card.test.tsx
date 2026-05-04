// @vitest-environment jsdom

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/components', () => ({
  Text: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => <span style={style}>{children}</span>,
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

describe('StatCard', () => {
  it('exposes clickable stats as accessible 44px actions', async () => {
    const { StatCard } = await import('./stat-card')

    render(
      <StatCard
        label='待确认'
        value='3'
        hint='查看详情'
        onClick={vi.fn()}
      />
    )

    const action = screen.getByRole('button', { name: '待确认 3 查看详情' })

    expect(action.style.minHeight).toBe('44px')
  })
})
