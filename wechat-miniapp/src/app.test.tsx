import type { ReactElement } from 'react'

import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: 'query-client-provider',
}))

vi.mock('./providers/app-provider', () => ({
  AppProvider: 'app-provider',
}))

describe('App', () => {
  it('wraps miniapp pages with query and session providers', async () => {
    const { default: App } = await import('./app')
    const tree = App({ children: 'screen' }) as ReactElement
    const appProvider = tree.props.children as ReactElement

    expect(tree.type).toBe('query-client-provider')
    expect(tree.props.client).toBeTruthy()
    expect(appProvider.type).toBe('app-provider')
    expect(appProvider.props.children).toBe('screen')
  })
})
