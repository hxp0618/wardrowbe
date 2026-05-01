import { useAuthStore } from '../stores/auth'

export function useAuthQueryEnabled(enabled = true): boolean {
  const accessToken = useAuthStore((state) => state.accessToken)
  const hydrated = useAuthStore((state) => state.hydrated)

  return enabled && hydrated && !!accessToken
}

export function isAuthQueryEnabled(enabled = true): boolean {
  if (!enabled) return false

  const { accessToken, hydrated } = useAuthStore.getState()
  return hydrated && !!accessToken
}
