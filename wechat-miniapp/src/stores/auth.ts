import { create } from 'zustand'

type AuthState = {
  accessToken: string | null
  locale: string
  hydrated: boolean
  setAccessToken: (accessToken: string | null) => void
  setLocale: (locale: string) => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  locale: 'zh',
  hydrated: false,
  setAccessToken: (accessToken) => set({ accessToken }),
  setLocale: (locale) => set({ locale }),
  setHydrated: (hydrated) => set({ hydrated }),
}))
