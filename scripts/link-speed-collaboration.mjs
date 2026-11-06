import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const targetDir = path.resolve(rootDir, 'node_modules/@speed-collaboration')
const repoDir = path.resolve(rootDir, '../speed-collaboration')

const packages = [
  { name: 'core', src: path.resolve(repoDir, 'packages/core') },
  { name: 'vue3', src: path.resolve(repoDir, 'packages/vue3') },
]

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

for (const pkg of packages) {
  const linkPath = path.resolve(targetDir, pkg.name)
  try {
    fs.rmSync(linkPath, { recursive: true, force: true })
  } catch {}
  fs.symlinkSync(pkg.src, linkPath, 'dir')
  console.log(`[link] Linked @speed-collaboration/${pkg.name} -> ${pkg.src}`)
}
