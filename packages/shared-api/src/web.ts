import type { ApiTransportAdapter, ApiTransportResponse } from './types'

export type WebFetchCredentials = 'omit' | 'same-origin' | 'include'

export interface WebFetchInit {
  method?: string
  headers?: Record<string, string>
  body?: string | null
  credentials?: WebFetchCredentials
}

export type FetchLike = (
  input: string,
  init?: WebFetchInit
) => Promise<ApiTransportResponse>

export interface WebFetchAdapterOptions {
  fetch?: FetchLike
  credentials?: WebFetchCredentials
}

function resolveFetch(options?: WebFetchAdapterOptions | FetchLike): FetchLike {
  if (typeof options === 'function') {
    return options
  }

  const runtime = globalThis as { fetch?: FetchLike }
  if (options?.fetch) {
    return options.fetch
  }
  if (runtime.fetch) {
    return runtime.fetch
  }

  throw new Error('fetch is not available in this runtime')
}

function resolveCredentials(options?: WebFetchAdapterOptions | FetchLike): WebFetchCredentials | undefined {
  return typeof options === 'function' ? undefined : options?.credentials
}

export function createWebFetchAdapter(options?: WebFetchAdapterOptions | FetchLike): ApiTransportAdapter {
  const activeFetch = resolveFetch(options)
  const credentials = resolveCredentials(options)

  return (request) =>
    activeFetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      credentials,
    })
}
