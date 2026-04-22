import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState } from 'react'

import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useJoinFamilyByToken } from '../../hooks/use-family'

export default function InvitePage() {
  const router = Taro.getCurrentInstance().router
  const initialToken = useMemo(() => router?.params?.token ?? '', [router?.params?.token])
  const canRender = useAuthGuard(
    initialToken
      ? `/pages/login/index?inviteToken=${encodeURIComponent(initialToken)}`
      : '/pages/login/index'
  )
  const [token, setToken] = useState(initialToken)
  const joinByToken = useJoinFamilyByToken()

  if (!canRender) {
    return null
  }

  const handleAccept = async () => {
    try {
      const result = await joinByToken.mutateAsync(token.trim())
      void Taro.showToast({ title: `已加入 ${result.family_name}`, icon: 'success' })
      await Taro.redirectTo({ url: '/pages/family/index' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '加入失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='邀请' subtitle='支持通过邀请 token 直接加入家庭。'>
      <SectionCard title='接受邀请'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            value={token}
            placeholder='输入邀请 token'
            onInput={(event) => setToken(event.detail.value)}
            style={{
              width: '100%',
              height: '44px',
              padding: '0 14px',
              borderRadius: '14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E5E7EB',
              boxSizing: 'border-box',
            }}
          />
          <Text style={{ fontSize: '20px', color: '#6B7280' }}>
            如果从邀请链接进入，这里会自动带上 token。
          </Text>
          <Button onClick={handleAccept} loading={joinByToken.isPending} disabled={!token.trim()}>
            接受邀请
          </Button>
        </View>
      </SectionCard>
    </PageShell>
  )
}
