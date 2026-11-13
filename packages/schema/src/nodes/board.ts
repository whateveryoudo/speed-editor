import { Node, mergeAttributes } from '@tiptap/core'

/**
 * 画板默认数据（默认空白画板，由用户在画布中自由绘制）
 */
export const DEFAULT_BOARD_DATA: any[] = []

/**
 * 无 UI 画板节点契约
 */
export const Board = Node.create({
  name: 'board',
  group: 'block',
  selectable: true,
  atom: true,
  draggable: true,
  inline: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-id'),
        renderHTML: (attrs) => (attrs.id ? { 'data-id': attrs.id } : {}),
      },
      height: {
        default: 480,
        parseHTML: (el) => {
          const raw = (el as HTMLElement).getAttribute('data-height')
          const n = raw ? Number(raw) : 480
          return Number.isFinite(n) ? n : 480
        },
      },
      data: {
        default: DEFAULT_BOARD_DATA,
        parseHTML: (el) => {
          const raw = (el as HTMLElement).getAttribute('data-board-data')
          if (!raw) return DEFAULT_BOARD_DATA
          try {
            return JSON.parse(raw)
          } catch {
            return DEFAULT_BOARD_DATA
          }
        },
      },
    }
  },

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'speed-board-node',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="speed-board"]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs: Record<string, unknown> = {
      ...HTMLAttributes,
      'data-type': 'speed-board',
      'data-id': node.attrs.id,
      'data-height': node.attrs.height,
      'data-board-data':
        typeof node.attrs.data === 'string'
          ? node.attrs.data
          : JSON.stringify(node.attrs.data ?? DEFAULT_BOARD_DATA),
    }
    return ['div', mergeAttributes(this.options.HTMLAttributes, attrs)]
  },
})
