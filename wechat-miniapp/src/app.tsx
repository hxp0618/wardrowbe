import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { AppProvider } from './providers/app-provider'

const queryClient = new QueryClient()

export default function App(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>{props.children}</AppProvider>
    </QueryClientProvider>
  )
}
