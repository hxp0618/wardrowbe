import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo } from 'react'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useJoinFamilyByToken } from '../../hooks/use-family'
import { useI18n } from '../../lib/i18n'

export default function InvitePage() {
  const { t } = useI18n()
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
    <PageShell header={null} title={t('page_invite_title')} subtitle={t('page_invite_subtitle')}>
      {!initialToken ? (
        <SectionCard title={t('invite_status_title')}>
          <EmptyState
            title={t('invite_missing_title')}
            description={t('invite_missing_description')}
            action={
              <View onClick={() => Taro.redirectTo({ url: '/pages/family/index' })} style={secondaryButtonStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('invite_go_family')}</Text>
              </View>
            }
          />
        </SectionCard>
      ) : (
        <>
          <SectionCard title={t('invite_explain_title')}>
            <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
              {t('invite_explain_body')}
            </Text>
          </SectionCard>

          <SectionCard title={t('invite_accept_title')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {joinByToken.isError ? (
                <View style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)' }}>
                  <Text style={{ fontSize: '13px', color: colors.danger }}>
                    {joinByToken.error instanceof Error ? joinByToken.error.message : t('invite_invalid')}
                  </Text>
                </View>
              ) : null}

              <View
                onClick={handleAccept}
                style={{ ...primaryButtonStyle, opacity: joinByToken.isPending || joinByToken.isSuccess ? 0.7 : 1 }}
              >
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>
                  {joinByToken.isPending ? t('invite_processing') : joinByToken.isSuccess ? t('invite_accepted') : t('invite_accept_button')}
                </Text>
              </View>
            </View>
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
