<template>
  <div class="speed-table-context-menu" @mousedown.stop @click.stop>
    <a-menu class="speed-table-menu-list">
      <!-- 向上插入行 -->
      <a-menu-item key="insert-row-before" @click="handleInsertRow('before')">
        <div class="menu-item-row flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ArrowUpOutlined />
            <span>向上插入</span>
          </div>
          <div class="flex items-center gap-1" @click.stop>
            <a-input-number
              v-model:value="insertRowCount"
              :min="1"
              :max="50"
              size="small"
              class="w-11"
            />
            <span class="text-xs text-gray-500">行</span>
          </div>
        </div>
      </a-menu-item>

      <!-- 向下插入行 -->
      <a-menu-item key="insert-row-after" @click="handleInsertRow('after')">
        <div class="menu-item-row flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ArrowDownOutlined />
            <span>向下插入</span>
          </div>
          <div class="flex items-center gap-1" @click.stop>
            <a-input-number
              v-model:value="insertRowCount"
              :min="1"
              :max="50"
              size="small"
              class="w-11"
            />
            <span class="text-xs text-gray-500">行</span>
          </div>
        </div>
      </a-menu-item>

      <!-- 向左插入列 -->
      <a-menu-item key="insert-col-before" @click="handleInsertCol('before')">
        <div class="menu-item-row flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ArrowLeftOutlined />
            <span>向左插入</span>
          </div>
          <div class="flex items-center gap-1" @click.stop>
            <a-input-number
              v-model:value="insertColCount"
              :min="1"
              :max="20"
              size="small"
              class="w-11"
            />
            <span class="text-xs text-gray-500">列</span>
          </div>
        </div>
      </a-menu-item>

      <!-- 向右插入列 -->
      <a-menu-item key="insert-col-after" @click="handleInsertCol('after')">
        <div class="menu-item-row flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ArrowRightOutlined />
            <span>向右插入</span>
          </div>
          <div class="flex items-center gap-1" @click.stop>
            <a-input-number
              v-model:value="insertColCount"
              :min="1"
              :max="20"
              size="small"
              class="w-11"
            />
            <span class="text-xs text-gray-500">列</span>
          </div>
        </div>
      </a-menu-item>

      <a-menu-divider />

      <!-- 从第 N 行起自动编号 -->
      <a-menu-item key="auto-number" @click="handleAutoNumber">
        <div class="menu-item-row flex items-center justify-between">
          <div class="flex items-center gap-2">
            <OrderedListOutlined />
            <span>从第</span>
          </div>
          <div class="flex items-center gap-1" @click.stop>
            <a-input-number
              v-model:value="startRowForNumber"
              :min="1"
              :max="100"
              size="small"
              class="w-11"
            />
            <span class="text-xs text-gray-500">行起自动编号</span>
          </div>
        </div>
      </a-menu-item>

      <!-- 插入序号列到最左侧 -->
      <a-menu-item key="insert-index-col" @click="handleInsertIndexColumn">
        <div class="flex items-center gap-2">
          <OrderedListOutlined />
          <span>插入序号列到最左侧</span>
        </div>
      </a-menu-item>

      <a-menu-divider />

      <!-- 单元格合并与拆分 (多选可合并时显示合并，当前单元格有合并时显示拆分) -->
      <template v-if="canMergeCells || canSplitCell">
        <a-menu-item v-if="canMergeCells" key="merge-cells" @click="handleMergeCells">
          <div class="flex items-center gap-2">
            <MergeCellsOutlined />
            <span>合并单元格</span>
          </div>
        </a-menu-item>

        <a-menu-item v-if="canSplitCell" key="split-cells" @click="handleSplitCell">
          <div class="flex items-center gap-2">
            <SplitCellsOutlined />
            <span>拆分单元格</span>
          </div>
        </a-menu-item>

        <a-menu-divider />
      </template>

      <!-- 水平对齐（直接作为菜单项，无图标） -->
      <a-menu-item key="cell-align" :selectable="false" class="menu-custom-action-item" @click.stop>
        <div class="menu-item-row flex items-center justify-between">
          <span class="text-[13px] text-gray-700">水平对齐</span>
          <div class="align-btn-group flex items-center gap-1">
            <button
              type="button"
              class="align-btn flex items-center justify-center cursor-pointer"
              title="左对齐"
              @click="handleAlign('left')"
            >
              <AlignLeftOutlined />
            </button>
            <button
              type="button"
              class="align-btn flex items-center justify-center cursor-pointer"
              title="居中对齐"
              @click="handleAlign('center')"
            >
              <AlignCenterOutlined />
            </button>
            <button
              type="button"
              class="align-btn flex items-center justify-center cursor-pointer"
              title="右对齐"
              @click="handleAlign('right')"
            >
              <AlignRightOutlined />
            </button>
          </div>
        </div>
      </a-menu-item>

      <!-- 单元格背景色（直接作为菜单项，无图标，支持色块与颜色选择器） -->
      <a-menu-item key="cell-bg-color" :selectable="false" class="menu-custom-action-item" @click.stop>
        <div class="menu-item-row flex items-center justify-between">
          <span class="text-[13px] text-gray-700">单元格背景色</span>
          <div class="color-palette flex items-center gap-1.5">
            <!-- 默认无色/清除 -->
            <button
              type="button"
              class="color-btn clear-color flex items-center justify-center cursor-pointer"
              title="无背景色"
              @click="handleSetBackgroundColor(null)"
            >
              <svg viewBox="0 0 16 16" class="w-3 h-3 text-red-500 stroke-current">
                <line x1="2" y1="14" x2="14" y2="2" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
            <!-- 常用清新色块 -->
            <button
              v-for="color in presetColors"
              :key="color.value"
              type="button"
              class="color-btn cursor-pointer"
              :style="{ backgroundColor: color.value }"
              :title="color.label"
              @click="handleSetBackgroundColor(color.value)"
            />
            <!-- 颜色选择器按钮（使用全局 s-color-picker 触发器） -->
            <s-color-picker
              placement="right"
              :color="currentCustomColor"
              @update:color="handleCustomColorChange"
            >
              <div class="color-picker-trigger cursor-pointer flex items-center justify-center relative" title="自定义颜色选择器">
                <svg viewBox="0 0 16 16" class="w-3 h-3 text-gray-600 fill-current">
                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                </svg>
              </div>
            </s-color-picker>
          </div>
        </div>
      </a-menu-item>

      <a-menu-divider />

      <!-- 删除所选行 -->
      <a-menu-item key="delete-row" danger @click="handleDeleteRow">
        <div class="flex items-center gap-2">
          <DeleteOutlined />
          <span>删除所选行</span>
        </div>
      </a-menu-item>

      <!-- 删除所选列 -->
      <a-menu-item key="delete-col" danger @click="handleDeleteCol">
        <div class="flex items-center gap-2">
          <DeleteOutlined />
          <span>删除所选列</span>
        </div>
      </a-menu-item>

      <!-- 删除表格 -->
      <a-menu-item key="delete-table" danger @click="handleDeleteTable">
        <div class="flex items-center gap-2">
          <DeleteOutlined />
          <span>删除表格</span>
        </div>
      </a-menu-item>

      <a-menu-divider />

      <!-- 清除内容 -->
      <a-menu-item key="clear-content" @click="handleClearContent">
        <div class="flex items-center gap-2">
          <ClearOutlined />
          <span>清除内容</span>
        </div>
      </a-menu-item>
    </a-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Editor } from '@tiptap/core'
