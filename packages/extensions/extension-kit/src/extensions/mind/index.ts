/*
 * 编辑器侧 Mind：schema 契约 + 命令 / Vue NodeView / 输入规则
 */
import { Mind as SchemaMind, DEFAULT_MIND_DATA } from '@speed-editor/schema'
import { nodeInputRule } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import Wrapper from './Wrapper.vue'

export { DEFAULT_MIND_DATA }

export interface IMindAttrs {
  defaultShowPicker?: boolean
  createUser?: string | number
  width?: number | string
  height?: number
  data?: Record<string, unknown>
  template?: string
  theme?: string
  zoom?: number
}

interface IMindOptions {
  HTMLAttributes: Record<string, any>
  getCreateUserId: () => string | number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mind: {
      setMind: (attrs?: IMindAttrs) => ReturnType
    }
  }
}

export const Mind = SchemaMind.extend<IMindOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: 'mind',
      },
      getCreateUserId: () => '',
    }
  },

  addCommands() {
    return {
      setMind:
        (options) =>
        ({ tr, commands, chain, editor }) => {
          options = options || {}
          options.data = options.data || DEFAULT_MIND_DATA

          // @ts-ignore
          if (tr.selection?.node?.type?.name == this.name) {
            return commands.updateAttributes(this.name, options)
          }

          return chain()
            .insertContent({
              type: this.name,
              attrs: options,
            })
            .run()
        },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(Wrapper)
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /^\$mind\$$/,
        type: this.type,
        getAttributes: () => {
          return {
            width: '100%',
            defaultShowPicker: true,
            createUser: this.options.getCreateUserId(),
          }
        },
      }),
    ]
  },
})
