type MenuButtonRectLike = {
  top?: number
  height?: number
}

type ResolveHeaderMetricsOptions = {
  statusBarHeight?: number
  menuButtonRect?: MenuButtonRectLike
}

export type HeaderMetrics = {
  paddingTop: number
  contentHeight: number
  paddingBottom: number
}

const DEFAULT_CONTENT_HEIGHT = 36
const DEFAULT_TOP_GAP = 6
const DEFAULT_BOTTOM_GAP = 8
const MIN_VERTICAL_GAP = 4

export function resolveHeaderMetrics(
  options: ResolveHeaderMetricsOptions = {}
): HeaderMetrics {
  const statusBarHeight = options.statusBarHeight ?? 20
  const menuButtonRect = options.menuButtonRect

  if (!menuButtonRect?.height || menuButtonRect.top == null) {
    return {
      paddingTop: statusBarHeight + DEFAULT_TOP_GAP,
      contentHeight: DEFAULT_CONTENT_HEIGHT,
      paddingBottom: DEFAULT_BOTTOM_GAP,
    }
  }

  const menuTopGap = Math.max(menuButtonRect.top - statusBarHeight, MIN_VERTICAL_GAP)
  const menuAreaHeight = menuButtonRect.height + menuTopGap * 2
  const contentHeight = Math.max(DEFAULT_CONTENT_HEIGHT, menuButtonRect.height)
  const balancedGap = Math.max(
    MIN_VERTICAL_GAP,
    Math.round((menuAreaHeight - contentHeight) / 2)
  )

  return {
    paddingTop: statusBarHeight + balancedGap,
    contentHeight,
    paddingBottom: balancedGap,
  }
}

export function getHeaderChromeHeight(metrics: HeaderMetrics): number {
  return metrics.paddingTop + metrics.contentHeight + metrics.paddingBottom
}
