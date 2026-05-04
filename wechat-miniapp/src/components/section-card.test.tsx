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

describe('SectionCard', () => {
  it('uses the title as the accessible label for clickable section cards', async () => {
    const { SectionCard } = await import('./section-card')

    render(
      <SectionCard title='本周概览' onClick={vi.fn()}>
        <span>2 套</span>
      </SectionCard>
    )

    const action = screen.getByRole('button', { name: '本周概览' })

    expect(action.style.minHeight).toBe('44px')
  })
})
