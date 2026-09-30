import { StarterKit } from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Title } from './nodes/title'
import { Image } from './nodes/image'
import { importTableExtensions } from './nodes/table'
import { importLink } from './marks/link'
import { Callout } from './nodes/callout'
import { Attachment } from './nodes/attachment'
import { Tag } from './nodes/tag'
import { CodeBlock } from './nodes/codeBlock'
import { Mind } from './nodes/mind'
import { Loading } from './nodes/loading'
import { DocumentKnowledge } from './nodes/document'
import { BackgroundColor } from './marks/backgroundColor'
import { FontSize } from './marks/fontSize'
import { FontFamily } from './marks/fontFamily'
import { Indent } from './marks/indent'

/**
 * StarterKit v3 自带 link / codeBlock，导入时关掉，改用本包契约扩展。
 */
const importStarterKit = StarterKit.configure({
  link: false,
  codeBlock: false,
})

/** 知识库文档根：关掉默认 document，改用 title + block+ */
const knowledgeStarterKit = StarterKit.configure({
  link: false,
  codeBlock: false,
  document: false,
})

/** 文本样式相关（字号/字体/前景/背景 + textStyle mark） */
const textStyleExtensions = [
  TextStyle,
  Color,
  BackgroundColor,
  FontSize,
  FontFamily,
]

/** 带 NodeView 的自定义块/行内节点（无 UI 契约版） */
const customNodes = [Callout, Attachment, Tag, CodeBlock, Mind, Loading]

/**
 * 轻量文档（首页等）
 */
export const liteKit = [importStarterKit, Title, importLink, ...textStyleExtensions]

/**
 * 导入 / Markdown→JSON 子集：常见节点即可。
 */
export const importKit = [
  importStarterKit,
  Image,
  importLink,
  ...importTableExtensions,
  Callout,
  Attachment,
  Tag,
  CodeBlock,
  ...textStyleExtensions,
  Indent,
]

/**
 * 知识库全量契约：与前端 knowledge 文档 JSON 对齐（服务端 generateHTML / toYdoc）。
 */
export const knowledgeKit = [
  knowledgeStarterKit,
  DocumentKnowledge,
  Title,
  Image,
  importLink,
  ...importTableExtensions,
  ...customNodes,
  ...textStyleExtensions,
  Indent.configure({
    types: ['paragraph', 'heading', 'listItem'],
    minIndent: 0,
    maxIndent: 8,
  }),
]

/** 导出用（与 knowledgeKit 对齐） */
export const exportKit = knowledgeKit
