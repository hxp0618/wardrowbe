import { describe, expect, it } from 'vitest'

import { buildOidcWellKnownUrl } from '@/lib/oidc'

describe('OIDC helpers', () => {
  it('builds the well-known URL without duplicating slashes', () => {
    expect(buildOidcWellKnownUrl('https://issuer.example.com')).toBe(
      'https://issuer.example.com/.well-known/openid-configuration',
    )
    expect(buildOidcWellKnownUrl('https://issuer.example.com/')).toBe(
      'https://issuer.example.com/.well-known/openid-configuration',
    )
  })
})
