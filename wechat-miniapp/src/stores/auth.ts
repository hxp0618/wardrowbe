import { create } from 'zustand'

export type AppLocale = 'zh' | 'en'
export type AppAppearance = 'dark' | 'light'

type AuthState = {
  accessToken: string | null
  appearance: AppAppearance
  hydrated: boolean
  setAccessToken: (accessToken: string | null) => void
  setAppearance: (appearance: AppAppearance) => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  appearance: 'light',
  hydrated: false,
  setAccessToken: (accessToken) => set({ accessToken }),
  setAppearance: (appearance) => set({ appearance }),
  setHydrated: (hydrated) => set({ hydrated }),
}))
