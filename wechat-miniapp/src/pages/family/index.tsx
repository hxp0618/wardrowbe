import { Button, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
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
      await inviteMember.mutateAsync({ email: inviteEmail.trim() })
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
    <PageShell title='家庭' subtitle='支持创建、加入、邀请成员和查看家庭动态。'>
      {!family ? (
        <>
          <SectionCard title='创建家庭'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                value={familyName}
                placeholder='输入家庭名称'
                onInput={(event) => setFamilyName(event.detail.value)}
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
              <Button onClick={handleCreate} loading={createFamily.isPending} disabled={!familyName.trim()}>
                创建家庭
              </Button>
            </View>
          </SectionCard>
          <SectionCard title='加入家庭'>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                value={inviteCode}
                placeholder='输入邀请码'
                onInput={(event) => setInviteCode(event.detail.value.toUpperCase())}
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
              <Button onClick={handleJoin} loading={joinFamily.isPending} disabled={!inviteCode.trim()}>
                加入家庭
              </Button>
            </View>
          </SectionCard>
        </>
      ) : (
        <>
          <SectionCard title={family.name} extra={<Text style={{ fontSize: '20px', color: '#6B7280' }}>{family.members.length} 人</Text>}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Text style={{ fontSize: '22px', color: '#475569' }}>邀请码：{family.invite_code}</Text>
              <View style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button onClick={handleRegenerate} loading={regenerateCode.isPending}>刷新邀请码</Button>
                <Button onClick={() => Taro.navigateTo({ url: '/pages/family-feed/index' })}>看家庭动态</Button>
                <Button onClick={handleLeave} loading={leaveFamily.isPending}>离开家庭</Button>
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
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <View>
                    <Text style={{ display: 'block', fontSize: '22px', color: '#111827' }}>{member.display_name}</Text>
                    <Text style={{ display: 'block', marginTop: '4px', fontSize: '20px', color: '#6B7280' }}>{member.email}</Text>
                  </View>
                  <Text style={{ fontSize: '20px', color: '#334155' }}>{member.role}</Text>
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
              <Button onClick={handleInvite} loading={inviteMember.isPending} disabled={!inviteEmail.trim()}>
                发送邀请
              </Button>
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
                      backgroundColor: '#F8FAFC',
                    }}
                  >
                    <View>
                      <Text style={{ display: 'block', fontSize: '22px', color: '#111827' }}>{invite.email}</Text>
                      <Text style={{ display: 'block', marginTop: '4px', fontSize: '20px', color: '#6B7280' }}>
                        截止 {invite.expires_at}
                      </Text>
                    </View>
                    <Button
                      size='mini'
                      onClick={() => cancelInvite.mutate(invite.id)}
                      loading={cancelInvite.isPending}
                    >
                      取消
                    </Button>
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
