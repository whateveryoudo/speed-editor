import { Board as SchemaBoard, DEFAULT_BOARD_DATA } from '@speed-editor/schema'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import BoardWrapper from './BoardWrapper.vue'

export { DEFAULT_BOARD_DATA }

export interface BoardAttrs {
  height?: number
  data?: any[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    board: {
      /**
       * 插入一个画板节点
       */
      insertBoard: (attrs?: BoardAttrs) => ReturnType
    }
  }
}

export const BoardNode = SchemaBoard.extend({
  addNodeView() {
    return VueNodeViewRenderer(BoardWrapper)
  },

  addCommands() {
    return {
      insertBoard:
        (attrs = {}) =>
        ({ chain, tr, commands }) => {
          const payload = {
            height: attrs.height || 480,
            data: attrs.data ?? [],
          }

          // @ts-ignore
          if (tr.selection?.node?.type?.name === this.name) {
            return commands.updateAttributes(this.name, payload)
          }

          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: payload,
            })
            .run()
        },
    }
  },
})
