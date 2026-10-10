/*
 * 编辑器侧 Callout：schema 契约 + Vue NodeView / 快捷键 / 命令
 */
import { Callout as SchemaCallout } from '@speed-editor/schema'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import Wrapper from './Wrapper.vue'
import { TextSelection, NodeSelection } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (text?: string) => ReturnType
    }
  }
}

export const Callout = SchemaCallout.extend({
  addNodeView() {
    return VueNodeViewRenderer(Wrapper)
  },
  addCommands() {
    return {
      setCallout:
        (text?: string) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              content: [
                text
                  ? {
                      type: 'paragraph',
                      content: text ? [{ type: 'text', text }] : [],
                    }
                  : {
                      type: 'paragraph',
                    },
              ],
            })
            .run()
        },
    }
  },
  addKeyboardShortcuts() {
    const deleteParagraphAndSelectPrev = (
      state: any,
      $from: any,
      prevNode: any,
      parentDepth: number,
      shouldDeleteParagraph: boolean = true,
    ) => {
      const paraStart = $from.before(parentDepth)
      const paraEnd = $from.after(parentDepth)
      const prevNodeStartBefore = paraStart - prevNode.nodeSize

      let tr = state.tr
      if (shouldDeleteParagraph) {
        tr = tr.delete(paraStart, paraEnd)
        const mappedPos = tr.mapping.map(prevNodeStartBefore, -1)
        tr = tr.setSelection(NodeSelection.create(tr.doc, mappedPos))
      } else {
        tr = tr.setSelection(NodeSelection.create(tr.doc, prevNodeStartBefore))
      }
      return tr
    }

    return {
      'Mod-a': () => {
        const { state, dispatch } = this.editor.view
        const { selection, doc } = state
        const { $from } = selection

        for (let d = $from.depth; d >= 0; d--) {
          const node = $from.node(d)
          if (node.type.name === this.name) {
            const from = $from.start(d)
            const to = $from.end(d)
            dispatch(state.tr.setSelection(TextSelection.create(doc, from, to)))
            return true
          }
        }

        return false
      },

      Backspace: () => {
        const { state, dispatch } = this.editor.view
        const { selection, doc } = state
        const { $from } = selection

        if (selection instanceof TextSelection && !selection.empty) {
          const { from, to } = selection
          const selectedNode = doc.nodeAt(from)
          if (selectedNode && selectedNode.type.name === this.name) {
            const tr = state.tr.delete(from, to)
            dispatch(tr)
            return true
          }
        }
        if ($from.parent.type.name === 'paragraph') {
          const atStart = selection.empty && $from.parentOffset === 0
          if (atStart) {
            const parent = $from.node($from.depth - 1)
            const index = $from.index($from.depth - 1)

            if (index > 0) {
              const prevNode = parent.child(index - 1)
              if (prevNode.type.name === this.name) {
                const currentParagraph = $from.parent
                const hasContent = currentParagraph.childCount > 0

                const parentDepth = $from.depth
                const tr = deleteParagraphAndSelectPrev(
                  state,
                  $from,
                  prevNode,
                  parentDepth,
                  !hasContent,
                )
                dispatch(tr)
                return true
              }
            }
          }
        }

        let calloutDepth = -1
        for (let d = $from.depth; d >= 0; d--) {
          const node = $from.node(d)
          if (node.type.name === this.name) {
            calloutDepth = d
            break
          }
        }

        if (calloutDepth === -1) return false

        const atStart = selection.empty && $from.parentOffset === 0
        if (!atStart) return false

        const calloutNode = $from.node(calloutDepth)
        if (calloutNode.childCount === 1) {
          const firstChild = calloutNode.firstChild
          if (
            firstChild &&
            firstChild.type.name === 'paragraph' &&
            firstChild.textContent === ''
          ) {
            const calloutStart = $from.before(calloutDepth)
            const calloutEnd = $from.after(calloutDepth)
            const tr = state.tr.delete(calloutStart, calloutEnd)
            dispatch(tr)
            return true
          }
        }

        return false
      },
    }
  },
})
