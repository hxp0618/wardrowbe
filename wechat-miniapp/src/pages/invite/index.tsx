import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo } from 'react'

import { getActionButtonStyle, getEnabledActionHandler, getToneActionSurfaceStyle } from '../../components/action-style'
import { AuthGuardedPage } from '../../components/auth-guarded-page'
import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { colors } from '../../components/ui-theme'
import { useJoinFamilyByToken } from '../../hooks/use-family'
import { useI18n } from '../../lib/i18n'

export default function InvitePage() {
  const { t } = useI18n()
  const router = Taro.getCurrentInstance().router
  const initialToken = useMemo(() => router?.params?.token ?? '', [router?.params?.token])
  const loginPageUrl = initialToken
    ? `/pages/login/index?inviteToken=${encodeURIComponent(initialToken)}`
    : '/pages/login/index'
  const joinByToken = useJoinFamilyByToken()

  const acceptDisabled = joinByToken.isPending || joinByToken.isSuccess

  const handleAccept = async () => {
    if (acceptDisabled) return
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
    <AuthGuardedPage loginPageUrl={loginPageUrl}>
      <PageShell header={null} title={t('page_invite_title')} subtitle={t('page_invite_subtitle')}>
      {!initialToken ? (
        <SectionCard compact title={t('invite_status_title')}>
          <EmptyState
            embedded
            title={t('invite_missing_title')}
            description={t('invite_missing_description')}
            action={
              <View ariaRole='button' ariaLabel={t('invite_go_family')} onClick={() => Taro.redirectTo({ url: '/pages/family/index' })} style={getActionButtonStyle()}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('invite_go_family')}</Text>
              </View>
            }
          />
        </SectionCard>
      ) : (
        <>
          <SectionCard compact title={t('invite_accept_title')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                {t('invite_explain_body')}
              </Text>

              {joinByToken.isError ? (
                <View style={{ padding: '12px 14px', borderRadius: '8px', ...getToneActionSurfaceStyle('danger') }}>
                  <Text style={{ fontSize: '13px', color: colors.danger }}>
                    {joinByToken.error instanceof Error ? joinByToken.error.message : t('invite_invalid')}
                  </Text>
                </View>
              ) : null}

              <View
                ariaRole='button'
                ariaLabel={t('invite_accept_button')}
                onClick={getEnabledActionHandler(acceptDisabled, handleAccept)}
                style={getActionButtonStyle({ variant: 'primary', disabled: acceptDisabled })}
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
    </AuthGuardedPage>
  )
}
