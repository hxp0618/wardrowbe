import { describe, expect, it } from 'vitest'

import lockfile from '../package-lock.json'

describe('frontend package lockfile', () => {
  it('includes parcel watcher native packages for linux containers', () => {
    const packages = lockfile.packages ?? {}

    expect(packages['node_modules/@parcel/watcher']).toBeDefined()
    expect(packages['node_modules/@parcel/watcher-linux-arm64-musl']).toBeDefined()
    expect(packages['node_modules/@parcel/watcher-linux-x64-musl']).toBeDefined()
  })
})
