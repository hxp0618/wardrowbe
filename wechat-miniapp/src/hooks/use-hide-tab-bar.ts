import { useEffect } from 'react'

import Taro from '@tarojs/taro'

/**
 * Hides the WeChat custom tab bar while a sheet/drawer is visible, restoring
 * it on close. Used by full-screen overlay components (item-detail-sheet,
 * outfit-detail-sheet, mobile-drawer) to keep the tab bar from peeking through
 * the floating panel.
 *
 * Both `hideTabBar` and `showTabBar` reject when no tab bar is present (e.g.,
 * pages without `useBuiltInTabBar`); errors are swallowed silently.
 */
export function useHideTabBar(visible: boolean): void {
  useEffect(() => {
    if (!visible) return undefined

    void Promise.resolve(Taro.hideTabBar({ animation: false })).catch(() => undefined)

    return () => {
      void Promise.resolve(Taro.showTabBar({ animation: false })).catch(() => undefined)
    }
  }, [visible])
}
