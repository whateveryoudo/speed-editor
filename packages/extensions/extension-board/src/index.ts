import type { SpeedEditorPlugin } from '@speed-editor/shared'
import { BoardNode, type BoardAttrs } from './BoardNode'
import { DEFAULT_BOARD_DATA } from './defaultData'
import BoardWrapper from './BoardWrapper.vue'

export { BoardNode, DEFAULT_BOARD_DATA, BoardWrapper }
export type { BoardAttrs }

export interface BoardPluginOptions {
  /** 默认卡片高度，默认 480 */
  defaultHeight?: number
  /** 是否启用快捷插入菜单 */
  quickInsert?: boolean
}

export function createBoardPlugin(options: BoardPluginOptions = {}): SpeedEditorPlugin {
  const defaultHeight = options.defaultHeight || 480

  return {
    name: 'board',
    extensions: [BoardNode],
    insertItems: [
      {
        key: 'board',
        label: '画板',
        shortcut: '/hb',
        description: '可插入图形、连线和图片等',
        order: 15,
        action: (editor: any) => {
          editor?.chain().focus().insertBoard({ height: defaultHeight }).run()
        },
      },
    ],
  }
}
