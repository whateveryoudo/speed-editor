import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

/** 把 text-indent 的 CSS 长度换算成 em 数值 */
function cssLengthToEm(raw: string): number {
  const num = parseFloat(raw)
  if (Number.isNaN(num) || num === 0) return 0
  const v = raw.trim().toLowerCase()
  if (v.endsWith('px')) return num / 16
  if (v.endsWith('pt')) return num / 12
  if (v.endsWith('%')) return 0
  return num
}

/** 每一级缩进对应的 em（中文首行缩进一格 ≈ 两个汉字宽） */
const INDENT_EM_PER_LEVEL = 2

/**
 * 段落/标题首行缩进（text-indent）。
 * attrs.indent 为级数；渲染为 indent * 2em。Tab 快捷键一并放 schema。
 */
export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      minIndent: 0,
      maxIndent: 8,
      /** 每级对应 em，默认 2（一格两字符） */
      indentEmPerLevel: INDENT_EM_PER_LEVEL,
    }
  },

  addGlobalAttributes() {
    const emPerLevel = this.options.indentEmPerLevel || INDENT_EM_PER_LEVEL
    const maxIndent = this.options.maxIndent

    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            renderHTML: (attributes) => {
              if (!attributes.indent) {
                return {}
              }
              return {
                style: `text-indent: ${attributes.indent * emPerLevel}em`,
              }
            },
            parseHTML: (element) => {
              const raw = element.style?.textIndent
              if (!raw) return 0
              const em = cssLengthToEm(raw)
              const level = Math.round(em / emPerLevel)
              return Math.min(maxIndent, Math.max(0, level))
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { ranges } = selection
          if (!dispatch) return false

          ranges.forEach((range) => {
            state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
              if (this.options.types.includes(node.type.name)) {
                const indent = (node.attrs.indent || 0) + 1
                if (indent <= this.options.maxIndent) {
                  tr.setNodeMarkup(pos, null, {
                    ...node.attrs,
                    indent,
                  })
                }
              }
            })
          })

          return true
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const { ranges } = selection
          if (!dispatch) return false

          ranges.forEach((range) => {
            state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
              if (this.options.types.includes(node.type.name)) {
                const indent = (node.attrs.indent || 0) - 1
                if (indent >= this.options.minIndent) {
                  tr.setNodeMarkup(pos, null, {
                    ...node.attrs,
                    indent,
                  })
                }
              }
            })
          })

          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
      Backspace: () => {
        const { state } = this.editor
        const { selection } = state
        if (selection.empty && selection.$from.parentOffset === 0) {
          const node = selection.$from.parent
          if (node.attrs.indent > 0) {
            this.editor.commands.outdent()
            return true
          }
        }
        return false
      },
    }
  },
})
