import { create } from 'zustand'

export type AppLocale = 'zh' | 'en'
export type AppAppearance = 'dark' | 'light'

type AuthState = {
  accessToken: string | null
  locale: AppLocale
  appearance: AppAppearance
  hydrated: boolean
  setAccessToken: (accessToken: string | null) => void
  setLocale: (locale: AppLocale) => void
  setAppearance: (appearance: AppAppearance) => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  locale: 'zh',
  appearance: 'dark',
  hydrated: false,
  setAccessToken: (accessToken) => set({ accessToken }),
  setLocale: (locale) => set({ locale }),
  setAppearance: (appearance) => set({ appearance }),
  setHydrated: (hydrated) => set({ hydrated }),
}))
