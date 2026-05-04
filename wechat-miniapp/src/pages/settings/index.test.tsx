// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  chooseWechatLocation: vi.fn(),
  navigateTo: vi.fn(),
  showToast: vi.fn(),
  redirectTo: vi.fn(),
  clearStoredAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  preferences: {
    default_occasion: 'casual',
    temperature_unit: 'celsius',
  },
  updateProfile: vi.fn(),
  updatePrefs: vi.fn(),
  useUserProfile: vi.fn(),
}))

vi.mock('@tarojs/components', () => ({
  Input: ({
    onInput,
    placeholder,
    value,
  }: {
    onInput?: (event: { detail: { value: string } }) => void
    placeholder?: string
    value?: string
  }) => (
    <input
      aria-label={placeholder}
      onChange={(event) => onInput?.({ detail: { value: event.currentTarget.value } })}
      placeholder={placeholder}
      value={value || ''}
    />
  ),
  Picker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode
    onClick?: () => void
  }) => <div onClick={onClick}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    navigateTo: mocks.navigateTo,
    redirectTo: mocks.redirectTo,
    showToast: mocks.showToast,
  },
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({ children }: { children?: React.ReactNode }) => <main>{children}</main>,
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children }: { children?: React.ReactNode }) => <section>{children}</section>,
}))

vi.mock('../../components/stat-card', () => ({
  StatCard: ({
    hint,
    label,
    onClick,
    value,
  }: {
    hint?: string
    label: string
    onClick?: () => void
    value: string
  }) => (
    <div data-testid='settings-stat-card' onClick={onClick}>
      <span>{label}</span>
      <span>{value}</span>
      <span>{hint}</span>
    </div>
  ),
}))

vi.mock('../../components/ui-badge', () => ({
  UIBadge: ({ label }: { label: string }) => <span>{label}</span>,
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-notifications', () => ({
  useNotificationSettings: () => ({ data: [] }),
}))

vi.mock('../../hooks/use-preferences', () => ({
  usePreferences: () => ({
    data: mocks.preferences,
  }),
  useUpdatePreferences: () => ({ isPending: false, mutateAsync: mocks.updatePrefs }),
}))

vi.mock('../../hooks/use-user', () => ({
  useUpdateUserProfile: () => ({ isPending: false, mutateAsync: mocks.updateProfile }),
  useUserProfile: mocks.useUserProfile,
}))

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    tf: (key: string) => key,
  }),
}))

vi.mock('../../lib/storage', () => ({
  clearStoredAccessToken: mocks.clearStoredAccessToken,
}))

vi.mock('../../lib/wechat-location', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/wechat-location')>()

  return {
    ...actual,
    chooseWechatLocation: mocks.chooseWechatLocation,
  }
})

vi.mock('../../stores/auth', () => ({
  useAuthStore: (selector: (state: { setAccessToken: () => void }) => unknown) =>
    selector({ setAccessToken: mocks.setAccessToken }),
}))

