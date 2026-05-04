import type { CSSProperties } from 'react'
import { Text, View } from '@tarojs/components'

import { colors } from './ui-theme'

type CompactOptionGroupProps = {
  activeIndex: number
  options: string[]
  onChange: (nextIndex: number) => void
  style?: CSSProperties
}

function getOptionStyle(active: boolean): CSSProperties {
  return {
    minHeight: '44px',
    padding: '0 12px',
    borderRadius: '999px',
    backgroundColor: active ? colors.surfaceSelected : colors.surface,
    border: active ? `1px solid ${colors.borderStrong}` : `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

export function CompactOptionGroup(props: CompactOptionGroupProps) {
  return (
    <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', ...props.style }}>
      {props.options.map((option, index) => {
        const active = index === props.activeIndex
        return (
          <View
            key={`${option}-${index}`}
            ariaRole='button'
            ariaLabel={option}
            onClick={() => props.onChange(index)}
            style={getOptionStyle(active)}
          >
            <Text style={{ fontSize: '12px', color: active ? colors.text : colors.textMuted }}>
              {option}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
