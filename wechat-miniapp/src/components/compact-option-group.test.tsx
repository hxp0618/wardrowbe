// @vitest-environment jsdom

import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/components', () => ({
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    children,
    onClick,
    style,
  }: {
    children?: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div onClick={onClick} style={style}>{children}</div>,
}))

describe('CompactOptionGroup', () => {
  it('renders compact options and reports the selected index', async () => {
    const { CompactOptionGroup } = await import('./compact-option-group')
    const handleChange = vi.fn()

    render(
      <CompactOptionGroup
        activeIndex={0}
        options={['全部', '办公', '休闲']}
        onChange={handleChange}
      />
    )

    fireEvent.click(screen.getByText('办公'))

    expect(handleChange).toHaveBeenCalledWith(1)
    expect(screen.getByText('办公').parentElement?.style.minHeight).toBe('44px')
  })
})
