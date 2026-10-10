/*
 * 编辑器侧 Loading：schema 契约 + Vue NodeView
 */
import { Loading as SchemaLoading } from '@speed-editor/schema'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import Wrapper from './Wrapper.vue'

export const Loading = SchemaLoading.extend({
  addNodeView() {
    return VueNodeViewRenderer(Wrapper)
  },
})
