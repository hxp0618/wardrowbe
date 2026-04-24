import { describe, expect, it } from 'vitest'

import {
  getEditableWechatDisplayName,
  isGeneratedWechatDisplayName,
} from './wechat-user'

describe('isGeneratedWechatDisplayName', () => {
  it('detects the system generated nickname used after WeChat sign-in', () => {
    expect(isGeneratedWechatDisplayName('微信用户-a1b2c3')).toBe(true)
    expect(isGeneratedWechatDisplayName(' 微信用户-abc123 ')).toBe(true)
    expect(isGeneratedWechatDisplayName('微信用户')).toBe(true)
  })

  it('keeps custom nicknames editable as-is', () => {
    expect(isGeneratedWechatDisplayName('Ada')).toBe(false)
    expect(isGeneratedWechatDisplayName('衣橱小助手')).toBe(false)
    expect(isGeneratedWechatDisplayName('微信用户研究员')).toBe(false)
  })
})

describe('getEditableWechatDisplayName', () => {
  it('clears generated WeChat nicknames so onboarding can ask for a custom one', () => {
    expect(getEditableWechatDisplayName('微信用户-a1b2c3')).toBe('')
    expect(getEditableWechatDisplayName('微信用户')).toBe('')
    expect(getEditableWechatDisplayName('   ')).toBe('')
  })

  it('returns existing custom nicknames unchanged apart from trimming', () => {
    expect(getEditableWechatDisplayName(' Ada ')).toBe('Ada')
    expect(getEditableWechatDisplayName('衣橱主人')).toBe('衣橱主人')
  })
})
