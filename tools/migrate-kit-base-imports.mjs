#!/usr/bin/env node
/**
 * 一次性脚本：将 kit-base 内 @st/* 引用迁移为包内 @kb/* 或 workspace 包
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(fileURLToPath(new URL('.', import.meta.url)), '../packages/kit-base/src')

const SIMPLE_REPLACEMENTS = [
  [/@st\/hooks\/useActive/g, '@speed-editor/composables'],
  [/@st\/hooks\/useMenuButtonEvents/g, '@speed-editor/composables'],
  [/@st\/hooks\/useAttributes/g, '@speed-editor/composables'],
  [/@st\/hooks\/useSpeedEditorContext/g, '@speed-editor/composables'],
  [/@st\/hooks\/useBubble/g, '@kb/hooks/useBubble'],
  [/@st\/hooks\/useAiAssistant/g, '@kb/hooks/useAiAssistant'],
  [/@st\/helpers\/registKeyMap/g, '@speed-editor/shared'],
  [/@st\/presets/g, '@speed-editor/shared'],
  [/@st\/type/g, '@speed-editor/shared'],
  [/@st\/components\/colorPicker/g, '@kb/components/colorPicker'],
  [/@st\/components\/emojiPicker/g, '@kb/components/emojiPicker'],
  [/@st\/components\/dragHandle/g, '@kb/components/dragHandle'],
  [/@st\/menus/g, '@kb/menus'],
  [/@st\/bubbleMenus/g, '@kb/bubbleMenus'],
  [/@st\/assets/g, '@kb/assets'],
  [/@st\/prose-utils\/text/g, '@kb/prose-utils/text'],
  [/@st\/prose-utils/g, '@kb/prose-utils'],
  [/@st\/helpers\/lru-cache/g, '@kb/helpers/lru-cache'],
  [/@st\/helpers\/wordImport/g, '@speed-editor/document-io'],
  [/@st\/helpers\/markdownImport/g, '@speed-editor/document-io'],
  [/@st\/helpers\/speedImport/g, '@speed-editor/document-io'],
  [/@st\/helpers\/wordExport/g, '@speed-editor/document-io'],
  [/@st\/helpers\/markdownExport/g, '@speed-editor/document-io'],
  [/@st\/helpers\/speedExport/g, '@speed-editor/document-io'],
  [/@st\/helpers\/imageExport/g, '@speed-editor/document-io'],
  [/@st\/helpers\/type/g, '@speed-editor/document-io'],
  [/@st\/helpers\/fileDownload/g, '@speed-editor/document-io'],
  [/@st\/helpers\/markdown-to-json/g, '@speed-editor/document-io'],
]

const EXTENSION_IMPORTS = [
  /import \{ Title \} from ['"]@st\/extensions\/title['"];?\n/g,
  /import \{ Title \} from ['"]@kb\/extensions\/title['"];?\n/g,
  /import \{ BulletList as BulletListExtension \} from ['"]@st\/extensions\/bulletList['"];?\n/g,
  /import \{ OrderedList as OrderedListExtension \} from ['"]@st\/extensions\/orderedList['"];?\n/g,
  /import \{ TaskList as TaskListExtension \} from ['"]@st\/extensions\/taskList['"];?\n/g,
  /import \{ Blockquote as BlockquoteExtension \} from ['"]@st\/extensions\/blockquote['"];?\n/g,
  /import \{ Link \} from ['"]@st\/extensions\/link['"];?\n/g,
  /import \{ Tag \} from ['"]@st\/extensions\/tag['"];?\n/g,
  /import \{ Attachment \} from ['"]@st\/extensions\/attachment['"];?\n/g,
  /import \{ CodeBlock \} from ['"]@st\/extensions\/codeBlock['"];?\n/g,
  /import \{ Callout \} from ['"]@st\/extensions\/callout['"];?\n/g,
  /import \{ Image \} from ['"]@st\/extensions\/image['"];?\n/g,
]

const EXTENSION_USAGE = [
  ['Title.name', "'title'"],
  ['BulletListExtension.name', "'bulletList'"],
  ['OrderedListExtension.name', "'orderedList'"],
  ['TaskListExtension.name', "'taskList'"],
  ['BlockquoteExtension.name', "'blockquote'"],
  ['Link.name', "'link'"],
  ['Tag.name', "'tag'"],
  ['Attachment.name', "'attachment'"],
  ['CodeBlock.name', "'codeBlock'"],
  ['Callout.name', "'callout'"],
  ['Image.name', "'image'"],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(vue|tsx?|jsx?)$/.test(entry.name)) files.push(full)
  }
  return files
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  for (const [from, to] of SIMPLE_REPLACEMENTS) {
    content = content.replace(from, to)
  }

  for (const re of EXTENSION_IMPORTS) {
    content = content.replace(re, '')
  }

  for (const [from, to] of EXTENSION_USAGE) {
    content = content.split(from).join(to)
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    return true
  }
  return false
}

const files = walk(ROOT)
let count = 0
for (const f of files) {
  if (migrateFile(f)) count++
}
console.log(`Migrated ${count} / ${files.length} files under kit-base/src`)

// useAiAssistant hook fix
const aiPath = path.join(ROOT, 'hooks/useAiAssistant.ts')
if (fs.existsSync(aiPath)) {
  let ai = fs.readFileSync(aiPath, 'utf8')
  ai = ai.replace(/@st\/hooks\/useSpeedEditorContext/g, '@speed-editor/composables')
  fs.writeFileSync(aiPath, ai)
}
