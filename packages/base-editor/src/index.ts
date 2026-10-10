export { default as SpeedEditor } from './SpeedEditor.vue'
/** @deprecated 兼容 v1 命名 */
export { default as SpeedTiptapEditor } from './SpeedEditor.vue'
export { MenuBarShell, BubbleMenuBarShell } from '@speed-editor/ui'
export { legacyToolbarButtons, legacyBubbleMenus } from './legacyRegistry'
export { install, setConfig, type GlobalConfig } from './plugin'
export { resolveToolbarKeys, resolveBubbleMenus } from '@speed-editor/shared'
export type {
  EditorLayoutConfig,
  EditorPreset,
  EditorPresetFeatures,
  BubbleMenuKey,
  SpeedEditorPlugin,
} from '@speed-editor/shared'
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
} from '@tiptap/core'
