import path from 'node:path'

import { defineConfig } from '@tarojs/cli'

const appRoot = process.cwd()
const repoRoot = path.resolve(appRoot, '..')
const sharedApiRoot = path.resolve(repoRoot, 'packages', 'shared-api', 'src')

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
    '@': path.resolve(appRoot, 'src'),
    '@wardrowbe/shared-api': sharedApiRoot,
  },
  plugins: ['@tarojs/plugin-platform-weapp'],
  mini: {
    compile: {
      include: [sharedApiRoot],
    },
  },
})
