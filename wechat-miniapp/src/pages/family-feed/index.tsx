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
import { useI18n } from '../../lib/i18n'
import Taro from '@tarojs/taro'

export default function FamilyFeedPage() {
  const canRender = useAuthGuard()
  const { t, tf } = useI18n()
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
    <PageShell title={t('page_family_feed_title')} subtitle={t('page_family_feed_subtitle')} navKey='settings'>
      {!family ? (
        <SectionCard title={t('family_feed_status_title')}>
          <EmptyState
            title={t('family_feed_missing_title')}
            description={t('family_feed_missing_description')}
            action={
              <View onClick={() => Taro.navigateTo({ url: '/pages/family/index' })} style={secondaryButtonStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('family_feed_go_family')}</Text>
              </View>
            }
          />
        </SectionCard>
      ) : (
        <>
          <View style={{ display: 'flex', gap: '12px' }}>
            <StatCard label={t('family_feed_stat_members_label')} value={String(family.members.length)} hint={t('family_feed_stat_members_hint')} />
            <StatCard label={t('family_feed_stat_outfits_label')} value={String(data?.total ?? 0)} hint={t('family_feed_stat_outfits_hint')} />
          </View>

          <SectionCard title={t('family_feed_member_picker_title')}>
            <Picker
              mode='selector'
              range={memberOptions}
              value={memberIndex}
              onChange={(event) => setMemberIndex(Number(event.detail.value))}
            >
              <View style={inputStyle}>
                <Text style={{ fontSize: '14px', color: colors.text }}>
                  {memberOptions[memberIndex] ?? t('family_feed_member_placeholder')}
                </Text>
              </View>
            </Picker>
          </SectionCard>

          {member ? (
            <SectionCard title={t('family_feed_member_summary_title')}>
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
                  {t('family_feed_member_summary_description')}
                </Text>
              </View>
            </SectionCard>
          ) : null}

          <SectionCard title={t('family_feed_outfits_title')} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('family_feed_outfits_count', { count: data?.total ?? 0 })}</Text>}>
            {isLoading ? (
              <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('family_feed_loading')}</Text>
            ) : data?.outfits?.length ? (
              <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.outfits.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} badge={member?.display_name} />
                ))}
              </View>
            ) : (
              <EmptyState
                title={t('family_feed_empty_title')}
                description={t('family_feed_empty_description')}
                action={
                  <View onClick={() => Taro.switchTab({ url: '/pages/outfits/index' })} style={secondaryButtonStyle}>
                    <Text style={{ fontSize: '14px', color: colors.text }}>{t('family_feed_view_my_outfits')}</Text>
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
