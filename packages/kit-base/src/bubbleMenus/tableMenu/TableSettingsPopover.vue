<template>
  <Popover
    v-model:open="visible"
    trigger="click"
    placement="bottomRight"
    :overlay-style="{ zIndex: 1000 }"
    overlay-class-name="speed-editor-table-settings-popover"
  >
    <Tooltip title="表格属性与配色">
      <Button type="text" class="shadow-btn-wrapper">
        <span class="flex items-center justify-center">
          <!-- 钉钉同款表格属性设置图标 -->
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M1.5 6H14.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M6 6V13.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M10.5 6V13.5" stroke="currentColor" stroke-width="1.2"/>
            <rect x="2" y="3" width="12" height="3" fill="currentColor" fill-opacity="0.18"/>
          </svg>
        </span>
      </Button>
    </Tooltip>

    <template #content>
      <div class="table-settings-panel w-64 py-1.5 px-2 select-none">
        <!-- 1. 标题行开关 -->
        <div
          class="setting-row flex items-center justify-between py-1.5 px-2.5 rounded hover:bg-gray-100/70 cursor-pointer transition-colors"
          @click="toggleHeaderRow"
        >
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <!-- 标题行图标 -->
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" class="text-gray-500">
              <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M2 6.5H14" stroke="currentColor" stroke-width="1.2"/>
              <rect x="2.5" y="3.5" width="11" height="3" fill="currentColor" fill-opacity="0.25"/>
            </svg>
            <span>标题行</span>
          </div>
          <Switch size="small" :checked="isHeaderRow" @click.stop @change="toggleHeaderRow" />
        </div>

        <!-- 2. 标题列开关 -->
        <div
          class="setting-row flex items-center justify-between py-1.5 px-2.5 rounded hover:bg-gray-100/70 cursor-pointer transition-colors"
          @click="toggleHeaderCol"
        >
          <div class="flex items-center gap-2 text-sm text-gray-700">
            <!-- 标题列图标 -->
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" class="text-gray-500">
              <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M6 3V13" stroke="currentColor" stroke-width="1.2"/>
              <rect x="2.5" y="3.5" width="3.5" height="9" fill="currentColor" fill-opacity="0.25"/>
            </svg>
            <span>标题列</span>
          </div>
          <Switch size="small" :checked="isHeaderCol" @click.stop @change="toggleHeaderCol" />
        </div>

        <div class="my-2 border-t border-gray-100"></div>

        <!-- 3. 配色方案支持 -->
        <div class="px-2 py-1">
          <div class="text-xs font-medium text-gray-400 mb-2">配色方案</div>

          <!-- 预设主题色徽标 (类似钉钉图7: A 徽标) -->
          <div class="grid grid-cols-6 gap-1.5 mb-3">
            <div
              v-for="theme in presetThemes"
              :key="theme.name"
              class="theme-color-card flex items-center justify-center h-7 rounded border cursor-pointer transition-all hover:scale-105 shadow-xs"
              :style="{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }"
              :title="theme.name"
              @click="applyBgColor(theme.bg)"
            >
              <span class="font-bold text-xs">A</span>
            </div>
          </div>

          <div class="text-xs font-medium text-gray-400 mb-2">自定义</div>
          <div class="flex items-center gap-2">
            <!-- 恢复默认样式 -->
            <button
              type="button"
              class="default-reset-btn flex items-center justify-center px-2.5 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-700 transition-colors shadow-xs"
              title="清除颜色，恢复默认样式"
              @click="clearBgColor"
            >
              <span class="font-bold text-xs mr-1 text-gray-800">A</span>
              默认样式
            </button>

            <!-- 自定义背景颜色选择器 -->
            <ColorPicker :cur-color="currentBgColor" @trigger-color="applyBgColor">
              <div
                class="custom-color-trigger flex items-center gap-1.5 px-2.5 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 cursor-pointer text-gray-700 transition-colors shadow-xs"
                title="选择自定义背景色"
              >
                <span
                  class="w-3.5 h-3.5 rounded border border-gray-300 shadow-xs"
                  :style="{ backgroundColor: currentBgColor || '#fff' }"
                />
                <span>背景色</span>
              </div>
            </ColorPicker>
          </div>
        </div>
      </div>
    </template>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Editor } from '@tiptap/core'
import { Button, Popover, Switch, Tooltip } from 'ant-design-vue'
import { TableMap } from '@tiptap/pm/tables'
import ColorPicker from '@kb/components/colorPicker/index.vue'

const props = defineProps<{
  editor: Editor
}>()

const visible = ref(false)

