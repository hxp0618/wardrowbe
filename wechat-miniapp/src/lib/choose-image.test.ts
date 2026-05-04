import { describe, expect, it } from 'vitest'

import { isChooseImageCanceled } from './choose-image'

describe('choose image helpers', () => {
  it('detects cancellation from WeChat errMsg and Error messages', () => {
    expect(isChooseImageCanceled({ errMsg: 'chooseImage:fail cancel' })).toBe(true)
    expect(isChooseImageCanceled(new Error('user cancel'))).toBe(true)
    expect(isChooseImageCanceled({ errMsg: 'chooseImage:fail auth deny' })).toBe(false)
    expect(isChooseImageCanceled('cancel')).toBe(false)
  })
})
