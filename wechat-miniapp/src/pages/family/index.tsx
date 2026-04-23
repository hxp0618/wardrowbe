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

  if (!canRender) {
    return null
  }

  const handleCreate = async () => {
    try {
      await createFamily.mutateAsync(familyName.trim())
      setFamilyName('')
      void Taro.showToast({ title: '家庭已创建', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleJoin = async () => {
    try {
      await joinFamily.mutateAsync(inviteCode.trim().toUpperCase())
      setInviteCode('')
      void Taro.showToast({ title: '已加入家庭', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '加入失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleInvite = async () => {
    try {
      await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole })
      setInviteEmail('')
      void Taro.showToast({ title: '邀请已发送', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '邀请失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleLeave = async () => {
    try {
      await leaveFamily.mutateAsync()
      void Taro.showToast({ title: '已离开家庭', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  const handleRegenerate = async () => {
    try {
      await regenerateCode.mutateAsync()
      void Taro.showToast({ title: '邀请码已刷新', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '刷新失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell title='家庭' subtitle='与家人一起分享穿搭' navKey='settings'>
      {!family ? (
        <>
          <View style={{ display: 'flex', gap: '12px' }}>
            <StatCard label='家庭成员' value='0' hint='创建或加入后可与家人共享穿搭' />
            <StatCard label='待处理邀请' value='0' hint='邀请成员后会显示在这里' />
          </View>
          <SectionCard title='创建家庭'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                新建一个家庭空间，随后你可以分享邀请码、查看家庭动态，并给家人的穿搭打分。
              </Text>
              <Input
                value={familyName}
                placeholder='输入家庭名称'
                onInput={(event) => setFamilyName(event.detail.value)}
                style={inputStyle}
              />
              <View onClick={handleCreate} style={{ ...primaryButtonStyle, opacity: !familyName.trim() || createFamily.isPending ? 0.7 : 1 }}>
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{createFamily.isPending ? '创建中...' : '创建家庭'}</Text>
              </View>
            </View>
          </SectionCard>
          <SectionCard title='加入家庭'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Text style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.6 }}>
                已收到邀请码时，直接输入后即可加入已有家庭。
              </Text>
              <Input
                value={inviteCode}
                placeholder='输入邀请码'
                onInput={(event) => setInviteCode(event.detail.value.toUpperCase())}
                style={inputStyle}
              />
              <View onClick={handleJoin} style={{ ...secondaryButtonStyle, opacity: !inviteCode.trim() || joinFamily.isPending ? 0.7 : 1 }}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{joinFamily.isPending ? '加入中...' : '加入家庭'}</Text>
              </View>
            </View>
          </SectionCard>
        </>
      ) : (
        <>
          <View style={{ display: 'flex', gap: '12px' }}>
            <StatCard label='家庭成员' value={String(family.members.length)} hint='包含你在内的全部成员' />
            <StatCard label='待处理邀请' value={String(family.pending_invites.length)} hint='未接受或未过期的邀请' />
          </View>
          <SectionCard title={family.name} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{family.members.length} 人</Text>}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <UIBadge label={`邀请码 ${family.invite_code}`} />
                <UIBadge
                  label={family.members.some((member) => member.role === 'admin') ? '含管理员' : '普通成员'}
                  tone='success'
                />
              </View>
              <View style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <View onClick={handleRegenerate} style={{ ...secondaryButtonStyle, flex: 1, minWidth: '110px', opacity: regenerateCode.isPending ? 0.7 : 1 }}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>{regenerateCode.isPending ? '刷新中...' : '刷新邀请码'}</Text>
                </View>
                <View onClick={() => Taro.navigateTo({ url: '/pages/family-feed/index' })} style={{ ...secondaryButtonStyle, flex: 1, minWidth: '110px' }}>
                  <Text style={{ fontSize: '14px', color: colors.text }}>看家庭动态</Text>
                </View>
                <View onClick={handleLeave} style={{ ...secondaryButtonStyle, flex: 1, minWidth: '110px', backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid rgba(248, 113, 113, 0.22)', opacity: leaveFamily.isPending ? 0.7 : 1 }}>
                  <Text style={{ fontSize: '14px', color: colors.danger }}>{leaveFamily.isPending ? '处理中...' : '离开家庭'}</Text>
                </View>
              </View>
            </View>
          </SectionCard>

          <SectionCard title='成员'>
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

          <SectionCard title='邀请成员'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                value={inviteEmail}
                placeholder='输入成员邮箱'
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
                        backgroundColor: active ? '#27272a' : colors.surfaceMuted,
                        textAlign: 'center',
                      }}
                    >
                      <Text style={{ fontSize: '13px', color: active ? colors.text : colors.textMuted }}>
                        {role === 'admin' ? '管理员邀请' : '成员邀请'}
                      </Text>
                    </View>
                  )
                })}
              </View>
              <View onClick={handleInvite} style={{ ...primaryButtonStyle, opacity: !inviteEmail.trim() || inviteMember.isPending ? 0.7 : 1 }}>
                <Text style={{ fontSize: '14px', color: colors.accentText, fontWeight: 600 }}>{inviteMember.isPending ? '发送中...' : '发送邀请'}</Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title='待处理邀请'>
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
                        截止 {invite.expires_at}
                      </Text>
                    </View>
                    <View onClick={() => cancelInvite.mutate(invite.id)} style={{ ...secondaryButtonStyle, minHeight: '36px', padding: '8px 12px', opacity: cancelInvite.isPending ? 0.7 : 1 }}>
                      <Text style={{ fontSize: '12px', color: colors.text }}>取消</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title='没有待处理邀请' description='新发送的家庭邀请会展示在这里。' />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
