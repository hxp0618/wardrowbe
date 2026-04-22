import { api } from '../lib/api'

import type { Preferences } from './types'

export function getPreferences(): Promise<Preferences> {
  return api.get<Preferences>('/users/me/preferences')
}

export function updatePreferences(data: Partial<Preferences>): Promise<Preferences> {
  return api.patch<Preferences>('/users/me/preferences', data)
}

export function resetPreferences(): Promise<Preferences> {
  return api.post<Preferences>('/users/me/preferences/reset')
}
