import { View } from '@tarojs/components'

import { colors } from './ui-theme'

type UISkeletonProps = {
  height?: string
  width?: string
  radius?: string
}

export function UISkeleton(props: UISkeletonProps) {
  return (
    <View
      style={{
        width: props.width || '100%',
        height: props.height || '16px',
        borderRadius: props.radius || '10px',
        backgroundColor: colors.surfaceMuted,
      }}
    />
  )
}
