import path from 'node:path'

import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'wardrowbe-wechat-miniapp',
  date: '2026-04-22',
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: {
    type: 'webpack5',
  },
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
    '@wardrowbe/shared-api': path.resolve(__dirname, '..', '..', 'packages', 'shared-api', 'src'),
  },
  plugins: ['@tarojs/plugin-platform-weapp'],
  mini: {},
})
