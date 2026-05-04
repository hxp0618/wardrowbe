import { Text, View } from '@tarojs/components'
import { useMemo, useState } from 'react'

import { getActionButtonStyle } from '../../components/action-style'
import { CompactOptionGroup } from '../../components/compact-option-group'
import { EmptyState } from '../../components/empty-state'
import { FlatMetricGrid, FlatSection } from '../../components/flat-data'
import { OutfitCard } from '../../components/outfit-card'
import { OutfitDetailSheet } from '../../components/outfit-detail-sheet'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { UIBadge } from '../../components/ui-badge'
import { colors } from '../../components/ui-theme'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useFamily } from '../../hooks/use-family'
import { useFamilyOutfits } from '../../hooks/use-outfits'
import { formatOutfitDetailLabel, formatRoleLabel } from '../../lib/display'
import { useI18n } from '../../lib/i18n'
import { navigateToPage } from '../../lib/navigation'
import type { Outfit } from '../../services/types'
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
  const [detailOutfit, setDetailOutfit] = useState<Outfit | null>(null)
  const member = family?.members[memberIndex]
  const { data, isLoading } = useFamilyOutfits(member?.id, 1, 20)

  if (!canRender) {
    return null
  }

  const scrollToSection = (selector: string) => {
    void Taro.pageScrollTo({ selector, duration: 240 })
  }

  return (
    <PageShell title={t('page_family_feed_title')} subtitle={t('page_family_feed_subtitle')} navKey='settings'>
      {!family ? (
        <SectionCard compact title={t('family_feed_status_title')}>
          <EmptyState
            embedded
            title={t('family_feed_missing_title')}
            description={t('family_feed_missing_description')}
            action={
              <View ariaRole='button' ariaLabel={t('family_feed_go_family')} onClick={() => navigateToPage('/pages/family/index')} style={getActionButtonStyle()}>
                <Text style={{ fontSize: '14px', color: colors.text }}>{t('family_feed_go_family')}</Text>
              </View>
            }
          />
        </SectionCard>
      ) : (
        <>
          <FlatMetricGrid
            metrics={[
              {
                label: t('family_feed_stat_members_label'),
                value: String(family.members.length),
                hint: t('family_feed_stat_members_hint'),
                onClick: () => scrollToSection('#family-feed-members'),
              },
              {
                label: t('family_feed_stat_outfits_label'),
                value: String(data?.total ?? 0),
                hint: t('family_feed_stat_outfits_hint'),
                onClick: () => scrollToSection('#family-feed-outfits'),
              },
            ]}
          />

          <View id='family-feed-members'>
            <SectionCard compact title={t('family_feed_member_picker_title')}>
              {memberOptions.length ? (
                <CompactOptionGroup
                  activeIndex={memberIndex}
                  options={memberOptions}
                  onChange={setMemberIndex}
                />
              ) : (
                <Text style={{ fontSize: '13px', color: colors.textMuted }}>
                  {t('family_feed_member_placeholder')}
                </Text>
              )}
              {member ? (
                <View style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${colors.border}` }}>
                  <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
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
              ) : null}
            </SectionCard>
          </View>

          <View id='family-feed-outfits'>
            <FlatSection title={t('family_feed_outfits_title')} extra={<Text style={{ fontSize: '12px', color: colors.textMuted }}>{tf('family_feed_outfits_count', { count: data?.total ?? 0 })}</Text>}>
              {isLoading ? (
                <Text style={{ fontSize: '14px', color: colors.textMuted }}>{t('family_feed_loading')}</Text>
              ) : data?.outfits?.length ? (
                <View style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.outfits.map((outfit) => (
                    <View
                      key={outfit.id}
                      ariaRole='button'
                      ariaLabel={formatOutfitDetailLabel(outfit)}
                      onClick={() => setDetailOutfit(outfit)}
                    >
                      <OutfitCard outfit={outfit} badge={member?.display_name} />
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  embedded
                  title={t('family_feed_empty_title')}
                  description={t('family_feed_empty_description')}
                  action={
                    <View ariaRole='button' ariaLabel={t('family_feed_view_my_outfits')} onClick={() => Taro.switchTab({ url: '/pages/outfits/index' })} style={getActionButtonStyle()}>
                      <Text style={{ fontSize: '14px', color: colors.text }}>{t('family_feed_view_my_outfits')}</Text>
                    </View>
                  }
                />
              )}
            </FlatSection>
          </View>
        </>
      )}
      <OutfitDetailSheet outfit={detailOutfit} visible={!!detailOutfit} onClose={() => setDetailOutfit(null)} />
    </PageShell>
  )
}
