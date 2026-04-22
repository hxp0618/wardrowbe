import { Picker, Text, View } from '@tarojs/components'
import { useMemo, useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { OutfitCard } from '../../components/outfit-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useFamily } from '../../hooks/use-family'
import { useFamilyOutfits } from '../../hooks/use-outfits'

export default function FamilyFeedPage() {
  const canRender = useAuthGuard()
  const { data: family } = useFamily()
  const memberOptions = useMemo(
    () => family?.members.map((member) => `${member.display_name} (${member.role})`) ?? [],
    [family]
  )
  const [memberIndex, setMemberIndex] = useState(0)
  const member = family?.members[memberIndex]
  const { data, isLoading } = useFamilyOutfits(member?.id, 1, 20)

  if (!canRender) {
    return null
  }

  return (
    <PageShell title='家庭动态' subtitle='按成员查看家庭内的穿搭记录和反馈结果。'>
      {!family ? (
        <SectionCard title='家庭状态'>
          <EmptyState title='你还不在家庭中' description='先去家庭页创建或加入家庭，再回来查看家庭动态。' />
        </SectionCard>
      ) : (
        <>
          <SectionCard title='成员选择'>
            <Picker
              mode='selector'
              range={memberOptions}
              value={memberIndex}
              onChange={(event) => setMemberIndex(Number(event.detail.value))}
            >
              <View
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E5E7EB',
                }}
              >
                <Text style={{ fontSize: '22px', color: '#111827' }}>
                  {memberOptions[memberIndex] ?? '请选择成员'}
                </Text>
              </View>
            </Picker>
          </SectionCard>

          <SectionCard title='穿搭动态' extra={<Text style={{ fontSize: '20px', color: '#6B7280' }}>{data?.total ?? 0} 套</Text>}>
            {isLoading ? (
              <Text style={{ fontSize: '22px', color: '#6B7280' }}>正在加载家庭动态...</Text>
            ) : data?.outfits?.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.outfits.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} badge={member?.display_name} />
                ))}
              </View>
            ) : (
              <EmptyState title='该成员还没有穿搭记录' description='接受推荐或手动创建穿搭后，这里会显示最新动态。' />
            )}
          </SectionCard>
        </>
      )}
    </PageShell>
  )
}
