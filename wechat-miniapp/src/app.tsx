import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AppProvider } from './providers/app-provider'

const queryClient = new QueryClient()

export default function App(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>{props.children}</AppProvider>
    </QueryClientProvider>
  )
}
