export { default as LiteEditor } from './LiteEditor.vue'
export { createLiteEditorPlugins } from './createLiteEditorPlugins'
export { liteLayout, litePreset } from './preset'
export { resolveToolbarKeys, resolveBubbleMenus } from '@speed-editor/shared'
export type { SpeedEditorPlugin } from '@speed-editor/shared'
export {
  Extension,
  Node,
  Mark,
  mergeAttributes,
  Editor,
  type ExtensionConfig,
  type NodeConfig,
  type MarkConfig,
  type Extensions,
  type JSONContent,
} from '@speed-editor/base-editor'
