/*
 * 编辑器侧 Tag：schema 契约 + 插入命令 / Vue NodeView
 */
import { Tag as SchemaTag } from '@speed-editor/schema'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { NodeSelection } from '@tiptap/pm/state'
import Wrapper from './Wrapper.vue'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tag: {
      insertTag: (attrs: {
        text: string
        color: string
        bgColor: string
      }) => ReturnType
    }
  }
}

export const Tag = SchemaTag.extend({
  addCommands() {
    return {
      insertTag:
        (attrs: { text: string; color: string; bgColor: string }) =>
        ({ chain, state }) => {
          const { selection } = state
          const { from } = selection

          return chain()
            .insertContent({ type: this.name, attrs })
            .command(({ tr, state }) => {
              state.doc.nodesBetween(from, state.doc.content.size, (node, pos) => {
                if (node.type.name === this.name) {
                  const nodeSelection = NodeSelection.create(tr.doc, pos)
                  tr.setSelection(nodeSelection)
                  return false
                }
              })

              return true
            })
            .run()
        },
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(Wrapper)
  },
})
