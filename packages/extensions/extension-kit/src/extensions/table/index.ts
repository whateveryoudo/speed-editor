import { Table as SchemaTable } from '@speed-editor/schema'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TableView from './TableView.vue'

/**
 * 现代增强型表格扩展：
 * - 携带行/列拖拽手柄（:::）
 * - 支持拖拽整行 / 整列排序（带蓝色指示线和悬浮移动提示徽章）
 * - 支持点击整行 / 整列一键全选
 * - 支持快捷添加行 / 列（+ 按钮）
 * - 支持强大的 Ant Design Vue 右键/下拉操作面板（批量插入、自动编号、序号列等）
 */
export const Table = SchemaTable.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      resizable: false,
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(TableView)
  },
})

export * from './utils/tableHelpers'
export { TableView }
