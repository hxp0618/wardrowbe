import type { CSSProperties } from 'react'

import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'

type TapEvent = {
  stopPropagation?: () => void
}

type PreviewableImageProps = {
  ariaLabel?: string
  src: string
  previewCurrent?: string
  previewUrls?: string[]
  mode?: 'aspectFill' | 'aspectFit' | 'widthFix' | 'heightFix' | 'scaleToFill' | 'top' | 'bottom' | 'center' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right'
  style?: CSSProperties
}

export function PreviewableImage(props: PreviewableImageProps) {
  const previewUrls = props.previewUrls?.length ? props.previewUrls : [props.src]
  const current = props.previewCurrent || props.src
  const backgroundSize = props.mode === 'aspectFit' ? 'contain' : 'cover'

  const handlePreview = (event: TapEvent) => {
    event.stopPropagation?.()

    void Taro.previewImage({
      current,
      urls: previewUrls,
    })
  }

  return (
    <View
      ariaLabel={props.ariaLabel ?? '查看图片大图'}
      ariaRole='button'
      onClick={handlePreview}
      style={{
        ...props.style,
        backgroundImage: `url("${props.src}")`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize,
      }}
    />
  )
}
