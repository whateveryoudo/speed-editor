import type { SpeedEditorPlugin, TiptapExtension } from '@speed-editor/shared'
import type { CreateMindPluginOptions } from './types'

/**
 * 思维导图插件（空壳）。
 *
 * 当前不注册任何 Tiptap 扩展或 UI；选型并实现 {@link MindEditorAdapter} 后，
 * 传入 `adapter` 即可启用。参见 `src/example.adapter.ts` 与 README。
 */
export function createMindPlugin(options: CreateMindPluginOptions = {}): SpeedEditorPlugin {
  const { adapter } = options

  if (!adapter) {
    return {
      name: 'mind',
      extensions: [],
    }
  }

  return {
    name: 'mind',
    extensions: (ctx) =>
      adapter.createExtensions(ctx as Record<string, unknown>) as TiptapExtension[],
    insertItems: [
      {
        key: 'mind',
        label: '思维导图',
        order: 20,
      },
    ],
  }
}

export type { MindEditorAdapter, CreateMindPluginOptions } from './types'
