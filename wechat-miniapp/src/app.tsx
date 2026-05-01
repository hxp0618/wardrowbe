import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { AppProvider, configureMiniappQueryRuntime } from './providers/app-provider'

configureMiniappQueryRuntime()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
    },
  },
})

export default function App(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>{props.children}</AppProvider>
    </QueryClientProvider>
  )
}
