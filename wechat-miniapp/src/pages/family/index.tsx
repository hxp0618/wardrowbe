import { Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { actionRowStyle, actionWrapRowStyle, getActionButtonStyle, getEnabledActionHandler } from '../../components/action-style'
import { CompactOptionGroup } from '../../components/compact-option-group'
import { EmptyState } from '../../components/empty-state'
import { FlatList, FlatListRow, FlatMetricGrid } from '../../components/flat-data'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { UIBadge } from '../../components/ui-badge'
import { colors, inputStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import {
  useCancelInvite,
  useCreateFamily,
  useFamily,
  useInviteMember,
  useJoinFamily,
  useLeaveFamily,
  useRegenerateInviteCode,
} from '../../hooks/use-family'
import { formatRoleLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { navigateToPage } from '../../lib/navigation'

export default function FamilyPage() {
  const canRender = useAuthGuard()
  const { data: family } = useFamily()
  const createFamily = useCreateFamily()
  const joinFamily = useJoinFamily()
  const regenerateCode = useRegenerateInviteCode()
  const inviteMember = useInviteMember()
  const cancelInvite = useCancelInvite()
  const leaveFamily = useLeaveFamily()
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmCancelInviteId, setConfirmCancelInviteId] = useState<string | null>(null)
  const { t, tf } = useI18n()
  const inviteRoleOptions = [t('family_role_member_invite'), t('family_role_admin_invite')]

  if (!canRender) {
    return null
  }

  const createDisabled = !familyName.trim() || createFamily.isPending
  const joinDisabled = !inviteCode.trim() || joinFamily.isPending
  const regenerateDisabled = regenerateCode.isPending
  const leaveDisabled = leaveFamily.isPending
  const inviteDisabled = !inviteEmail.trim() || inviteMember.isPending
  const cancelInviteDisabled = cancelInvite.isPending

  const handleCreate = async () => {
    if (createDisabled) return

    try {
      await createFamily.mutateAsync(familyName.trim())
      setFamilyName('')
      void Taro.showToast({ title: t('family_toast_created'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('family_toast_create_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleJoin = async () => {
    if (joinDisabled) return

    try {
      await joinFamily.mutateAsync(inviteCode.trim().toUpperCase())
      setInviteCode('')
      void Taro.showToast({ title: t('family_toast_joined'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('family_toast_join_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleInvite = async () => {
    if (inviteDisabled) return

    try {
      await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole })
      setInviteEmail('')
      void Taro.showToast({ title: t('family_toast_invited'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('family_toast_invite_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleLeave = async () => {
    if (leaveDisabled) return

    try {
      await leaveFamily.mutateAsync()
      setConfirmLeave(false)
      void Taro.showToast({ title: t('family_toast_left'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('family_toast_action_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleRegenerate = async () => {
    if (regenerateDisabled) return

    try {
      await regenerateCode.mutateAsync()
      void Taro.showToast({ title: t('family_toast_regenerated'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('family_toast_regenerate_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const scrollToSection = (selector: string) => {
    void Taro.pageScrollTo({ selector, duration: 240 })
  }

  return (
    <PageShell title={t('page_family_title')} subtitle={t('page_family_subtitle')} navKey='settings'>
      {!family ? (
        <>
          <SectionCard compact title={t('family_create_title')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                {t('family_create_description')}
              </Text>
              <Input
                value={familyName}
                placeholder={t('family_name_placeholder')}
                onInput={(event) => setFamilyName(event.detail.value)}
                style={inputStyle}
              />
              <View ariaRole='button' ariaLabel={t('family_create')} onClick={getEnabledActionHandler(createDisabled, handleCreate)} style={getActionButtonStyle({ variant: 'primary', compact: true, disabled: createDisabled })}>
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createFamily.isPending ? t('family_creating') : t('family_create')}</Text>
              </View>
            </View>
          </SectionCard>
          <SectionCard compact title={t('family_join_title')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                {t('family_join_description')}
              </Text>
              <Input
                value={inviteCode}
                placeholder={t('family_invite_code_placeholder')}
                onInput={(event) => setInviteCode(event.detail.value.toUpperCase())}
                style={inputStyle}
              />
              <View ariaRole='button' ariaLabel={t('family_join')} onClick={getEnabledActionHandler(joinDisabled, handleJoin)} style={getActionButtonStyle({ compact: true, disabled: joinDisabled })}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{joinFamily.isPending ? t('family_joining') : t('family_join')}</Text>
              </View>
            </View>
          </SectionCard>
        </>
      ) : (
        <>
          <FlatMetricGrid
            metrics={[
              {
                label: t('family_stat_members_label'),
                value: String(family.members.length),
                hint: t('family_stat_members_hint'),
                onClick: () => scrollToSection('#family-members'),
              },
              {
                label: t('family_stat_pending_label'),
                value: String(family.pending_invites.length),
                hint: t('family_stat_pending_hint'),
                onClick: () => scrollToSection('#family-pending-invites'),
              },
            ]}
          />
          <SectionCard compact title={family.name} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('family_members_count', { count: family.members.length })}</Text>}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <View style={actionWrapRowStyle}>
                <UIBadge label={tf('family_invite_code_badge', { code: family.invite_code })} />
                <UIBadge
                  label={family.members.some((member) => member.role === 'admin') ? t('family_has_admin') : t('family_regular_members')}
                  tone='success'
                />
              </View>
              <View style={{ ...actionWrapRowStyle, gap: '12px' }}>
                <View ariaRole='button' ariaLabel={t('family_refresh_invite')} onClick={getEnabledActionHandler(regenerateDisabled, handleRegenerate)} style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '110px', disabled: regenerateDisabled })}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{regenerateCode.isPending ? t('family_refreshing_code') : t('family_refresh_invite')}</Text>
                </View>
                <View ariaRole='button' ariaLabel={t('family_view_feed')} onClick={() => navigateToPage('/pages/family-feed/index')} style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '110px' })}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{t('family_view_feed')}</Text>
                </View>
                {confirmLeave ? (
                  <View style={{ ...actionRowStyle, flex: '1 1 100%' }}>
                    <View ariaRole='button' ariaLabel={t('family_keep_family')} onClick={() => setConfirmLeave(false)} style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '110px' })}>
                      <Text style={{ fontSize: '14px', color: colors.text }}>{t('family_keep_family')}</Text>
                    </View>
                    <View ariaRole='button' ariaLabel={t('family_leave_confirm')} onClick={getEnabledActionHandler(leaveDisabled, handleLeave)} style={{ ...getActionButtonStyle({ variant: 'primary', compact: true, flex: 1, minWidth: '110px', disabled: leaveDisabled }), backgroundColor: colors.danger }}>
                      <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{leaveFamily.isPending ? t('family_processing') : t('family_leave_confirm')}</Text>
                    </View>
                  </View>
                ) : (
                  <View ariaRole='button' ariaLabel={t('family_leave')} onClick={getEnabledActionHandler(leaveDisabled, () => setConfirmLeave(true))} style={getActionButtonStyle({ compact: true, flex: 1, minWidth: '110px', tone: 'danger', disabled: leaveDisabled })}>
                    <Text style={{ fontSize: '14px', color: colors.danger }}>{leaveFamily.isPending ? t('family_processing') : t('family_leave')}</Text>
                  </View>
                )}
              </View>
            </View>
          </SectionCard>

          <View id='family-members'>
            <SectionCard compact title={t('family_members_title')}>
              <FlatList>
                {family.members.map((member) => (
                  <FlatListRow
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{member.display_name}</Text>
                      <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>{member.email}</Text>
                    </View>
                    <UIBadge label={formatRoleLabel(member.role)} tone={member.role === 'admin' ? 'warning' : 'default'} />
                  </FlatListRow>
                ))}
              </FlatList>
            </SectionCard>
          </View>

          <SectionCard compact title={t('family_invite_members_title')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Input
                value={inviteEmail}
                placeholder={t('family_invite_email_placeholder')}
                onInput={(event) => setInviteEmail(event.detail.value)}
                style={inputStyle}
              />
              <CompactOptionGroup
                activeIndex={inviteRole === 'member' ? 0 : 1}
                options={inviteRoleOptions}
                onChange={(nextIndex) => setInviteRole(nextIndex === 1 ? 'admin' : 'member')}
              />
              <View ariaRole='button' ariaLabel={t('family_send_invite')} onClick={getEnabledActionHandler(inviteDisabled, handleInvite)} style={getActionButtonStyle({ variant: 'primary', compact: true, disabled: inviteDisabled })}>
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{inviteMember.isPending ? t('family_sending_invite') : t('family_send_invite')}</Text>
              </View>
            </View>
          </SectionCard>

          <View id='family-pending-invites'>
            <SectionCard compact title={t('family_pending_invites_title')}>
              {family.pending_invites.length ? (
                <FlatList>
                  {family.pending_invites.map((invite) => (
                    <FlatListRow
                      key={invite.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{invite.email}</Text>
                        <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                          {tf('family_invite_deadline', { value: invite.expires_at })}
                        </Text>
                      </View>
                      {confirmCancelInviteId === invite.id ? (
                        <View style={{ ...actionRowStyle, gap: '6px', flexShrink: 0 }}>
                          <View ariaRole='button' ariaLabel={t('family_keep_invite')} onClick={() => setConfirmCancelInviteId(null)} style={{ ...getActionButtonStyle({ compact: true }), padding: '8px 10px' }}>
                            <Text style={{ fontSize: '12px', color: colors.text }}>{t('family_keep_invite')}</Text>
                          </View>
                          <View ariaRole='button' ariaLabel={t('family_cancel_invite_confirm')} onClick={getEnabledActionHandler(cancelInviteDisabled, () => cancelInvite.mutate(invite.id))} style={{ ...getActionButtonStyle({ compact: true, tone: 'danger', disabled: cancelInviteDisabled }), padding: '8px 10px' }}>
                            <Text style={{ fontSize: '12px', color: colors.danger }}>{t('family_cancel_invite_confirm')}</Text>
                          </View>
                        </View>
                      ) : (
                        <View ariaRole='button' ariaLabel={t('family_cancel')} onClick={getEnabledActionHandler(cancelInviteDisabled, () => setConfirmCancelInviteId(invite.id))} style={getActionButtonStyle({ compact: true, disabled: cancelInviteDisabled })}>
                          <Text style={{ fontSize: '12px', color: colors.text }}>{t('family_cancel')}</Text>
                        </View>
                      )}
                    </FlatListRow>
                  ))}
                </FlatList>
              ) : (
                <EmptyState embedded title={t('family_pending_empty_title')} description={t('family_pending_empty_description')} />
              )}
            </SectionCard>
          </View>
        </>
      )}
    </PageShell>
  )
}
