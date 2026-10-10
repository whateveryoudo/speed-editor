import type { SpeedEditorPlugin } from '@speed-editor/shared'

/**
 * 流程图插件（空壳）。
 * 接入方式与 extension-mind 相同，见 extension-mind/README.md。
 */
export function createFlowPlugin(): SpeedEditorPlugin {
  return {
    name: 'flow',
    extensions: [],
  }
}