import {
  Menu as AMenu,
  MenuItem as AMenuItem,
  MenuDivider as AMenuDivider,
  InputNumber as AInputNumber,
} from 'ant-design-vue'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  OrderedListOutlined,
  DeleteOutlined,
  ClearOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  MergeCellsOutlined,
  SplitCellsOutlined,
} from '@ant-design/icons-vue'
import {
  insertRows,
  insertCols,
  clearSelectedCells,
  insertIndexColumn,
  autoNumberColumn,
} from './utils/tableHelpers'

const props = defineProps<{
  editor: Editor
  tablePos: number
  targetColIndex?: number
  targetRowIndex?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const presetColors = [
  { label: '浅灰', value: '#F1F5F9' },
  { label: '浅红', value: '#FFE8E6' },
  { label: '浅绿', value: '#E4F7D2' },
  { label: '浅紫', value: '#EFE1FA' },
]

const canMergeCells = computed(() => {
  return props.editor?.can?.().mergeCells?.() ?? false
})

const canSplitCell = computed(() => {
  return props.editor?.can?.().splitCell?.() ?? false
})

const handleMergeCells = () => {
  props.editor?.chain().focus().mergeCells().run()
  emit('close')
}

const handleSplitCell = () => {
  props.editor?.chain().focus().splitCell().run()
  emit('close')
}

const handleAlign = (align: 'left' | 'center' | 'right') => {
  props.editor.chain().focus().setCellAttribute('align', align).run()
  emit('close')
}

const currentCustomColor = ref('')

const handleSetBackgroundColor = (color: string | null) => {
  currentCustomColor.value = color || ''
  props.editor.chain().focus().setCellAttribute('backgroundColor', color).run()
  emit('close')
}

const handleCustomColorChange = (color: string) => {
  currentCustomColor.value = color
  if (color) {
    props.editor.chain().focus().setCellAttribute('backgroundColor', color).run()
  }
}

const insertRowCount = ref(1)
const insertColCount = ref(1)
const startRowForNumber = ref(1)

const handleInsertRow = (direction: 'before' | 'after') => {
  insertRows(props.editor, insertRowCount.value, direction)
  emit('close')
}

const handleInsertCol = (direction: 'before' | 'after') => {
  insertCols(props.editor, insertColCount.value, direction, props.tablePos, props.targetColIndex)
  emit('close')
}

const handleAutoNumber = () => {
  const colIndex = props.targetColIndex ?? 0
  autoNumberColumn(props.editor, props.tablePos, colIndex, startRowForNumber.value - 1, 1)
  emit('close')
}

const handleInsertIndexColumn = () => {
  insertIndexColumn(props.editor, props.tablePos, 1)
  emit('close')
}

const handleDeleteRow = () => {
  props.editor.commands.deleteRow()
  emit('close')
}

const handleDeleteCol = () => {
  props.editor.commands.deleteColumn()
  emit('close')
}

const handleDeleteTable = () => {
  props.editor.commands.deleteTable()
  emit('close')
}

const handleClearContent = () => {
  clearSelectedCells(props.editor)
  emit('close')
}
</script>

<style lang="less" scoped>
.speed-table-context-menu {
  min-width: 240px;
  width: max-content;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12);
  user-select: none;
  overflow: hidden;

  .speed-table-menu-list {
    border: none;
    border-radius: 8px;
    padding: 3px;

    :deep(.ant-menu-item) {
      height: 30px !important;
      line-height: 30px !important;
      padding: 0 8px !important;
      padding-inline: 8px !important;
      margin: 1px 0 !important;
      border-radius: 4px;
      font-size: 13px;
      display: flex !important;
      align-items: center !important;
      box-sizing: border-box !important;
    }

    :deep(.ant-menu-title-content) {
      flex: 1 1 0% !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    :deep(.ant-menu-item-divider) {
      margin: 3px 0 !important;
    }

    :deep(.ant-input-number) {
      height: 22px;
      line-height: 22px;

      .ant-input-number-input-wrap,
      .ant-input-number-input {
        height: 20px;
        line-height: 20px;
        padding: 0 4px;
        font-size: 12px;
        text-align: center;
      }

      .ant-input-number-handler-wrap {
        width: 14px;
      }
    }
  }

  .menu-item-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  // 自定义整行菜单项（对齐与背景色）
  .menu-custom-action-item {
    cursor: default !important;

    &:hover {
      background-color: transparent !important;
    }

    .align-btn-group {
      background: #f1f5f9;
      padding: 1px 2px;
      border-radius: 4px;

      .align-btn {
        width: 24px;
        height: 20px;
        border: none;
        background: transparent;
        border-radius: 3px;
        color: #475569;
        font-size: 12px;
        transition: all 0.15s ease;

        &:hover {
          background: #ffffff;
          color: #2F8EF4;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
      }
    }

    .color-palette {
      .color-btn {
        width: 15px;
        height: 15px;
        border-radius: 3px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        padding: 0;
        transition: transform 0.12s ease, border-color 0.12s ease;

        &:hover {
          transform: scale(1.2);
          border-color: #2F8EF4;
          z-index: 1;
        }

        &.clear-color {
          background: #ffffff;
          border: 1px dashed #cbd5e1;

          &:hover {
            border-color: #ef4444;
          }
        }
      }

      .color-picker-trigger {
        width: 17px;
        height: 17px;
        border-radius: 3px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        padding: 0;
        transition: all 0.15s ease;
        overflow: hidden;

        &:hover {
          border-color: #2F8EF4;
          background: #eff6ff;
          transform: scale(1.15);
        }
      }
    }
  }
}
</style>
