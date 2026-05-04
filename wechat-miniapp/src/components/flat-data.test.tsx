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

describe('FlatMetricGrid', () => {
  it('exposes clickable metrics as accessible 44px actions', async () => {
    const { FlatMetricGrid } = await import('./flat-data')

    render(
      <FlatMetricGrid
        metrics={[
          {
            label: '家庭成员',
            value: '2',
            hint: '切换成员',
            onClick: vi.fn(),
          },
        ]}
      />
    )

    const action = screen.getByRole('button', { name: '家庭成员 2 切换成员' })

    expect(action.style.minHeight).toBe('44px')
  })
})
