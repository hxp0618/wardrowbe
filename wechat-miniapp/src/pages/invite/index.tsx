import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo } from 'react'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
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
  const joinByToken = useJoinFamilyByToken()

  if (!canRender) {
    return null
  }

  const handleAccept = async () => {
    if (!initialToken.trim()) return

    try {
      const result = await joinByToken.mutateAsync(initialToken.trim())
      void Taro.showToast({ title: `已加入 ${result.family_name}`, icon: 'success' })
      await Taro.redirectTo({ url: '/pages/family/index' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '加入失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell header={null} title='家庭邀请' subtitle='通过邀请加入家庭'>
      {!initialToken ? (
        <SectionCard title='邀请状态'>
          <EmptyState
            title='未检测到邀请链接'
            description='请从家庭邀请链接重新进入，或先去家庭页查看当前状态。'
            action={
              <View onClick={() => Taro.redirectTo({ url: '/pages/family/index' })} style={secondaryButtonStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>去家庭页</Text>
              </View>
            }
          />
        </SectionCard>
      ) : (
        <>
          <SectionCard title='邀请说明'>
            <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
              已检测到分享邀请。确认后会直接尝试加入对应家庭，无需手动输入 token。
            </Text>
          </SectionCard>

          <SectionCard title='接受邀请'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {joinByToken.isError ? (
                <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)' }}>
                  <Text style={{ fontSize: '13px', color: colors.danger }}>
                    {joinByToken.error instanceof Error ? joinByToken.error.message : '邀请不可用或已失效'}
                  </Text>
                </View>
              ) : null}

              <View
                onClick={handleAccept}
                style={{ ...primaryButtonStyle, opacity: joinByToken.isPending || joinByToken.isSuccess ? 0.7 : 1 }}
              >
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
                  {joinByToken.isPending ? '处理中...' : joinByToken.isSuccess ? '已接受邀请' : '接受邀请'}
                </Text>
              </View>
            </View>
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
