#!/usr/bin/env node
/**
 * 构建 packages 下所有 lib（产出 dist），或指定单个包。
 *
 * 用法:
 *   pnpm build:lib
 *   pnpm build:lib -- schema
 *   pnpm build:lib -- kit-base
 *   pnpm build:lib -- @speed-editor/extension-kit
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const SCOPE = '@speed-editor/'

function resolveFilter(raw) {
  const name = raw.trim()
  if (!name) return null
  if (name.startsWith('@')) return name
  return `${SCOPE}${name}`
}

const args = process.argv.slice(2).filter((a) => a !== '--')
const pkgArg = args[0]

const turboArgs = ['run', 'build']

if (pkgArg) {
  const filter = resolveFilter(pkgArg)
  // `pkg...`：自身 + workspace 依赖，保证 dist 拓扑正确
  turboArgs.push(`--filter=${filter}...`)
  console.log(`\n→ build lib: ${filter} (+deps)\n`)
} else {
  turboArgs.push('--filter=./packages/*', '--filter=./packages/extensions/*')
  console.log('\n→ build lib: all packages/\n')
}

const result = spawnSync('pnpm', ['exec', 'turbo', ...turboArgs], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
