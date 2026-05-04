export function isChooseImageCanceled(error: unknown): boolean {
  const errMsg =
    typeof error === 'object' && error !== null && 'errMsg' in error && typeof error.errMsg === 'string'
      ? error.errMsg
      : error instanceof Error
        ? error.message
        : ''

  return errMsg.toLowerCase().includes('cancel')
}
