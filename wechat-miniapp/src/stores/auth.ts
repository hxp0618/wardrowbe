import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  accessToken: null,
  locale: 'zh',
  setAccessToken: (accessToken) => set({ accessToken }),
  setLocale: (locale) => set({ locale }),
}))