describe('SettingsPage location save', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.preferences = {
      default_occasion: 'casual',
      temperature_unit: 'celsius',
    }
    mocks.useUserProfile.mockReturnValue({
      data: {
        id: 'user-1',
        email: 'dev@wardrobe.local',
        display_name: 'Dev User',
        timezone: 'Asia/Shanghai',
        location_lat: null,
        location_lon: null,
        location_name: null,
        role: 'owner',
        onboarding_completed: true,
      },
    })
    mocks.updatePrefs.mockResolvedValue({
      default_occasion: 'office',
      temperature_unit: 'fahrenheit',
    })
  })

  it('persists a chosen current location immediately so weather can use it', async () => {
    mocks.chooseWechatLocation.mockResolvedValue({
      name: 'Shanghai',
      address: 'Shanghai, China',
      latitude: 31.2304,
      longitude: 121.4737,
    })
    mocks.updateProfile.mockResolvedValue({
      id: 'user-1',
      email: 'dev@wardrobe.local',
      display_name: 'Dev User',
      timezone: 'Asia/Shanghai',
      location_lat: 31.2304,
      location_lon: 121.4737,
      location_name: 'Shanghai',
      role: 'owner',
      onboarding_completed: true,
    })

    const { default: SettingsPage } = await import('./index')
    render(<SettingsPage />)

    fireEvent.click(screen.getByText('settings_choose_location'))

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        display_name: 'Dev User',
        timezone: 'Asia/Shanghai',
        location_name: 'Shanghai',
        location_lat: 31.2304,
        location_lon: 121.4737,
      })
    })
    expect(mocks.showToast).toHaveBeenCalledWith({
      title: 'settings_location_saved',
      icon: 'success',
    })
  })

  it('saves compact preference chips without opening selector pickers', async () => {
    const { default: SettingsPage } = await import('./index')
    render(<SettingsPage />)

    fireEvent.click(screen.getByText('办公').parentElement!)
    fireEvent.click(screen.getByText('华氏').parentElement!)
    fireEvent.click(screen.getByText('settings_save_preferences').parentElement!)

    await waitFor(() => {
      expect(mocks.updatePrefs).toHaveBeenCalledWith({
        default_occasion: 'office',
        temperature_unit: 'fahrenheit',
      })
    })
  })

  it('requires a second explicit tap before signing out', async () => {
    const { default: SettingsPage } = await import('./index')
    render(<SettingsPage />)

    fireEvent.click(screen.getByText('settings_logout').parentElement!)

    expect(mocks.clearStoredAccessToken).not.toHaveBeenCalled()
    expect(mocks.setAccessToken).not.toHaveBeenCalled()
    expect(mocks.redirectTo).not.toHaveBeenCalled()
    expect(screen.getByText('settings_logout_keep')).toBeTruthy()
    expect(screen.getByText('settings_logout_confirm')).toBeTruthy()

    fireEvent.click(screen.getByText('settings_logout_confirm').parentElement!)

    expect(mocks.clearStoredAccessToken).toHaveBeenCalledTimes(1)
    expect(mocks.setAccessToken).toHaveBeenCalledWith(null)
    expect(mocks.redirectTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
  })

  it('opens family management from the family summary card', async () => {
    const { default: SettingsPage } = await import('./index')
    render(<SettingsPage />)

    fireEvent.click(screen.getByText('settings_stat_family_label').parentElement!)

    expect(mocks.navigateTo).toHaveBeenCalledWith({ url: '/pages/family/index' })
  })

  it('opens notification settings from the channel summary metric', async () => {
    const { default: SettingsPage } = await import('./index')
    render(<SettingsPage />)

    fireEvent.click(screen.getByText('settings_stat_channels_label').parentElement!)

    expect(mocks.navigateTo).toHaveBeenCalledWith({ url: '/pages/notifications/index' })
  })

  it('falls back to redirecting settings shortcuts when navigateTo times out', async () => {
    mocks.navigateTo.mockRejectedValueOnce(new Error('navigateTo:fail timeout'))
    const { default: SettingsPage } = await import('./index')
    render(<SettingsPage />)

    fireEvent.click(screen.getByText('settings_stat_channels_label').parentElement!)

    await waitFor(() => {
      expect(mocks.redirectTo).toHaveBeenCalledWith({ url: '/pages/notifications/index' })
    })
  })

  it('renders settings summary metrics as flat account details instead of standalone stat cards', async () => {
    const { default: SettingsPage } = await import('./index')
    render(<SettingsPage />)

    expect(screen.queryAllByTestId('settings-stat-card')).toHaveLength(0)
    expect(screen.getByText('settings_stat_channels_label')).toBeTruthy()
    expect(screen.getByText('settings_stat_family_label')).toBeTruthy()

    fireEvent.click(screen.getByText('settings_stat_family_label').parentElement!)

    expect(mocks.navigateTo).toHaveBeenCalledWith({ url: '/pages/family/index' })
  })
})