// 常用表格主题预设背景色（钉钉同款）
const presetThemes = [
  { name: '默认灰', bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' },
  { name: '清新绿', bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  { name: '商务蓝', bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  { name: '柔和粉', bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  { name: '雅致墨绿', bg: '#365314', border: '#1a2e05', text: '#ffffff' },
  { name: '深邃深蓝', bg: '#1e3a8a', border: '#0f172a', text: '#ffffff' },
]

// 获取光标所在的表格节点和绝对位置
const getTableInfo = () => {
  if (!props.editor || !props.editor.state) return null
  const { $from } = props.editor.state.selection
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d)
    if (node.type.name === 'table') {
      return {
        table: node,
        tablePos: $from.start(d) - 1, // table 节点的起始绝对 pos
      }
    }
  }
  return null
}

// 判断首行是否是表头行
const isHeaderRow = computed(() => {
  const info = getTableInfo()
  if (!info || info.table.childCount === 0) return false
  const firstRow = info.table.firstChild
  if (firstRow && firstRow.childCount > 0) {
    return firstRow.firstChild?.type.name === 'tableHeader'
  }
  return false
})

// 判断首列是否是表头列
const isHeaderCol = computed(() => {
  const info = getTableInfo()
  if (!info) return false
  const { table } = info
  if (table.childCount === 0) return false
  // 检查除可能的首行外，是否有某一行的第一列是 tableHeader
  const targetRow = table.childCount > 1 ? table.child(1) : table.child(0)
  if (targetRow && targetRow.childCount > 0) {
    return targetRow.firstChild?.type.name === 'tableHeader'
  }
  return false
})

// 当前选中单元格的背景色
const currentBgColor = computed(() => {
  if (!props.editor || !props.editor.state) return ''
  const { selection } = props.editor.state
  const { $from } = selection
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d)
    if (['tableCell', 'tableHeader'].includes(node.type.name)) {
      return node.attrs?.backgroundColor || ''
    }
  }
  return ''
})

// 清空指定行的所有单元格背景色（确保开关关掉时恢复纯粹的“默认样式”）
const clearRowBg = (rowIndex: number) => {
  const info = getTableInfo()
  if (!info) return
  const { table, tablePos } = info
  const map = TableMap.get(table)
  if (rowIndex >= map.height) return

  const { state, dispatch } = props.editor.view
  let tr = state.tr
  let hasChanges = false

  for (let col = 0; col < map.width; col++) {
    const cellPos = tablePos + 1 + map.map[rowIndex * map.width + col]
    const cellNode = state.doc.nodeAt(cellPos)
    if (cellNode && cellNode.attrs?.backgroundColor) {
      tr = tr.setNodeMarkup(cellPos, undefined, {
        ...cellNode.attrs,
        backgroundColor: null,
      })
      hasChanges = true
    }
  }

  if (hasChanges) {
    dispatch(tr)
  }
}

// 清空指定列的所有单元格背景色
const clearColBg = (colIndex: number) => {
  const info = getTableInfo()
  if (!info) return
  const { table, tablePos } = info
  const map = TableMap.get(table)
  if (colIndex >= map.width) return

  const { state, dispatch } = props.editor.view
  let tr = state.tr
  let hasChanges = false

  for (let row = 0; row < map.height; row++) {
    const cellPos = tablePos + 1 + map.map[row * map.width + colIndex]
    const cellNode = state.doc.nodeAt(cellPos)
    if (cellNode && cellNode.attrs?.backgroundColor) {
      tr = tr.setNodeMarkup(cellPos, undefined, {
        ...cellNode.attrs,
        backgroundColor: null,
      })
      hasChanges = true
    }
  }

  if (hasChanges) {
    dispatch(tr)
  }
}

// 切换标题行：开关关掉时清空首行背景，恢复默认样式
const toggleHeaderRow = () => {
  if (isHeaderRow.value) {
    clearRowBg(0)
  }
  props.editor?.chain().focus().toggleHeaderRow().run()
}

// 切换标题列：开关关掉时清空首列背景，恢复默认样式
const toggleHeaderCol = () => {
  if (isHeaderCol.value) {
    clearColBg(0)
  }
  props.editor?.chain().focus().toggleHeaderColumn().run()
}

// 应用背景色（与选中调用配置色一致）
const applyBgColor = (color: string) => {
  props.editor?.chain().focus().setCellAttribute('backgroundColor', color).run()
}

// 清除背景色，恢复默认样式
const clearBgColor = () => {
  props.editor?.chain().focus().setCellAttribute('backgroundColor', null).run()
}
</script>

<style lang="less" scoped>
.table-settings-panel {
  .theme-color-card {
    user-select: none;
    border-width: 1px;
    border-style: solid;
  }

  .default-reset-btn,
  .custom-color-trigger {
    height: 28px;
    line-height: 26px;
    user-select: none;
  }
}
</style>
