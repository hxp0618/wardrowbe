import { Picker, Text, View } from '@tarojs/components'
import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { StatCard } from '../../components/stat-card'
import { UIBadge } from '../../components/ui-badge'
import { colors, inputStyle, secondaryButtonStyle } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useFamily } from '../../hooks/use-family'
import { useFamilyOutfits } from '../../hooks/use-outfits'
import { formatRoleLabel } from '../../lib/display'
import Taro from '@tarojs/taro'

export default function FamilyFeedPage() {
  const canRender = useAuthGuard()
  const { data: family } = useFamily()
  const memberOptions = useMemo(
    () =>
      family?.members.map((member) => `${member.display_name} (${formatRoleLabel(member.role)})`) ??
      [],
    [family]
  )
  const [memberIndex, setMemberIndex] = useState(0)
  const member = family?.members[memberIndex]
  const { data, isLoading } = useFamilyOutfits(member?.id, 1, 20)

  if (!canRender) {
    return null
  }

  return (
    <PageShell title='家庭动态' subtitle='查看家庭成员的穿搭' navKey='settings'>
      {!family ? (
        <SectionCard title='家庭状态'>
          <EmptyState
            title='你还不在家庭中'
            description='先去家庭页创建或加入家庭，再回来查看家庭动态。'
            action={
              <View onClick={() => Taro.navigateTo({ url: '/pages/family/index' })} style={secondaryButtonStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>去家庭页</Text>
              </View>
            }
          />
        </SectionCard>
      ) : (
        <>
          <View style={{ display: 'flex', gap: '12px' }}>
            <StatCard label='家庭成员' value={String(family.members.length)} hint='可切换查看不同成员' />
            <StatCard label='穿搭总数' value={String(data?.total ?? 0)} hint='当前筛选成员的动态' />
          </View>

          <SectionCard title='成员选择'>
            <Picker
              mode='selector'
              range={memberOptions}
              value={memberIndex}
              onChange={(event) => setMemberIndex(Number(event.detail.value))}
            >
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>
                  {memberOptions[memberIndex] ?? '请选择成员'}
                </Text>
              </View>
            </Picker>
          </SectionCard>

          {member ? (
            <SectionCard title='成员摘要'>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <View>
                    <Text style={{ display: 'block', fontSize: '16px', color: colors.text, fontWeight: 600 }}>
                      {member.display_name}
                    </Text>
                    <Text style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: colors.textMuted }}>
                      {member.email}
                    </Text>
                  </View>
                  <UIBadge label={formatRoleLabel(member.role)} tone={member.role === 'admin' ? 'warning' : 'default'} />
                </View>
                <Text style={{ fontSize: '12px', color: colors.textSoft }}>
                  在这里可以浏览该成员最近的公开穿搭动态与组合记录。
                </Text>
              </View>
            </SectionCard>
          ) : null}

          <SectionCard title='穿搭动态' extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{data?.total ?? 0} 套</Text>}>
            {isLoading ? (
              <Text style={{ fontSize: '14px', color: colors.textMuted }}>正在加载家庭动态...</Text>
            ) : data?.outfits?.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.outfits.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} badge={member?.display_name} />
                ))}
              </View>
            ) : (
              <EmptyState
                title='该成员还没有穿搭记录'
                description='接受推荐或手动创建穿搭后，这里会显示最新动态。'
                action={
                  <View onClick={() => Taro.switchTab({ url: '/pages/outfits/index' })} style={secondaryButtonStyle}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>查看我的穿搭</Text>
                  </View>
                }
              />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
