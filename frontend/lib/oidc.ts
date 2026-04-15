export function normalizeOidcIssuerUrl(issuerUrl: string): string {
  return issuerUrl.replace(/\/+$/, '')
}

export function buildOidcWellKnownUrl(issuerUrl: string): string {
  return `${normalizeOidcIssuerUrl(issuerUrl)}/.well-known/openid-configuration`
}
