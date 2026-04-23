import path from 'node:path'

import { defineConfig } from '@tarojs/cli'

const appRoot = process.cwd()
const repoRoot = path.resolve(appRoot, '..')
const sharedApiRoot = path.resolve(repoRoot, 'packages', 'shared-api', 'src')
const sharedDomainRoot = path.resolve(repoRoot, 'packages', 'shared-domain', 'src')

export default defineConfig({
  projectName: 'wardrowbe-wechat-miniapp',
  date: '2026-04-22',
  sourceRoot: 'src',
  outputRoot: 'dist',
  env: {
    TARO_APP_API_BASE_URL: JSON.stringify(
      process.env.TARO_APP_API_BASE_URL || 'http://127.0.0.1:8000'
    ),
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: {
      enable: false,
    },
  },
  alias: {
    '@': path.resolve(appRoot, 'src'),
    '@wardrowbe/shared-api': sharedApiRoot,
    '@wardrowbe/shared-domain': sharedDomainRoot,
  },
  plugins: ['@tarojs/plugin-platform-weapp'],
  mini: {
    compile: {
      include: [sharedApiRoot, sharedDomainRoot],
    },
  },
})
