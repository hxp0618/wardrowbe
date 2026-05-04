type MenuButtonRectLike = {
  top?: number
  height?: number
  left?: number
  right?: number
  width?: number
}

type ResolveHeaderMetricsOptions = {
  statusBarHeight?: number
  windowWidth?: number
  menuButtonRect?: MenuButtonRectLike
}

export type HeaderMetrics = {
  paddingTop: number
  contentHeight: number
  paddingBottom: number
  paddingRight: number
}

const DEFAULT_CONTENT_HEIGHT = 36
const DEFAULT_TOP_GAP = 6
const DEFAULT_BOTTOM_GAP = 8
const DEFAULT_HORIZONTAL_PADDING = 16
const MENU_BUTTON_HORIZONTAL_GAP = 8
const MIN_VERTICAL_GAP = 4

function resolveRightPadding(
  windowWidth?: number,
  menuButtonRect?: MenuButtonRectLike
): number {
  const menuLeft =
    menuButtonRect?.left ??
    (menuButtonRect?.right != null && menuButtonRect.width != null
      ? menuButtonRect.right - menuButtonRect.width
      : undefined)

  if (!windowWidth || menuLeft == null) {
    return DEFAULT_HORIZONTAL_PADDING
  }

  return Math.max(
    DEFAULT_HORIZONTAL_PADDING,
    Math.ceil(windowWidth - menuLeft + MENU_BUTTON_HORIZONTAL_GAP)
  )
}

export function resolveHeaderMetrics(
  options: ResolveHeaderMetricsOptions = {}
): HeaderMetrics {
  const statusBarHeight = options.statusBarHeight ?? 20
  const menuButtonRect = options.menuButtonRect
  const paddingRight = resolveRightPadding(options.windowWidth, menuButtonRect)

  if (!menuButtonRect?.height || menuButtonRect.top == null) {
    return {
      paddingTop: statusBarHeight + DEFAULT_TOP_GAP,
      contentHeight: DEFAULT_CONTENT_HEIGHT,
      paddingBottom: DEFAULT_BOTTOM_GAP,
      paddingRight,
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
    paddingRight,
  }
}

export function getHeaderChromeHeight(metrics: HeaderMetrics): number {
  return metrics.paddingTop + metrics.contentHeight + metrics.paddingBottom
}
