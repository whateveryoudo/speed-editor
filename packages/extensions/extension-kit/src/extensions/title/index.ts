/*
 * 编辑器侧 Title：schema 契约 + Vue NodeView / 交互插件
 */
import { Title as SchemaTitle, TitleExtensionName } from '@speed-editor/schema'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { isInTitle, nodeAttrsToDataset } from '@ek/prose-utils'
import { mergeAttributes } from '@tiptap/core'

import Wrapper from './Wrapper.vue'

export type { TitleOptions } from '@speed-editor/schema'
export { TitleExtensionName } from '@speed-editor/schema'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    title: {
      setTitle: (attributes: any) => ReturnType
      toggleTitle: (attributes: any) => ReturnType
    }
  }
}

const TitlePluginKey = new PluginKey(TitleExtensionName)

export const Title = SchemaTitle.extend({
  renderHTML({ HTMLAttributes, node }) {
    return [
      'h1',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, nodeAttrsToDataset(node)),
      0,
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(Wrapper as any)
  },

  addProseMirrorPlugins() {
    const { editor } = this
    const titleName = this.name

    return [
      new Plugin({
        key: TitlePluginKey,
        state: {
          init() {
            return true
          },
          apply(_tr, _oldPluginState) {
            return true
          },
        },
        props: {
          decorations: (state) => {
            const { doc } = state
            const decorations: any[] = []
            doc.descendants((node, pos) => {
              if (node.type.name !== titleName) return

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: editor.isEditable ? 'is-editable' : 'readonly',
                }),
              )
            })
            return DecorationSet.create(doc, decorations)
          },
          handleKeyDown(view, evt) {
            const { state, dispatch } = view
            if (isInTitle(view.state) && evt.code === 'Enter') {
              evt.preventDefault()

              const paragraph = state.schema.nodes.paragraph
              if (!paragraph) {
                return true
              }

              const doc = state.doc

              let titleNode = null
              let titleNodePos = 0
              let titleIndex = 0

              for (let i = 0; i < doc.content.childCount; i++) {
                const node = doc.content.child(i)
                if (node.type.name === titleName) {
                  titleNode = node
                  titleIndex = i
                  break
                }
                titleNodePos += node.nodeSize
              }

              if (!titleNode) {
                return true
              }

              const hasNextParagraph =
                titleIndex + 1 < doc.content.childCount &&
                doc.content.child(titleIndex + 1).type.name === 'paragraph'

              let tr = state.tr
              if (hasNextParagraph) {
                const nextNodeIndex = titleIndex + 1
                let paragraphPos = 1
                for (let i = 0; i < nextNodeIndex; i++) {
                  paragraphPos += doc.content.child(i).nodeSize
                }
                tr = tr.setSelection(TextSelection.create(doc, paragraphPos + 1))
                dispatch(tr)
              } else {
                const titleEndPos = titleNodePos + titleNode.nodeSize
                const newParagraph = paragraph.createAndFill() || paragraph.create()
                tr = tr.insert(titleEndPos, newParagraph)
                tr = tr.setSelection(TextSelection.create(tr.doc, titleEndPos + 1))
                dispatch(tr)
              }

              return true
            }
          },
        },
      }),
    ]
  },
})
