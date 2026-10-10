#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(fileURLToPath(new URL('.', import.meta.url)), '../packages/extensions/extension-kit/src')

const REPLACEMENTS = [
  [/@st\/hooks\/useActive/g, '@speed-editor/composables'],
  [/@st\/hooks\/useMenuButtonEvents/g, '@speed-editor/composables'],
  [/@st\/hooks\/useAttributes/g, '@speed-editor/composables'],
  [/@st\/hooks\/useSpeedEditorContext/g, '@speed-editor/composables'],
  [/@st\/hooks\/useBubble/g, '@ek/hooks/useBubble'],
  [/@st\/hooks\/useFloatingPopup/g, '@ek/hooks/useFloatingPopup'],
  [/@st\/hooks\/useEdgeResize/g, '@ek/hooks/useEdgeResize'],
  [/@st\/helpers\/json/g, '@ek/helpers/json'],
  [/@st\/helpers\/copy-to-clipboard/g, '@ek/helpers/copy-to-clipboard'],
  [/@st\/enums\/constants/g, '@ek/enums/constants'],
  [/@st\/enums\/dict/g, '@speed-editor/shared'],
  [/@st\/prose-utils\/file/g, '@ek/prose-utils/file'],
  [/@st\/prose-utils/g, '@ek/prose-utils'],
  [/@st\/menus/g, '@speed-editor/kit-base/menus'],
  [/@st\/components\/wrappers/g, '@ek/components/wrappers'],
  [/@st\/assets/g, '@ek/assets'],
  [/@st\/type/g, '@speed-editor/shared'],
  [/import \{ IUser \} from ['"]@st\/types\/user['"];?\n/g, ''],
  [/IUser\['id'\]/g, 'string | number'],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(vue|tsx?|jsx?|less)$/.test(entry.name)) files.push(full)
  }
  return files
}

let count = 0
for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [from, to] of REPLACEMENTS) {
    content = content.replace(from, to)
  }
  if (content !== original) {
    fs.writeFileSync(file, content)
    count++
  }
}
console.log(`Migrated ${count} files in extension-kit`)
