// @vitest-environment jsdom

import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  completeMutateAsync: vi.fn(),
  createFamilyMutateAsync: vi.fn(),
  createItemMutateAsync: vi.fn(),
  joinFamilyMutateAsync: vi.fn(),
  pending: {
    complete: false,
    createFamily: false,
    createItem: false,
    joinFamily: false,
    updatePreferences: false,
    updateUserProfile: false,
  },
  preferences: {
    color_avoid: [],
    color_favorites: [],
    default_occasion: 'casual',
    style_profile: {},
    temperature_unit: 'celsius',
  },
  showToast: vi.fn(),
  switchTab: vi.fn(),
  updatePreferencesMutateAsync: vi.fn(),
  updateUserProfileMutateAsync: vi.fn(),
  userProfile: {
    display_name: 'Dev User',
    location_lat: null,
    location_lon: null,
    location_name: null,
    onboarding_completed: false,
  },
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
  Slider: () => <input aria-label='slider' type='range' />,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  View: ({
    ariaLabel,
    ariaRole,
    children,
    onClick,
    style,
  }: {
    ariaLabel?: string
    ariaRole?: string
    children?: React.ReactNode
    onClick?: () => void
    style?: React.CSSProperties
  }) => <div aria-label={ariaLabel} role={ariaRole} onClick={onClick} style={style}>{children}</div>,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    chooseImage: vi.fn(),
    showToast: mocks.showToast,
    switchTab: mocks.switchTab,
  },
}))

vi.mock('../../components/compact-option-group', () => ({
  CompactOptionGroup: ({ options }: { options: string[] }) => (
    <div>{options.map((option) => <span key={option}>{option}</span>)}</div>
  ),
}))

vi.mock('../../components/page-shell', () => ({
  PageShell: ({
    children,
    subtitle,
    title,
  }: {
    children?: React.ReactNode
    subtitle?: string
    title?: string
  }) => (
    <main>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </main>
  ),
}))

vi.mock('../../components/previewable-image', () => ({
  PreviewableImage: ({ src }: { src: string }) => <img alt='' src={src} />,
}))

vi.mock('../../components/section-card', () => ({
  SectionCard: ({ children, title }: { children?: React.ReactNode; title: string }) => (
    <section data-testid='onboarding-section-card'>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}))

vi.mock('../../hooks/use-auth-guard', () => ({
  useAuthGuard: () => true,
}))

vi.mock('../../hooks/use-family', () => ({
  useCreateFamily: () => ({ isPending: mocks.pending.createFamily, mutateAsync: mocks.createFamilyMutateAsync }),
  useJoinFamily: () => ({ isPending: mocks.pending.joinFamily, mutateAsync: mocks.joinFamilyMutateAsync }),
}))

vi.mock('../../hooks/use-items', () => ({
  useCreateItemWithImages: () => ({ isPending: mocks.pending.createItem, mutateAsync: mocks.createItemMutateAsync }),
}))

vi.mock('../../hooks/use-preferences', () => ({
  usePreferences: () => ({ data: mocks.preferences }),
  useUpdatePreferences: () => ({ isPending: mocks.pending.updatePreferences, mutateAsync: mocks.updatePreferencesMutateAsync }),
}))

vi.mock('../../hooks/use-user', () => ({
  useCompleteOnboarding: () => ({ isPending: mocks.pending.complete, mutateAsync: mocks.completeMutateAsync }),
  useUpdateUserProfile: () => ({ isPending: mocks.pending.updateUserProfile, mutateAsync: mocks.updateUserProfileMutateAsync }),
  useUserProfile: () => ({ data: mocks.userProfile }),
}))

vi.mock('../../services/outfits', () => ({
  geocodeWeatherLocation: vi.fn(),
}))

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mocks.pending, {
      complete: false,
      createFamily: false,
      createItem: false,
      joinFamily: false,
      updatePreferences: false,
      updateUserProfile: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('does not reserve space for a decorative brand tile before the nickname form', async () => {
    const { default: OnboardingPage } = await import('./index')

    render(<OnboardingPage />)

    expect(screen.queryByText('W')).toBeNull()
    expect(screen.getByLabelText('例如：小雨 / Ada')).toBeTruthy()
  })

  it('groups color and style preferences into one compact step section', async () => {
    const { default: OnboardingPage } = await import('./index')

    render(<OnboardingPage />)

    fireEvent.change(screen.getByLabelText('例如：小雨 / Ada'), {
      target: { value: 'Ada' },
    })
    fireEvent.click(screen.getByText('保存昵称并继续').parentElement!)
    await waitFor(() => {
      expect(screen.getByText('家庭设置')).toBeTruthy()
    })
    fireEvent.click(screen.getByText('先跳过').parentElement!)
    expect(screen.getByText('位置设置')).toBeTruthy()
    fireEvent.click(screen.getByText('先跳过').parentElement!)

    expect(screen.getAllByTestId('onboarding-section-card')).toHaveLength(1)
    expect(screen.getByText('偏好设置')).toBeTruthy()
    expect(screen.getByText('颜色偏好')).toBeTruthy()
    expect(screen.getByText('避免颜色')).toBeTruthy()
    expect(screen.getByText('风格倾向')).toBeTruthy()
  })

  it('renders color swatches as accessible 44px touch targets', async () => {
    const { default: OnboardingPage } = await import('./index')

    render(<OnboardingPage />)

    fireEvent.change(screen.getByLabelText('例如：小雨 / Ada'), {
      target: { value: 'Ada' },
    })
    fireEvent.click(screen.getByText('保存昵称并继续').parentElement!)
    await waitFor(() => {
      expect(screen.getByText('家庭设置')).toBeTruthy()
    })
    fireEvent.click(screen.getByText('先跳过').parentElement!)
    fireEvent.click(screen.getByText('先跳过').parentElement!)

    const favoriteBlack = screen.getByLabelText('选择偏好颜色：黑色')
    const avoidBlack = screen.getByLabelText('标记避免颜色：黑色')

    expect(favoriteBlack.getAttribute('role')).toBe('button')
    expect(favoriteBlack.style.width).toBe('44px')
    expect(favoriteBlack.style.height).toBe('44px')
    expect(avoidBlack.getAttribute('role')).toBe('button')
    expect(avoidBlack.style.width).toBe('44px')
    expect(avoidBlack.style.height).toBe('44px')
  })

  it('does not run the primary step action while it is loading', async () => {
    mocks.pending.updateUserProfile = true
    const { default: OnboardingPage } = await import('./index')

    render(<OnboardingPage />)

    fireEvent.change(screen.getByLabelText('例如：小雨 / Ada'), {
      target: { value: 'Ada' },
    })
    fireEvent.click(screen.getByText('处理中...').parentElement!)

    expect(mocks.updateUserProfileMutateAsync).not.toHaveBeenCalled()
  })
})
