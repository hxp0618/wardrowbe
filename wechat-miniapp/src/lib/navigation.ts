import Taro from '@tarojs/taro'

export function navigateToPage(url: string) {
  try {
    void Promise.resolve(Taro.navigateTo({ url })).catch(() => {
      void Taro.redirectTo({ url })
    })
  } catch {
    void Taro.redirectTo({ url })
  }
}
