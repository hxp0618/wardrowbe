export type ApiQueryParamValue = string | number | boolean

export type ApiQueryParams = Record<string, ApiQueryParamValue | null | undefined>

export type ApiHeaders = Record<string, string>

export interface ApiTransportResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export interface ApiTransportRequest {
  url: string
  method: string
  headers: ApiHeaders
  body?: string | null
}

export type ApiTransportAdapter = (
  request: ApiTransportRequest
) => Promise<ApiTransportResponse>

export interface ApiRequestOptions {
  params?: ApiQueryParams
  headers?: ApiHeaders
}

export interface ApiRuntimeBindings {
  getAccessToken?: () => string | null | undefined
  getAcceptLanguage?: () => string | null | undefined
  getBasePath?: () => string | null | undefined
}

export interface ApiClientConfig {
  adapter: ApiTransportAdapter
  basePath?: string
  bindings?: ApiRuntimeBindings
  getGenericErrorMessage?: () => string
  getNetworkErrorMessage?: () => string
  getOfflineErrorMessage?: () => string
  isOnline?: () => boolean
}

export interface ApiClient {
  get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T>
  post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T>
  patch<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T>
  delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T>
  delete<T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Promise<T>
}
