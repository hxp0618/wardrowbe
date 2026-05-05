// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    showToast: mocks.showToast,
  },
}))

import { runMutationWithToast } from './mutation-toast'

describe('runMutationWithToast', () => {
  beforeEach(() => {
    mocks.showToast.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok=true with the result and toasts success when mutateAsync resolves', async () => {
    const mutation = { mutateAsync: vi.fn().mockResolvedValue({ id: 'a' }) }

    const outcome = await runMutationWithToast(mutation, 'arg', { success: 'done', failure: 'err' })

    expect(mutation.mutateAsync).toHaveBeenCalledWith('arg')
    expect(outcome).toEqual({ ok: true, result: { id: 'a' } })
    expect(mocks.showToast).toHaveBeenCalledWith({ title: 'done', icon: 'success' })
  })

  it('returns ok=false with the error and toasts failure when mutateAsync rejects', async () => {
    const error = new Error('boom')
    const mutation = { mutateAsync: vi.fn().mockRejectedValue(error) }

    const outcome = await runMutationWithToast(mutation, 'arg', { success: 'done', failure: 'err' })

    expect(outcome).toEqual({ ok: false, error })
    expect(mocks.showToast).toHaveBeenCalledWith({ title: 'err', icon: 'none' })
  })

  it('skips the toast when the corresponding message is omitted', async () => {
    const mutation = { mutateAsync: vi.fn().mockResolvedValue('ok') }

    const outcome = await runMutationWithToast(mutation, undefined, {})

    expect(outcome).toEqual({ ok: true, result: 'ok' })
    expect(mocks.showToast).not.toHaveBeenCalled()
  })

  it('treats void mutations as ok rather than mistaking undefined for failure', async () => {
    const mutation = { mutateAsync: vi.fn().mockResolvedValue(undefined) }

    const outcome = await runMutationWithToast(mutation, 'id', { success: 'deleted' })

    expect(outcome.ok).toBe(true)
    expect(outcome).toEqual({ ok: true, result: undefined })
    expect(mocks.showToast).toHaveBeenCalledWith({ title: 'deleted', icon: 'success' })
  })
})
