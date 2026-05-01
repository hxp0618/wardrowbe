import Taro from '@tarojs/taro'

import { buildBusinessApiUrl, normalizeBusinessApiResourceUrls } from './app-config'
import { resolveAccessToken } from './api'

type UploadApiFileOptions = {
  endpoint: string
  filePath: string
  name?: string
  formData?: Record<string, string>
}

function parseUploadData(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data
  }

  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

export async function uploadApiFile<T = unknown>(
  options: UploadApiFileOptions
): Promise<T> {
  const accessToken = resolveAccessToken()
  const header: Record<string, string> = {
    'Accept-Language': 'zh-CN',
  }

  if (accessToken) {
    header.Authorization = `Bearer ${accessToken}`
  }

  const response = await Taro.uploadFile({
    url: buildBusinessApiUrl(options.endpoint),
    filePath: options.filePath,
    name: options.name || 'file',
    header,
    formData: options.formData,
  })

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error('上传失败，请稍后重试')
  }

  return normalizeBusinessApiResourceUrls(parseUploadData(response.data)) as T
}
