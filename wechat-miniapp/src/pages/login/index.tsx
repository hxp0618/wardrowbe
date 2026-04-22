import { Button, Input, Text, View } from '@tarojs/components'

export default function LoginPage() {
  return (
    <View>
      <Text>Wardrowbe Mini Program</Text>
      <Button type='primary'>微信登录</Button>
      <Input placeholder='dev email' />
      <Input placeholder='display name' />
    </View>
  )
}
