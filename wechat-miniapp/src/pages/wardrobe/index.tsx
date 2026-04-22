import { Button, Input, Picker, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { EmptyState } from '../../components/empty-state'
import { ItemCard } from '../../components/item-card'
import { PageShell } from '../../components/page-shell'
import { SectionCard } from '../../components/section-card'
import { useAuthGuard } from '../../hooks/use-auth-guard'
import { useCreateItemWithImages, useItems, useItemTypes } from '../../hooks/use-items'

export default function WardrobePage() {
  const canRender = useAuthGuard()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeIndex, setTypeIndex] = useState(0)
  const { data: itemTypes } = useItemTypes()
  const typeOptions = ['全部分类', ...(itemTypes ?? []).map((item) => item.type)]
  const activeType = typeIndex === 0 ? undefined : typeOptions[typeIndex]
  const { data, isLoading } = useItems(
    {
      search: search || undefined,
      type: activeType,
      is_archived: false,
      sort_by: 'created_at',
      sort_order: 'desc',
    },
    page,
    20
  )
  const createItem = useCreateItemWithImages()

  if (!canRender) {
    return null
  }

  const handleChooseImages = async () => {
    try {
      const result = await Taro.chooseMedia({
        count: 5,
        mediaType: ['image'],
        sizeType: ['compressed'],
      })
      const filePaths = result.tempFiles.map((file) => file.tempFilePath)

      if (filePaths.length === 0) {
        return
      }

      await createItem.mutateAsync({
        filePaths,
        fields: {
          type: activeType,
        },
      })
      void Taro.showToast({ title: '上传成功', icon: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败'
      void Taro.showToast({ title: message, icon: 'none' })
    }
  }

  return (
    <PageShell
      title='衣橱'
      subtitle='搜索、筛选和上传能力已经接到真实接口，先覆盖最常用的浏览与上新闭环。'
      actions={<Button onClick={handleChooseImages} loading={createItem.isPending}>上传单品</Button>}
    >
      <SectionCard title='筛选'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            value={search}
            placeholder='搜索单品名称'
            onInput={(event) => {
              setSearch(event.detail.value)
              setPage(1)
            }}
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
          <Picker
            mode='selector'
            range={typeOptions}
            value={typeIndex}
            onChange={(event) => {
              setTypeIndex(Number(event.detail.value))
              setPage(1)
            }}
          >
            <View
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E5E7EB',
              }}
            >
              <Text style={{ fontSize: '22px', color: '#111827' }}>{typeOptions[typeIndex]}</Text>
            </View>
          </Picker>
        </View>
      </SectionCard>

      <SectionCard title='单品列表' extra={<Text style={{ fontSize: '20px', color: '#6B7280' }}>{data?.total ?? 0} 件</Text>}>
        {isLoading ? (
          <Text style={{ fontSize: '22px', color: '#6B7280' }}>正在加载单品...</Text>
        ) : data?.items?.length ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
            {data.has_more ? (
              <Button onClick={() => setPage((current) => current + 1)}>加载更多</Button>
            ) : null}
          </View>
        ) : (
          <EmptyState title='衣橱还是空的' description='上传第一件单品后，这里会同步展示后端返回的分析结果和多图信息。' />
        )}
      </SectionCard>
    </PageShell>
  )
}
