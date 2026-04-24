import { Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { UIBadge } from '../../components/ui-badge'
import { colors, inputStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/ui-theme'
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
  const { t, tf } = useI18n()

  if (!canRender) {
    return null
  }

  const handleCreate = async () => {
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
    try {
      await leaveFamily.mutateAsync()
      void Taro.showToast({ title: t('family_toast_left'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('family_toast_action_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleRegenerate = async () => {
    try {
      await regenerateCode.mutateAsync()
      void Taro.showToast({ title: t('family_toast_regenerated'), icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : t('family_toast_regenerate_failed')
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title={t('page_family_title')} subtitle={t('page_family_subtitle')} navKey='settings'>
      {!family ? (
        <>
          <View style={{ display: 'flex', gap: '12px' }}>
            <StatCard label={t('family_stat_members_label')} value='0' hint={t('family_stat_members_empty_hint')} />
            <StatCard label={t('family_stat_pending_label')} value='0' hint={t('family_stat_pending_empty_hint')} />
          </View>
          <SectionCard title={t('family_create_title')}>
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
              <View onClick={handleCreate} style={{ ...primaryButtonStyle, opacity: !familyName.trim() || createFamily.isPending ? 0.7 : 1 }}>
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createFamily.isPending ? t('family_creating') : t('family_create')}</Text>
              </View>
            </View>
          </SectionCard>
          <SectionCard title={t('family_join_title')}>
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
              <View onClick={handleJoin} style={{ ...secondaryButtonStyle, opacity: !inviteCode.trim() || joinFamily.isPending ? 0.7 : 1 }}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{joinFamily.isPending ? t('family_joining') : t('family_join')}</Text>
              </View>
            </View>
          </SectionCard>
        </>
      ) : (
        <>
          <View style={{ display: 'flex', gap: '12px' }}>
            <StatCard label={t('family_stat_members_label')} value={String(family.members.length)} hint={t('family_stat_members_hint')} />
            <StatCard label={t('family_stat_pending_label')} value={String(family.pending_invites.length)} hint={t('family_stat_pending_hint')} />
          </View>
          <SectionCard title={family.name} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('family_members_count', { count: family.members.length })}</Text>}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <UIBadge label={tf('family_invite_code_badge', { code: family.invite_code })} />
                <UIBadge
                  label={family.members.some((member) => member.role === 'admin') ? t('family_has_admin') : t('family_regular_members')}
                  tone='success'
                />
              </View>
              <View style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <View onClick={handleRegenerate} style={{ ...secondaryButtonStyle, flex: 1, minWidth: '110px', opacity: regenerateCode.isPending ? 0.7 : 1 }}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{regenerateCode.isPending ? t('family_refreshing_code') : t('family_refresh_invite')}</Text>
                </View>
                <View onClick={() => Taro.navigateTo({ url: '/pages/family-feed/index' })} style={{ ...secondaryButtonStyle, flex: 1, minWidth: '110px' }}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{t('family_view_feed')}</Text>
                </View>
                <View onClick={handleLeave} style={{ ...secondaryButtonStyle, flex: 1, minWidth: '110px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)', opacity: leaveFamily.isPending ? 0.7 : 1 }}>
                  <Text style={{ fontSize: '14px', color: colors.danger }}>{leaveFamily.isPending ? t('family_processing') : t('family_leave')}</Text>
                </View>
              </View>
            </View>
          </SectionCard>

          <SectionCard title={t('family_members_title')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {family.members.map((member) => (
                <View
                  key={member.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: colors.surfaceMuted,
                  }}
                >
                  <View>
                    <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{member.display_name}</Text>
                    <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>{member.email}</Text>
                  </View>
                  <UIBadge label={formatRoleLabel(member.role)} tone={member.role === 'admin' ? 'warning' : 'default'} />
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard title={t('family_invite_members_title')}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                value={inviteEmail}
                placeholder={t('family_invite_email_placeholder')}
                onInput={(event) => setInviteEmail(event.detail.value)}
                style={inputStyle}
              />
              <View style={{ display: 'flex', gap: '10px' }}>
                {(['member', 'admin'] as const).map((role) => {
                  const active = inviteRole === role
                  return (
                    <View
                      key={role}
                      onClick={() => setInviteRole(role)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: active ? `1px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
                        backgroundColor: active ? colors.surfaceSelected : colors.surfaceMuted,
                        textAlign: 'center',
                      }}
                    >
                      <Text style={{ fontSize: '13px', color: active ? colors.text : colors.textMuted }}>
                        {role === 'admin' ? t('family_role_admin_invite') : t('family_role_member_invite')}
                      </Text>
                    </View>
                  )
                })}
              </View>
              <View onClick={handleInvite} style={{ ...primaryButtonStyle, opacity: !inviteEmail.trim() || inviteMember.isPending ? 0.7 : 1 }}>
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{inviteMember.isPending ? t('family_sending_invite') : t('family_send_invite')}</Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title={t('family_pending_invites_title')}>
            {family.pending_invites.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {family.pending_invites.map((invite) => (
                  <View
                    key={invite.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <View>
                      <Text style={{ display: 'block', fontSize: '14px', color: colors.text }}>{invite.email}</Text>
                      <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                        {tf('family_invite_deadline', { value: invite.expires_at })}
                      </Text>
                    </View>
                    <View onClick={() => cancelInvite.mutate(invite.id)} style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', opacity: cancelInvite.isPending ? 0.7 : 1 }}>
                      <Text style={{ fontSize: '12px', color: colors.text }}>{t('family_cancel')}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title={t('family_pending_empty_title')} description={t('family_pending_empty_description')} />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
