import { useEffect } from 'react'

import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useAuthStore } from '../../stores/auth'

const LOGIN_PAGE_URL = '/pages/login/index'

export default function DashboardPage() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const hydrated = useAuthStore((state) => state.hydrated)

  useEffect(() => {
    if (hydrated && !accessToken) {
      void Taro.redirectTo({ url: LOGIN_PAGE_URL })
    }
  }, [accessToken, hydrated])

  if (!hydrated || !accessToken) {
    return null
  }

  return (
    <View>
      <Text>Wardrowbe Mini Program</Text>
    </View>
  )
}
