import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import * as dateUtils from '@/lib/date-utils'
import * as folderUtils from '@/lib/folder-utils'
import * as reorderUtils from '@/lib/reorder-utils'
import * as temperatureUtils from '@/lib/temperature'
import * as typeExports from '@/lib/types'

describe('shared-domain exports', () => {
  it('declares shared-domain subpath exports and points frontend wrappers at those subpaths', () => {
    const sharedDomainPackage = JSON.parse(
      readFileSync(
        resolve(process.cwd(), '../packages/shared-domain/package.json'),
        'utf8',
      ),
    ) as {
      exports: Record<string, string>
    }

    expect(sharedDomainPackage.exports['./date-utils']).toBe('./src/date-utils.ts')
    expect(sharedDomainPackage.exports['./temperature']).toBe('./src/temperature.ts')
    expect(sharedDomainPackage.exports['./reorder-utils']).toBe('./src/reorder-utils.ts')
    expect(sharedDomainPackage.exports['./folder-utils']).toBe('./src/folder-utils.ts')
    expect(sharedDomainPackage.exports['./types']).toBe('./src/types.ts')

    const dateUtilsSource = readFileSync(
      resolve(process.cwd(), 'lib/date-utils.ts'),
      'utf8',
    )
    const temperatureSource = readFileSync(
      resolve(process.cwd(), 'lib/temperature.ts'),
      'utf8',
    )
    const reorderSource = readFileSync(
      resolve(process.cwd(), 'lib/reorder-utils.ts'),
      'utf8',
    )
    const folderSource = readFileSync(
      resolve(process.cwd(), 'lib/folder-utils.ts'),
      'utf8',
    )
    const typesSource = readFileSync(
      resolve(process.cwd(), 'lib/types.ts'),
      'utf8',
    )

    expect(dateUtilsSource).toContain("@wardrowbe/shared-domain/date-utils")
    expect(temperatureSource).toContain("@wardrowbe/shared-domain/temperature")
    expect(reorderSource).toContain("@wardrowbe/shared-domain/reorder-utils")
    expect(folderSource).toContain("@wardrowbe/shared-domain/folder-utils")
    expect(typesSource).toContain("@wardrowbe/shared-domain/types")
    expect(typesSource).not.toContain("export * from '@wardrowbe/shared-domain'")
  })

  it('keeps taxonomy local to frontend types and does not leak utility helpers there', () => {
    expect(Array.isArray(typeExports.CLOTHING_COLORS)).toBe(true)
    expect(Array.isArray(typeExports.CLOTHING_TYPES)).toBe(true)
    expect(Array.isArray(typeExports.OCCASIONS)).toBe(true)

    expect('toLocalISODate' in typeExports).toBe(false)
    expect('reorderByIds' in typeExports).toBe(false)
    expect('reorderFoldersLocally' in typeExports).toBe(false)
    expect('displayValue' in typeExports).toBe(false)
  })

  it('preserves temperature conversion and formatting behavior', () => {
    expect(temperatureUtils.toCelsius(68)).toBeCloseTo(20)
    expect(temperatureUtils.displayValue(20.4, 'fahrenheit')).toBe(69)
    expect(temperatureUtils.formatTemp(20.4, 'celsius')).toBe('20°C')
  })
})
