// @vitest-environment jsdom

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/components', () => ({
  Text: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => <span style={style}>{children}</span>,
  View: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => <div style={style}>{children}</div>,
}))

describe('EmptyState', () => {
  it('can render inline inside a section without another card shell', async () => {
    const { EmptyState } = await import('./empty-state')

    render(<EmptyState embedded title='没有数据' description='换个条件再试。' />)

    const container = screen.getByText('没有数据').parentElement
    expect(container?.style.paddingTop).toBe('6px')
    expect(container?.style.border).toBe('')
  })
})
