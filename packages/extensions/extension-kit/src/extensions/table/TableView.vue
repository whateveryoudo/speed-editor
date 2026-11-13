<template>
  <NodeViewWrapper class="speed-table-node-view relative">
    <div ref="containerRef" class="speed-table-container relative" :class="{
      'is-dragging': isDraggingCol || isDraggingRow,
      'is-resizing-col': isColumnResizing,
      'show-handles': isHandlesVisible,
      'all-selected': isAllTableSelected,
    }">
      <!-- 1. 左上角操作角标：纯色块，点击全选表格并唤起主格式气泡（查看态通过 v-show 隐藏，杜绝 DOM 结构增删抖动） -->
      <div v-show="props.editor?.isEditable" class="speed-table-corner flex items-center justify-center cursor-pointer"
        :class="{ 'is-active': isAllTableSelected }" title="全选表格" @mousedown.prevent @click="handleSelectAll" />

      <!-- 2. 顶部：列手柄视口（限制在表格容器可视宽度内，overflow: hidden 裁剪溢出，随表格水平滚动 1:1 同步平移） -->
      <div v-show="props.editor?.isEditable" class="speed-table-handle-cols-viewport absolute">
        <div ref="colHandlesBarRef" class="speed-table-handle-cols flex"
          :class="{ 'all-selected': isAllTableSelected }" @mousedown.prevent @mouseleave="handleColBarMouseLeave">
          <div v-for="(col, colIdx) in renderedColPositions" :key="colIdx"
            class="col-handle flex items-center justify-center relative cursor-pointer flex-shrink-0" :class="{
              'is-active': activeCol === colIdx || isAllTableSelected,
              'is-dragging-source': isDraggingCol && dragColSourceIndex === colIdx,
            }" :style="{
              width: `${col.width}px`,
            }" @pointerdown="handleColPointerDown($event, colIdx)"
            @contextmenu.prevent="handleColContextMenu($event, colIdx)" @mousemove="handleColMouseMove($event, colIdx)">
            <!-- 只有点击选中激活变蓝时，才显示 drag 图标（6点抓手），才可拖拽 -->
            <span v-if="activeCol === colIdx"
              class="drag-icon-col flex items-center justify-center" style="transform: rotateZ(90deg);">
              <s-icon-font type="icon-kl-drag" />
            </span>
          </div>

          <!-- 悬浮在列分割线上的精准插入加号（单例绝对定位，相邻列跨越时索引稳定不变，绝不闪动） -->
          <div
            v-if="hoveredColBorderIndex !== null && !isAllTableSelected && !isDraggingCol && !isDraggingRow && !isColumnResizing"
            class="col-add-btn"
            :class="{ 'btn-first-col': hoveredColBorderIndex === 0 }"
            :style="{ left: `${hoveredColBtnLeft}px` }"
            :title="hoveredColBorderIndex === 0 ? '向左插入列' : '向右插入列'"
            @pointerdown.stop.prevent
            @mousedown.stop.prevent
            @click.stop.prevent="handleInsertColByBorder(hoveredColBorderIndex)">
            <svg viewBox="0 0 16 16" class="w-2.5 h-2.5 fill-current">
              <path
                d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 3. 左侧：行手柄视口（限制在表格容器可视高度内，overflow: hidden 裁剪溢出，随表格垂直滚动 1:1 同步平移） -->
      <div v-show="props.editor?.isEditable" class="speed-table-handle-rows-viewport absolute">
        <div ref="rowHandlesBarRef" class="speed-table-handle-rows flex flex-col"
          :class="{ 'all-selected': isAllTableSelected }" @mousedown.prevent @mouseleave="handleRowBarMouseLeave">
          <div v-for="(row, rowIdx) in renderedRowPositions" :key="rowIdx"
            class="row-handle flex items-center justify-center relative cursor-pointer flex-shrink-0" :class="{
              'is-active': activeRow === rowIdx || isAllTableSelected,
              'is-dragging-source': isDraggingRow && dragRowSourceIndex === rowIdx,
            }" :style="{
              height: `${row.height}px`,
            }" @pointerdown="handleRowPointerDown($event, rowIdx)"
            @contextmenu.prevent="handleRowContextMenu($event, rowIdx)" @mousemove="handleRowMouseMove($event, rowIdx)">
            <!-- 只有点击选中激活变蓝时，才显示 drag 图标（6点抓手），才可拖拽 -->
            <span v-if="activeRow === rowIdx"
              class="drag-icon-row flex items-center justify-center">
              <s-icon-font type="icon-kl-drag" />
            </span>
          </div>

          <!-- 悬浮在行分割线上的精准插入加号（单例绝对定位，相邻行跨越时索引稳定不变，绝不闪动） -->
          <div
            v-if="hoveredRowBorderIndex !== null && !isAllTableSelected && !isDraggingCol && !isDraggingRow && !isColumnResizing"
            class="row-add-btn"
            :class="{ 'btn-first-row': hoveredRowBorderIndex === 0 }"
            :style="{ top: `${hoveredRowBtnTop}px` }"
            :title="hoveredRowBorderIndex === 0 ? '向上插入行' : '向下插入行'"
            @pointerdown.stop.prevent
            @mousedown.stop.prevent
            @click.stop.prevent="handleInsertRowByBorder(hoveredRowBorderIndex)">
            <svg viewBox="0 0 16 16" class="w-2.5 h-2.5 fill-current">
              <path
                d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 4. 核心：表格渲染区，Tiptap 接管 tbody -->
      <div ref="tableWrapperRef" class="tableWrapper"
        @scroll="handleTableScroll"
        @contextmenu="handleTableContextMenu"
        @mousemove="handleTableMouseMove"
        @mousedown="handleTableMouseDown"
        @mouseleave="handleTableMouseLeave">
        <table class="speed-editor-table" :style="tableWidthStyle">
          <colgroup ref="colgroupRef">
            <col
              v-for="(w, idx) in colWidths"
              :key="idx"
              :style="w ? { width: `${w}px` } : undefined"
            />
          </colgroup>
          <tbody data-node-view-content></tbody>
        </table>
      </div>

      <!-- 5. 拖拽指示线与悬浮提示徽章（图 5） -->
      <div v-if="props.editor?.isEditable && isDraggingCol && dragColIndicatorLeft !== null" class="drag-indicator-col absolute"
        :style="{ left: `${dragColIndicatorLeft}px` }" />

      <div v-if="props.editor?.isEditable && isDraggingRow && dragRowIndicatorTop !== null" class="drag-indicator-row absolute"
        :style="{ top: `${dragRowIndicatorTop}px` }" />

      <div v-if="props.editor?.isEditable && (isDraggingCol || isDraggingRow) && floatingTooltipPos"
        class="drag-floating-badge fixed z-[1000] flex items-center" :style="{
          left: `${floatingTooltipPos.x + 16}px`,
          top: `${floatingTooltipPos.y + 12}px`,
        }">
        <span>{{ isDraggingCol ? '正在移动 1 列' : '正在移动 1 行' }}</span>
      </div>

      <!-- 6. 悬浮在列边缘时的指示蓝线（未聚焦时与表格齐平 top: 0，聚焦时向上拉通覆盖顶部把手 top: -20px，底端不穿过滚动条） -->
      <div v-if="props.editor?.isEditable && !isColumnResizing && hoveredBorderLeft !== null"
        class="column-hover-indicator absolute pointer-events-none"
        :style="{
          left: `${hoveredBorderLeft}px`,
          top: isHandlesVisible ? '-20px' : '0px',
          height: `${isHandlesVisible ? guideLineHeight + 20 : guideLineHeight}px`,
        }" />

      <!-- 7. 列宽调整通天实时跟随引导线（未聚焦时 top: 0，聚焦时 top: -20px，底端不穿过滚动条） -->
      <div v-if="props.editor?.isEditable && isColumnResizing && guideLineLeft !== null"
        class="column-resize-guide-line absolute"
        :style="{
          left: `${guideLineLeft}px`,
          top: isHandlesVisible ? '-20px' : '0px',
          height: `${isHandlesVisible ? guideLineHeight + 20 : guideLineHeight}px`,
        }">
        <div class="resize-guide-bubble">{{ currentGuideWidth }}px</div>
      </div>

      <!-- 左右滚动边缘阴影（语雀/飞书同款：存在滚动内容时浮现渐变阴影，滚动到头时自然隐去） -->
      <div class="table-scroll-shadow-left" :class="{ 'is-active': canScrollLeft }" />
      <div class="table-scroll-shadow-right" :class="{ 'is-active': canScrollRight }" />

      <!-- 右键全局上下文菜单容器（查看态绝不展示） -->
      <div v-if="props.editor?.isEditable && contextMenuState.visible" class="fixed z-[1001]"
        :style="{ left: `${contextMenuState.x}px`, top: `${contextMenuState.y}px` }">
        <TableContextMenu :editor="editor" :table-pos="tablePos" :target-col-index="activeCol ?? undefined"
          :target-row-index="activeRow ?? undefined" @close="contextMenuState.visible = false" />
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { Dropdown as ADropdown } from 'ant-design-vue'
import TableContextMenu from './TableContextMenu.vue'
import {
  selectRow,
  selectColumn,
  selectTable,
  moveColumn,
  moveRow,
  insertRows,
  insertCols,
  ensureColumnWidth,
  applyTableColumnWidth,
} from './utils/tableHelpers'
import { CellSelection, TableMap } from '@tiptap/pm/tables'

const props = defineProps(nodeViewProps)

const containerRef = ref<HTMLElement | null>(null)
const tableWrapperRef = ref<HTMLElement | null>(null)
const colgroupRef = ref<HTMLTableColElement | null>(null)
const colHandlesBarRef = ref<HTMLElement | null>(null)
const rowHandlesBarRef = ref<HTMLElement | null>(null)

// 自定义通天引导线列宽拖拽与边缘悬浮状态
const isColumnResizing = ref(false)
const guideLineLeft = ref<number | null>(null)
const guideLineHeight = ref(400)
const currentGuideWidth = ref(100)
const hoveredBorderColIndex = ref<number | null>(null)
const hoveredBorderLeft = ref<number | null>(null)

// 左右水平滚动阴影状态（与语雀/飞书对齐）
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const updateScrollState = () => {
  if (!tableWrapperRef.value) return
  const { scrollLeft, scrollWidth, clientWidth } = tableWrapperRef.value
  canScrollLeft.value = scrollLeft > 1
  canScrollRight.value = scrollWidth - clientWidth - scrollLeft > 1
}

const updateHoveredBorderPosition = (colIdx: number) => {
  if (!containerRef.value || !colHandlesBarRef.value) return
  const containerRect = containerRef.value.getBoundingClientRect()
  const colHandles = colHandlesBarRef.value.children
  const targetHandle = colHandles[colIdx] as HTMLElement | undefined
  if (targetHandle) {
    const handleRect = targetHandle.getBoundingClientRect()
    hoveredBorderLeft.value = handleRect.right - containerRect.left
  } else {
    let accum = 0
    const scrollLeft = tableWrapperRef.value?.scrollLeft || 0
    const cols = renderedColPositions.value
    for (let i = 0; i <= colIdx; i++) {
      accum += cols[i]?.width || 100
    }
    hoveredBorderLeft.value = accum - scrollLeft
  }
  const table = tableWrapperRef.value?.querySelector('table')
  const tableHeight = table?.offsetHeight || tableWrapperRef.value?.clientHeight || 300
  guideLineHeight.value = tableHeight
}

interface ColPosition {
  width: number
}

interface RowPosition {
  height: number
}

const colPositions = ref<ColPosition[]>([])
const rowPositions = ref<RowPosition[]>([])
const activeCol = ref<number | null>(null)
const activeRow = ref<number | null>(null)

const tablePos = computed<number>(() => {
  if (typeof props.getPos === 'function') {
    const pos = props.getPos()
    return typeof pos === 'number' ? pos : 0
  }
  return 0
})

// 与气泡菜单完全同源的聚焦判断逻辑：向上递归查找 table 节点并精确比对 tablePos
const isCurrentTableFocused = ref(false)

const checkTableFocus = () => {
  if (!props.editor || !props.editor.state) {
    isCurrentTableFocused.value = false
    return
  }
  const { selection } = props.editor.state

  // 如果是单元格选区 (CellSelection)
  if (selection instanceof CellSelection) {
    const tableStart = selection.$anchorCell.start(-1) - 1
    isCurrentTableFocused.value = tableStart === tablePos.value
    return
  }

  const { $from } = selection
  let foundTablePos = -1
  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth)
    if (node.type.name === 'table') {
      foundTablePos = $from.start(depth) - 1
      break
    }
  }

  isCurrentTableFocused.value = foundTablePos !== -1 && foundTablePos === tablePos.value
}

// 查看态（非 editable）绝对不显示任何把手 bar 与角标
const isHandlesVisible = computed(() => {
  if (!props.editor?.isEditable) return false
  return (
    isCurrentTableFocused.value ||
    isDraggingCol.value ||
    isDraggingRow.value ||
    contextMenuState.value.visible
  )
})

const isAllTableSelected = ref(false)

// 选区同步逻辑：实时判断当前是全选表格、选中整列、选中整行还是普通打字
const updateActiveSelection = () => {
  if (!props.editor || !props.editor.state) return
  const { selection } = props.editor.state
  const pos = tablePos.value
  const tableNode = props.node
  const nodeSize = tableNode?.nodeSize || 0

  // 1. 如果光标根本不在当前表格内
  if (selection.from < pos || selection.to > pos + nodeSize) {
    activeCol.value = null
    activeRow.value = null
    isAllTableSelected.value = false
    return
  }

  // 2. 如果是单元格选区 (CellSelection)
  if (selection instanceof CellSelection) {
    const isCol = selection.isColSelection()
    const isRow = selection.isRowSelection()
    const map = TableMap.get(tableNode)
    const anchorRel = selection.$anchorCell.pos - pos - 1
    const headRel = selection.$headCell.pos - pos - 1
    let isCoverAll = false
    try {
      const rect = map.rectBetween(anchorRel, headRel)
      isCoverAll = rect.left === 0 && rect.top === 0 && rect.right === map.width && rect.bottom === map.height
    } catch {
      // ignore
    }

    // 全选整个表格：同时满足行选择与列选择，或覆盖全表所有格子
    if ((isCol && isRow) || isCoverAll) {
      isAllTableSelected.value = true
      activeCol.value = null
      activeRow.value = null
      return
    }

    isAllTableSelected.value = false

    // 选中整列
    if (isCol) {
      try {
        const cellRect = map.findCell(anchorRel)
        activeCol.value = cellRect.left
      } catch {
        activeCol.value = 0
      }
      activeRow.value = null
      return
    }

    // 选中整行
    if (isRow) {
      try {
        const cellRect = map.findCell(anchorRel)
        activeRow.value = cellRect.top
      } catch {
        activeRow.value = 0
      }
      activeCol.value = null
      return
    }

    // 普通框选单元格（不是整行整列）
    activeCol.value = null
    activeRow.value = null
  } else {
    // 3. 点击单元格打字（普通光标）：清空一切列/行蓝色激活高亮
    activeCol.value = null
    activeRow.value = null
    isAllTableSelected.value = false
  }
}

// 响应式解析每一列的目标宽度（优先从 ProseMirror node 读取并由 Vue 声明式同步，挂载首帧即定型）
const colWidths = computed<(number | null)[]>(() => {
  const firstRow = props.node?.firstChild
  if (!firstRow) return []

  const widths: (number | null)[] = []
  firstRow.forEach((cell: any) => {
    const colwidth = cell.attrs?.colwidth
    const colspan = cell.attrs?.colspan || 1
    if (Array.isArray(colwidth) && colwidth.length > 0) {
      for (let i = 0; i < colspan; i++) {
        widths.push(typeof colwidth[i] === 'number' ? colwidth[i] : null)
      }
    } else {
      for (let i = 0; i < colspan; i++) {
        widths.push(null)
      }
    }
  })

  const hasAnyWidth = widths.some((w) => w !== null && w > 0)
  const defaultCellMinWidth = 100 // 默认保底列宽

  return widths.map((w) => {
    if (hasAnyWidth && (!w || w <= 0)) {
      return defaultCellMinWidth
    }
    return w
  })
})

// 表格总宽度样式：从挂载第一帧起即生效，彻底根除切换编辑态时从 100% 异步跳变为固定像素宽度的页面抖动
const tableWidthStyle = computed<{ width: string; minWidth?: string }>(() => {
  const widths = colWidths.value
  const hasAnyWidth = widths.some((w) => w !== null && w > 0)
  if (hasAnyWidth) {
    const total = widths.reduce((acc, w) => acc + (w || 0), 0)
    if (total > 0) {
      return { width: `${total}px` }
    }
  }
  return { width: '100%' }
})

// 首屏垫底的列把手位置（避免首次挂载测量前把手列表为空导致的高度/宽度跳动）
const renderedColPositions = computed<ColPosition[]>(() => {
  if (colPositions.value.length > 0) {
    return colPositions.value
  }
  return colWidths.value.map((w) => ({
    width: w || 100,
  }))
})

// 首屏垫底的行把手位置
const renderedRowPositions = computed<RowPosition[]>(() => {
  if (rowPositions.value.length > 0) {
    return rowPositions.value
  }
  const count = props.node?.childCount || 0
  const arr: RowPosition[] = []
  for (let i = 0; i < count; i++) {
    arr.push({ height: 34 })
  }
  return arr
})

// 判断当前表格是否处于列宽拖拽缩放中
const isResizingColumnActive = () => isColumnResizing.value

// 测量每一个格子的真实渲染宽高（完全与语雀/飞书对齐：由 flex 流式自然排布，无任何 left/top 偏移计算）
const syncSizes = () => {
  // 查看态无需把手几何测量，仅维护左右滚动阴影状态，避免无意义 reflow
  if (!props.editor?.isEditable) {
    updateScrollState()
    return
  }

  const table = tableWrapperRef.value?.querySelector('table')
  if (!table) return

  const rows = table.querySelectorAll('tr')
  if (rows.length === 0) return

  // 1. 只有数值真实变动 (>= 1px) 时才更新，杜绝重复创建新数组引用触发 Vue 频繁重新 patch DOM
  let rowsChanged = false
  if (rowPositions.value.length !== rows.length) {
    rowsChanged = true
  } else {
    for (let i = 0; i < rows.length; i++) {
      const h = (rows[i] as HTMLElement).getBoundingClientRect().height
      if (Math.abs((rowPositions.value[i]?.height || 0) - h) >= 1) {
        rowsChanged = true
        break
      }
    }
  }

  if (rowsChanged) {
    rowPositions.value = Array.from(rows).map((tr) => ({
      height: (tr as HTMLElement).getBoundingClientRect().height,
    }))
  }

  // 2. 测量第一行各列真实渲染宽度
  const firstRowCells = rows[0].children
  if (firstRowCells.length > 0) {
    let colsChanged = false
    if (colPositions.value.length !== firstRowCells.length) {
      colsChanged = true
    } else {
      for (let i = 0; i < firstRowCells.length; i++) {
        const w = (firstRowCells[i] as HTMLElement).getBoundingClientRect().width
        if (Math.abs((colPositions.value[i]?.width || 0) - w) >= 1) {
          colsChanged = true
          break
        }
      }
    }

    if (colsChanged) {
      colPositions.value = Array.from(firstRowCells).map((cell) => ({
        width: (cell as HTMLElement).getBoundingClientRect().width,
      }))
    }
  }

  nextTick(updateScrollState)
}

// 表格滚动时，让顶部的列把手栏与左侧的行把手栏严格 1:1 像素级同步平移
const handleTableScroll = () => {
  if (!tableWrapperRef.value) return
  const { scrollLeft, scrollTop } = tableWrapperRef.value
  if (colHandlesBarRef.value) {
    colHandlesBarRef.value.style.transform = `translateX(-${scrollLeft}px)`
  }
  if (rowHandlesBarRef.value) {
    rowHandlesBarRef.value.style.transform = `translateY(-${scrollTop}px)`
  }
  if (hoveredBorderColIndex.value !== null) {
    updateHoveredBorderPosition(hoveredBorderColIndex.value)
  }
  updateScrollState()
}

let resizeObserver: ResizeObserver | null = null

const handleSelectionChange = () => {
  checkTableFocus()
  updateActiveSelection()
}

const handleBlur = () => {
  if (contextMenuState.value.visible || isDraggingCol.value || isDraggingRow.value) {
    return
  }
  // 延迟检测失焦，避免点击把手或菜单切换时的误判
  setTimeout(() => {
    if (contextMenuState.value.visible || isDraggingCol.value || isDraggingRow.value) {
      return
    }
    if (containerRef.value?.contains(document.activeElement)) {
      return
    }
    checkTableFocus()
    if (!isCurrentTableFocused.value) {
      activeCol.value = null
      activeRow.value = null
      isAllTableSelected.value = false
    }
  }, 120)
}

onMounted(() => {
  nextTick(() => {
    syncSizes()
    checkTableFocus()
    updateActiveSelection()

    if (props.editor) {
      props.editor.on('selectionUpdate', handleSelectionChange)
      props.editor.on('focus', checkTableFocus)
      props.editor.on('blur', handleBlur)
    }

    const tableElem = tableWrapperRef.value?.querySelector('table')
    if (tableElem) {
      // 监听真实 table 元素的几何尺寸变化（行高变动、视口缩放等），自动同步把手位置
      resizeObserver = new ResizeObserver(() => {
        if (isResizingColumnActive()) return
        syncSizes()
      })
      resizeObserver.observe(tableElem)
    }
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  document.removeEventListener('click', handleGlobalClick)
  if (props.editor) {
    props.editor.off('selectionUpdate', handleSelectionChange)
    props.editor.off('focus', checkTableFocus)
    props.editor.off('blur', handleBlur)
  }
})

watch(
  () => props.node,
  () => {
    nextTick(syncSizes)
  },
  { deep: true },
)

// 全选表格
const handleSelectAll = () => {
  if (!props.editor?.isEditable) return
  isAllTableSelected.value = true
  activeCol.value = null
  activeRow.value = null
  selectTable(props.editor, tablePos.value)
}

// 点击列把手 -> 全选整列
const handleColClick = (colIdx: number) => {
  if (!props.editor?.isEditable) return
  activeCol.value = colIdx
  activeRow.value = null
  selectColumn(props.editor, tablePos.value, colIdx)
}

// 点击行把手 -> 全选整行
const handleRowClick = (rowIdx: number) => {
  if (!props.editor?.isEditable) return
  activeRow.value = rowIdx
  activeCol.value = null
  selectRow(props.editor, tablePos.value, rowIdx)
}

// 鼠标在把手上的悬停分割线索引 (0 代表左边缘/上边缘，k 代表第 k-1 与第 k 项之间的分割线)
// 采用全局分割线模型后，鼠标在相邻项交界处移动时，加号 DOM 保持稳定、不反复销毁重建，彻底杜绝闪烁
const hoveredColBorderIndex = ref<number | null>(null)
const hoveredRowBorderIndex = ref<number | null>(null)

const hoveredColBtnLeft = computed(() => {
  if (hoveredColBorderIndex.value === null) return 0
  const idx = hoveredColBorderIndex.value
  if (idx === 0) {
    return 10 // 第 0 列左侧往右稍微偏移，避免被 corner 截断
  }
  let sum = 0
  for (let i = 0; i < idx && i < colPositions.value.length; i++) {
    sum += colPositions.value[i]?.width || 100
  }
  return sum
})

const hoveredRowBtnTop = computed(() => {
  if (hoveredRowBorderIndex.value === null) return 0
  const idx = hoveredRowBorderIndex.value
  if (idx === 0) {
    return 10 // 第 0 行顶部往下稍微偏移，避免被 corner 截断
  }
  let sum = 0
  for (let i = 0; i < idx && i < rowPositions.value.length; i++) {
    sum += rowPositions.value[i]?.height || 36
  }
  return sum
})

const handleColMouseMove = (e: MouseEvent, colIdx: number) => {
  if (!props.editor?.isEditable || isDraggingCol.value || isDraggingRow.value || isAllTableSelected.value || isColumnResizing.value) {
    hoveredColBorderIndex.value = null
    return
  }
  const target = e.currentTarget as HTMLElement
  if (!target) return
  const rect = target.getBoundingClientRect()
  const mouseX = e.clientX - rect.left

  // 50% 阈值判定：前半段属于当前列的左侧分割线 colIdx，后半段属于当前列的右侧分割线 colIdx + 1
  const borderIdx = mouseX >= rect.width / 2 ? colIdx + 1 : colIdx
  hoveredColBorderIndex.value = borderIdx
}

const handleColBarMouseLeave = () => {
  hoveredColBorderIndex.value = null
}

const handleRowMouseMove = (e: MouseEvent, rowIdx: number) => {
  if (!props.editor?.isEditable || isDraggingCol.value || isDraggingRow.value || isAllTableSelected.value || isColumnResizing.value) {
    hoveredRowBorderIndex.value = null
    return
  }
  const target = e.currentTarget as HTMLElement
  if (!target) return
  const rect = target.getBoundingClientRect()
  const mouseY = e.clientY - rect.top

  // 50% 阈值判定：前半段属于当前行的顶部分割线 rowIdx，后半段属于当前行的底部分割线 rowIdx + 1
  const borderIdx = mouseY >= rect.height / 2 ? rowIdx + 1 : rowIdx
  hoveredRowBorderIndex.value = borderIdx
}

const handleRowBarMouseLeave = () => {
  hoveredRowBorderIndex.value = null
}

// 统一的点击分割线加号插入列与行
const handleInsertColByBorder = (borderIdx: number) => {
  if (!props.editor?.isEditable) return
  hoveredColBorderIndex.value = null
  if (borderIdx === 0) {
    handleInsertCol(0, 'before')
  } else {
    handleInsertCol(borderIdx - 1, 'after')
  }
}

const handleInsertRowByBorder = (borderIdx: number) => {
  if (!props.editor?.isEditable) return
  hoveredRowBorderIndex.value = null
  if (borderIdx === 0) {
    handleInsertRow(0, 'before')
  } else {
    handleInsertRow(borderIdx - 1, 'after')
  }
}

// 精准在指定列的左侧或右侧插入一列（无需选中整列高亮）
const handleInsertCol = (colIdx: number, direction: 'before' | 'after') => {
  hoveredColBorderIndex.value = null
  activeCol.value = null
  activeRow.value = null
  isAllTableSelected.value = false

  const tableNode = props.editor.state.doc.nodeAt(tablePos.value)
  if (!tableNode) return
  const map = TableMap.get(tableNode)
  if (colIdx < 0 || colIdx >= map.width) return

  // 将光标定位在目标列的第 0 行单元格内，以普通光标触发插入，无需整列选中高亮
  const cellPos = tablePos.value + 1 + map.map[colIdx]
  props.editor.commands.setTextSelection(cellPos + 1)

  if (direction === 'before') {
    props.editor.commands.addColumnBefore()
  } else {
    props.editor.commands.addColumnAfter()
  }

  const newColIdx = direction === 'before' ? colIdx : colIdx + 1
  ensureColumnWidth(props.editor, tablePos.value, newColIdx)

  // 插入后将普通文本光标聚焦到新插入列的第 0 行单元格内（绝不选中整列）
  nextTick(() => {
    activeCol.value = null
    const newTableNode = props.editor.state.doc.nodeAt(tablePos.value)
    if (newTableNode) {
      const newMap = TableMap.get(newTableNode)
      if (newColIdx < newMap.width) {
        const newCellPos = tablePos.value + 1 + newMap.map[newColIdx]
        props.editor.commands.setTextSelection(newCellPos + 1)
        props.editor.commands.focus()
      }
    }
  })
}

// 精准在指定行的上方或下方插入一行（无需选中整行高亮）
const handleInsertRow = (rowIdx: number, direction: 'before' | 'after') => {
  hoveredRowBorderIndex.value = null
  activeCol.value = null
  activeRow.value = null
  isAllTableSelected.value = false

  const tableNode = props.editor.state.doc.nodeAt(tablePos.value)
  if (!tableNode) return
  const map = TableMap.get(tableNode)
  if (rowIdx < 0 || rowIdx >= map.height) return

  // 将光标定位在目标行的第 0 列单元格内，以普通光标触发插入，无需整行选中高亮
  const cellPos = tablePos.value + 1 + map.map[rowIdx * map.width]
  props.editor.commands.setTextSelection(cellPos + 1)

  if (direction === 'before') {
    props.editor.commands.addRowBefore()
  } else {
    props.editor.commands.addRowAfter()
  }

  const newRowIdx = direction === 'before' ? rowIdx : rowIdx + 1

  // 插入后将普通文本光标聚焦到新插入行的第 0 列单元格内（绝不选中整行）
  nextTick(() => {
    activeRow.value = null
    const newTableNode = props.editor.state.doc.nodeAt(tablePos.value)
    if (newTableNode) {
      const newMap = TableMap.get(newTableNode)
      if (newRowIdx < newMap.height) {
        const newCellPos = tablePos.value + 1 + newMap.map[newRowIdx * newMap.width]
        props.editor.commands.setTextSelection(newCellPos + 1)
        props.editor.commands.focus()
      }
    }
  })
}

// 右键菜单
const contextMenuState = ref({
  visible: false,
  x: 0,
  y: 0,
})

const handleColContextMenu = (e: MouseEvent, colIdx: number) => {
  if (!props.editor?.isEditable) return
  handleColClick(colIdx)
  contextMenuState.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  }
}

const handleRowContextMenu = (e: MouseEvent, rowIdx: number) => {
  if (!props.editor?.isEditable) return
  handleRowClick(rowIdx)
  contextMenuState.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  }
}

const handleTableContextMenu = (e: MouseEvent) => {
  if (!props.editor?.isEditable) return
  const target = e.target as HTMLElement
  const cell = target.closest('td, th') as HTMLElement
  if (cell) {
    const tr = cell.parentElement as HTMLTableRowElement
    activeCol.value = (cell as any).cellIndex ?? null
    activeRow.value = tr?.rowIndex ?? null

    // 关键优化：如果当前右键点击的单元格未处于已选中的 CellSelection 范围内，
    // 将光标自动移入该单元格内部，确保右键菜单里的“拆分单元格”、“向上插入”等针对此单元格精准生效！
    const { selection } = props.editor.state
    const isCellInSelection = (selection instanceof CellSelection) && cell.classList.contains('selectedCell')
    if (!isCellInSelection) {
      try {
        const pos = props.editor.view.posAtDOM(cell, 0)
        props.editor.commands.setTextSelection(pos)
        props.editor.commands.focus()
      } catch {
        // ignore
      }
    }

    contextMenuState.value = {
      visible: true,
      x: e.clientX,
      y: e.clientY,
    }
    e.preventDefault()
  }
}

const handleGlobalClick = (e: MouseEvent) => {
  if (contextMenuState.value.visible) {
    const target = e.target as HTMLElement | null
    if (target?.closest?.('.color-picker-popover, .speed-table-context-menu')) {
      return
    }
    contextMenuState.value.visible = false
  }
}
document.addEventListener('click', handleGlobalClick)

const closeAllMenus = () => {
  contextMenuState.value.visible = false
}

// ======================= 拖拽排序列 / 行交互 =======================
const isDraggingCol = ref(false)
const dragColSourceIndex = ref<number | null>(null)
const dragColTargetIndex = ref<number | null>(null)
const dragColIndicatorLeft = ref<number | null>(null)

const isDraggingRow = ref(false)
const dragRowSourceIndex = ref<number | null>(null)
const dragRowTargetIndex = ref<number | null>(null)
const dragRowIndicatorTop = ref<number | null>(null)

const floatingTooltipPos = ref<{ x: number; y: number } | null>(null)

// 列把手 pointerdown 处理：未激活时点击选中整列变蓝；已是激活状态时才可拖拽排序
const handleColPointerDown = (e: PointerEvent, colIdx: number) => {
  if (!props.editor?.isEditable) return
  if (e.button !== 0) return
  e.preventDefault()

  // 如果尚未选中激活此列：点击为全选整列，变蓝并展示拖拽图标，此时不触发拖拽
  if (activeCol.value !== colIdx || isAllTableSelected.value) {
    handleColClick(colIdx)
    return
  }

  // 只有该列已经变蓝并显示了 drag 图标时，按下才可拖拽
  const startX = e.clientX
  const startY = e.clientY
  let hasMoved = false

  const onPointerMove = (moveEvent: PointerEvent) => {
    const diffX = Math.abs(moveEvent.clientX - startX)
    const diffY = Math.abs(moveEvent.clientY - startY)

    if (!hasMoved && (diffX > 3 || diffY > 3)) {
      hasMoved = true
      isDraggingCol.value = true
      dragColSourceIndex.value = colIdx
      document.body.classList.add('speed-table-is-dragging')
    }

    if (isDraggingCol.value && containerRef.value) {
      floatingTooltipPos.value = { x: moveEvent.clientX, y: moveEvent.clientY }

      const tableRect = containerRef.value.getBoundingClientRect()
      const mouseRelativeX = moveEvent.clientX - tableRect.left

      // 计算当前拖拽列自身的像素范围 [selfLeft, selfRight]
      let selfLeft = 0
      let selfRight = 0
      let curLeft = 0
      for (let i = 0; i < colPositions.value.length; i++) {
        const w = colPositions.value[i].width
        if (i === colIdx) {
          selfLeft = curLeft
          selfRight = curLeft + w
          break
        }
        curLeft += w
      }

      // 1. 若鼠标仍在自身列范围内：完全属于原地，严禁显示任何指示线与徽章，松手不位移
      if (mouseRelativeX >= selfLeft && mouseRelativeX <= selfRight) {
        dragColTargetIndex.value = null
        dragColIndicatorLeft.value = null
      } else {
        // 2. 鼠标已移出自身列，寻找离鼠标最近的垂直分割线（borderIdx: 0 到 colPositions.length）
        let borderIdx = 0
        let indicatorPos = 0
        let accumLeft = 0

        for (let i = 0; i < colPositions.value.length; i++) {
          const w = colPositions.value[i].width
          const colMid = accumLeft + w / 2
          if (mouseRelativeX < colMid) {
            borderIdx = i
            indicatorPos = accumLeft
            break
          }
          accumLeft += w
          borderIdx = i + 1
          indicatorPos = accumLeft
        }

        const from = colIdx
        // 原地未动判定：若分割线依然紧贴自身左边缘(from)或右边缘(from+1)，不展示指示线
        if (borderIdx === from || borderIdx === from + 1) {
          dragColTargetIndex.value = null
          dragColIndicatorLeft.value = null
        } else {
          // 向右移动：由于先从原位置移除 from，后续元素索引前移 1 位，实际目标插入索引为 borderIdx - 1
          // 向左移动：原位置在后方，前面元素索引未受影响，实际目标插入索引为 borderIdx
          dragColTargetIndex.value = borderIdx > from + 1 ? borderIdx - 1 : borderIdx
          dragColIndicatorLeft.value = indicatorPos
        }
      }
    }
  }

  const onPointerUp = () => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)

    if (isDraggingCol.value && dragColSourceIndex.value !== null && dragColTargetIndex.value !== null) {
      const from = dragColSourceIndex.value
      const to = dragColTargetIndex.value
      if (from !== to) {
        moveColumn(props.editor, tablePos.value, from, to)
      }
    } else if (!hasMoved) {
      // 关键：如果只是普通点击把手（未发生拖拽），无论之前是否已处于激活态，100% 触发选择并唤起气泡
      handleColClick(colIdx)
    }

    isDraggingCol.value = false
    document.body.classList.remove('speed-table-is-dragging')
    dragColSourceIndex.value = null
    dragColTargetIndex.value = null
    dragColIndicatorLeft.value = null
    floatingTooltipPos.value = null
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

// 行把手 pointerdown 处理：未激活时点击选中整行变蓝；已是激活状态时才可拖拽移动
const handleRowPointerDown = (e: PointerEvent, rowIdx: number) => {
  if (!props.editor?.isEditable) return
  if (e.button !== 0) return
  e.preventDefault()

  // 如果尚未选中激活此行：点击为全选整行，变蓝并展示拖拽图标，此时不触发拖拽
  if (activeRow.value !== rowIdx || isAllTableSelected.value) {
    handleRowClick(rowIdx)
    return
  }

  // 只有该行已经变蓝并显示了 drag 图标时，按下才可拖拽
  const startX = e.clientX
  const startY = e.clientY
  let hasMoved = false

  const onPointerMove = (moveEvent: PointerEvent) => {
    const diffX = Math.abs(moveEvent.clientX - startX)
    const diffY = Math.abs(moveEvent.clientY - startY)

    if (!hasMoved && (diffX > 3 || diffY > 3)) {
      hasMoved = true
      isDraggingRow.value = true
      dragRowSourceIndex.value = rowIdx
      document.body.classList.add('speed-table-is-dragging')
    }

    if (isDraggingRow.value && containerRef.value) {
      floatingTooltipPos.value = { x: moveEvent.clientX, y: moveEvent.clientY }

      const tableRect = containerRef.value.getBoundingClientRect()
      const mouseRelativeY = moveEvent.clientY - tableRect.top

      // 计算当前拖拽行自身的像素范围 [selfTop, selfBottom]
      let selfTop = 0
      let selfBottom = 0
      let curTop = 0
      for (let i = 0; i < rowPositions.value.length; i++) {
        const h = rowPositions.value[i].height
        if (i === rowIdx) {
          selfTop = curTop
          selfBottom = curTop + h
          break
        }
        curTop += h
      }

      // 1. 若鼠标仍在自身行范围内：完全属于原地，严禁显示任何指示线与徽章，松手不位移
      if (mouseRelativeY >= selfTop && mouseRelativeY <= selfBottom) {
        dragRowTargetIndex.value = null
        dragRowIndicatorTop.value = null
      } else {
        // 2. 鼠标已移出自身行，寻找离鼠标最近的水平分割线（borderIdx: 0 到 rowPositions.length）
        let borderIdx = 0
        let indicatorPos = 0
        let accumTop = 0

        for (let i = 0; i < rowPositions.value.length; i++) {
          const h = rowPositions.value[i].height
          const rowMid = accumTop + h / 2
          if (mouseRelativeY < rowMid) {
            borderIdx = i
            indicatorPos = accumTop
            break
          }
          accumTop += h
          borderIdx = i + 1
          indicatorPos = accumTop
        }

        const from = rowIdx
        // 原地未动判定：若分割线依然紧贴自身上边缘(from)或下边缘(from+1)，不展示指示线
        if (borderIdx === from || borderIdx === from + 1) {
          dragRowTargetIndex.value = null
          dragRowIndicatorTop.value = null
        } else {
          // 向下移动：先移除 from，后续行索引前移 1 位，实际目标插入索引为 borderIdx - 1
          // 向上移动：原位置在下方，前面行索引未受影响，实际目标插入索引为 borderIdx
          dragRowTargetIndex.value = borderIdx > from + 1 ? borderIdx - 1 : borderIdx
          dragRowIndicatorTop.value = indicatorPos
        }
      }
    }
  }

  const onPointerUp = () => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)

    if (isDraggingRow.value && dragRowSourceIndex.value !== null && dragRowTargetIndex.value !== null) {
      const from = dragRowSourceIndex.value
      const to = dragRowTargetIndex.value
      if (from !== to) {
        moveRow(props.editor, tablePos.value, from, to)
      }
    } else if (!hasMoved) {
      // 关键：如果只是普通点击把手（未发生拖拽），无论之前是否已处于激活态，100% 触发选择并唤起气泡
      handleRowClick(rowIdx)
    }

    isDraggingRow.value = false
    document.body.classList.remove('speed-table-is-dragging')
    dragRowSourceIndex.value = null
    dragRowTargetIndex.value = null
    dragRowIndicatorTop.value = null
    floatingTooltipPos.value = null
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

// 鼠标靠近单元格右边缘时精准识别列索引
const getCellColumnIndex = (cellEl: HTMLTableCellElement): number => {
  if (props.editor && props.node) {
    try {
      const pos = props.editor.view.posAtDOM(cellEl, 0)
      const $pos = props.editor.state.doc.resolve(pos)
      for (let d = $pos.depth; d > 0; d--) {
        const n = $pos.node(d)
        if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
          const cellStart = $pos.start(d) - 1
          const map = TableMap.get(props.node)
          const relPos = cellStart - (tablePos.value + 1)
          const cellRect = map.findCell(relPos)
          return cellRect.right - 1
        }
      }
    } catch {
      // fallback
    }
  }
  let col = 0
  let prev = cellEl.previousElementSibling as HTMLTableCellElement | null
  while (prev) {
    col += prev.colSpan || 1
    prev = prev.previousElementSibling as HTMLTableCellElement | null
  }
  return col + (cellEl.colSpan || 1) - 1
}

// 启动自定义通天引导线列宽拖拽（先拖拽引导线，释放后调整宽度）
const startColumnResize = (e: MouseEvent | PointerEvent, colIdx: number) => {
  if (!containerRef.value || !colHandlesBarRef.value) return
  const table = tableWrapperRef.value?.querySelector('table')
  if (!table) return

  // 1. 获取当前每列的渲染宽度
  const renderedWidths = renderedColPositions.value.map((c) => c.width)
  const startWidth = renderedWidths[colIdx] || 100
  const startX = e.clientX

  // 2. 测量引导线在 containerRef 中的初始 X 坐标
  const containerRect = containerRef.value.getBoundingClientRect()
  const colHandles = colHandlesBarRef.value.children
  const targetHandle = colHandles[colIdx] as HTMLElement | undefined
  let baseRightInContainer: number
  if (targetHandle) {
    const handleRect = targetHandle.getBoundingClientRect()
    baseRightInContainer = handleRect.right - containerRect.left
  } else {
    let accum = 0
    for (let i = 0; i <= colIdx; i++) {
      accum += renderedWidths[i] || 100
    }
    const scrollLeft = tableWrapperRef.value?.scrollLeft || 0
    baseRightInContainer = accum - scrollLeft
  }

  // 3. 测量表格实际单元格内容高度，确保精确贯穿表格内容区，底端不穿透覆盖底部横向滚动条
  const tableHeight = table?.offsetHeight || tableWrapperRef.value?.clientHeight || 300
  guideLineHeight.value = tableHeight
  guideLineLeft.value = baseRightInContainer
  currentGuideWidth.value = Math.round(startWidth)
  isColumnResizing.value = true
  hoveredBorderColIndex.value = null
  hoveredBorderLeft.value = null

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  const onMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - startX
    const minColWidth = 40
    const newWidth = Math.max(minColWidth, startWidth + deltaX)
    const actualDeltaX = newWidth - startWidth
    guideLineLeft.value = baseRightInContainer + actualDeltaX
    currentGuideWidth.value = Math.round(newWidth)
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    const finalWidth = currentGuideWidth.value
    isColumnResizing.value = false
    guideLineLeft.value = null

    if (Math.abs(finalWidth - startWidth) >= 1) {
      applyTableColumnWidth(
        props.editor,
        tablePos.value,
        colIdx,
        finalWidth,
        renderedWidths
      )
    }
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// 表格内部鼠标移动：靠近单元格分割线 5px 范围内浮现蓝色指示线（和以前类似，悬浮到边上触发）
const handleTableMouseMove = (e: MouseEvent) => {
  if (!props.editor?.isEditable || isColumnResizing.value || isDraggingCol.value || isDraggingRow.value) return
  const target = (e.target as HTMLElement)?.closest('td, th') as HTMLTableCellElement | null
  if (!target || !tableWrapperRef.value) {
    hoveredBorderColIndex.value = null
    hoveredBorderLeft.value = null
    if (tableWrapperRef.value) tableWrapperRef.value.style.cursor = ''
    return
  }

  const rect = target.getBoundingClientRect()
  const distToRight = Math.abs(e.clientX - rect.right)
  const distToLeft = Math.abs(e.clientX - rect.left)

  if (distToRight <= 5 && e.clientY >= rect.top && e.clientY <= rect.bottom) {
    const colIndex = getCellColumnIndex(target)
    if (colIndex !== -1 && colIndex < colPositions.value.length) {
      hoveredBorderColIndex.value = colIndex
      updateHoveredBorderPosition(colIndex)
      tableWrapperRef.value.style.cursor = 'col-resize'
      return
    }
  } else if (distToLeft <= 5 && e.clientY >= rect.top && e.clientY <= rect.bottom) {
    const colIndex = getCellColumnIndex(target)
    if (colIndex > 0) {
      const prevColIndex = colIndex - (target.colSpan || 1)
      if (prevColIndex >= 0) {
        hoveredBorderColIndex.value = prevColIndex
        updateHoveredBorderPosition(prevColIndex)
        tableWrapperRef.value.style.cursor = 'col-resize'
        return
      }
    }
  }

  hoveredBorderColIndex.value = null
  hoveredBorderLeft.value = null
  tableWrapperRef.value.style.cursor = ''
}

const handleTableMouseDown = (e: MouseEvent) => {
  if (!props.editor?.isEditable) return
  if (e.button !== 0) return
  if (hoveredBorderColIndex.value !== null) {
    e.preventDefault()
    e.stopPropagation()
    startColumnResize(e, hoveredBorderColIndex.value)
  }
}

const handleTableMouseLeave = () => {
  if (!isColumnResizing.value) {
    hoveredBorderColIndex.value = null
    hoveredBorderLeft.value = null
    if (tableWrapperRef.value) tableWrapperRef.value.style.cursor = ''
  }
}

</script>

<style lang="less">
.speed-table-node-view {
  margin: 24px 0 16px 0;
  max-width: 100%;

  .speed-table-container {
    position: relative;
    user-select: none;
    max-width: 100%;

    &.is-dragging {
      cursor: grabbing !important;
    }

    // 默认辅助把手栏与角标隐藏（不常驻破坏排版）
    .speed-table-corner,
    .speed-table-handle-cols-viewport,
    .speed-table-handle-rows-viewport {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
    }

    // 鼠标悬停到表格、或表格内有光标/聚焦选中时，平滑显现
    &.show-handles {

      .speed-table-corner,
      .speed-table-handle-cols-viewport,
      .speed-table-handle-rows-viewport {
        opacity: 1;
        pointer-events: auto;
      }
    }
  }

  // 1. 左上角角标：绝对定位在表格外侧 (-20px, -20px)，不挤占表格本身位置
  .speed-table-corner {
    position: absolute;
    left: -20px;
    top: -20px;
    width: 20px;
    height: 20px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    border-left: 1px solid #e2e8f0;
    border-top-left-radius: 4px;
    box-sizing: border-box;
    z-index: 10;
    transition: all 0.2s;

    &:hover {
      background: #e2e8f0;
    }

    &.is-active {
      background: #2F8EF4CC !important;
      border-color: #ffffff !important;
    }
  }

  .speed-table-container.all-selected {
    .speed-table-corner {
      background: #2F8EF4CC !important;
      border-color: #ffffff !important;
    }

    .col-handle {
      background: #2F8EF4CC !important;
      border-color: #ffffff !important;
      color: #fff !important;
    }

    .row-handle {
      background: #2F8EF4CC !important;
      border-color: #ffffff !important;
      color: #fff !important;
    }
  }

  // 2. 顶部列把手视口：限制在表格容器可视宽度内，超出部分由 overflow: hidden 裁剪，随表格水平滚动 1:1 像素级平移
  .speed-table-handle-cols-viewport {
    position: absolute;
    top: -20px;
    left: 0;
    right: 0px;
    height: 20px;
    overflow: hidden;
    pointer-events: none;
    z-index: 10;

    .speed-table-handle-cols {
      display: flex;
      position: absolute;
      top: 0;
      left: 0;
      height: 20px;
      pointer-events: auto;
      border-right: 1px solid #e2e8f0;
      border-top-right-radius: 4px;
      will-change: transform;

      .col-handle {
        position: relative;
        flex-shrink: 0;
        height: 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        border-left: 1px solid #e2e8f0;
        color: #94a3b8;
        box-sizing: border-box;
        transition: background 0.15s, color 0.15s;
        cursor: pointer;

        &:last-child {
          border-top-right-radius: 4px;
        }

        .drag-icon-col {
          line-height: 1;
        }

        // hover 时仅变浅灰，绝不出现 drag icon，不可拖拽
        &:hover:not(.is-active) {
          background: #f1f5f9;
        }

        // 点击选中激活时是科技蓝，白色边框分隔，各列清晰分明
        &.is-active {
          background: #2F8EF4CC;
          border: 1px solid #e2e8f0;
          border-right: none;
          color: #fff;
          cursor: grab;
          z-index: 2;
        }

        &.is-dragging-source {
          opacity: 0.4;
          cursor: grabbing;
        }
      }

      // 精准插入加号按钮：以列分割线为基准单例定位，translateX(-50%) 居中对齐，跨列平滑过渡不闪动
      .col-add-btn {
        position: absolute;
        top: 2px;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: #2F8EF4CC;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 25;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        transform: translateX(-50%);
        transition: transform 0.15s ease, background 0.15s ease;
        animation: addBtnColPop 0.12s ease-out;

        &:hover {
          background: #1d4ed8;
          transform: translateX(-50%) scale(1.15);
        }
      }
    }
  }

  // 3. 左侧行把手视口：限制在表格容器可视高度内，超出部分由 overflow: hidden 裁剪，随垂直滚动 1:1 同步平移
  .speed-table-handle-rows-viewport {
    position: absolute;
    left: -20px;
    top: 0;
    bottom: 0;
    width: 20px;
    overflow: hidden;
    pointer-events: none;
    z-index: 10;

    .speed-table-handle-rows {
      display: flex;
      flex-direction: column;
      position: absolute;
      left: 0;
      top: 0;
      width: 20px;
      pointer-events: auto;
      border-bottom: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      will-change: transform;

      .row-handle {
        position: relative;
        flex-shrink: 0;
        width: 20px;
        background: #f8fafc;
        border-left: 1px solid #e2e8f0;
        border-top: 1px solid #e2e8f0;
        color: #94a3b8;
        box-sizing: border-box;
        transition: background 0.15s, color 0.15s;
        cursor: pointer;

        &:last-child {
          border-bottom-left-radius: 4px;
        }

        .drag-icon-row {
          line-height: 1;
        }

        // hover 时仅变浅灰，绝不出现 drag icon，不可拖拽
        &:hover:not(.is-active) {
          background: #f1f5f9;
        }

        // 点击选中激活时是科技蓝，白色边框分隔，各列清晰分明
        &.is-active {
          background: #2F8EF4CC;
          border: 1px solid #e2e8f0;
          border-right: none;
          color: #fff;
          cursor: grab;
          z-index: 2;
        }

        &.is-dragging-source {
          opacity: 0.4;
          cursor: grabbing;
        }
      }

      // 精准插入加号按钮：以行分割线为基准单例定位，translateY(-50%) 居中对齐，跨行平滑过渡不闪动
      .row-add-btn {
        position: absolute;
        left: 2px;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: #2F8EF4CC;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 25;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        transform: translateY(-50%);
        transition: transform 0.15s ease, background 0.15s ease;
        animation: addBtnRowPop 0.12s ease-out;

        &:hover {
          background: #1d4ed8;
          transform: translateY(-50%) scale(1.15);
        }
      }
    }
  }

  // 4. 核心表格区：正常流排版，宽度 100%，与正文段落严格左对齐，聚焦/失焦绝无任何位移抖动
  .tableWrapper {
    width: 100%;
    overflow-x: auto;
    user-select: text;
    max-width: 100%;
    margin: 0 !important;

    table.speed-editor-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      table-layout: fixed;
      border: 1px solid #e2e8f0;
      background: #fff;

      th,
      td {
        border: 1px solid #e2e8f0;
        padding: 6px 10px;
        vertical-align: top;
        position: relative;
        box-sizing: border-box;
        min-width: 50px;

        p {
          margin: 0;
        }
      }

      th {
        background-color: #f8fafc;
        font-weight: 600;
        color: #334155;
      }

      // 单元格被选中高亮：使用轻量通透的科技蓝，并补充 1px 选中内描边，确保所有单元格网格线完全清晰可见
      .selectedCell:after {
        z-index: 2;
        position: absolute;
        content: '';
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(59, 130, 246, 0.12);
        box-sizing: border-box;
        pointer-events: none;
      }
    }
  }

  // 拖拽指示线
  .drag-indicator-col {
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #2F8EF4CC;
    z-index: 100;
    pointer-events: none;
  }

  .drag-indicator-row {
    left: 0;
    right: 0;
    height: 2px;
    background-color: #2F8EF4CC;
    z-index: 100;
    pointer-events: none;
  }

  // 移动浮层胶囊提示徽章
  .drag-floating-badge {
    padding: 6px 14px;
    background: #2F8EF4CC;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    pointer-events: none;
    transform: translate(-50%, -50%);
  }

  // 6. 列边缘悬浮指示蓝线（和以前类似，悬浮到边上即浮现，通天拉通整表）
  .column-hover-indicator {
    position: absolute;
    width: 2px;
    background-color: #2F8EF4;
    z-index: 120;
    pointer-events: none;
    transform: translateX(-50%);
    box-shadow: 0 0 4px rgba(47, 142, 244, 0.4);
  }

  // 7. 列宽调整通天实时跟随引导线（一整根贯穿把手与表格底端，100% 紧跟鼠标光标）
  .column-resize-guide-line {
    position: absolute;
    width: 2px;
    background-color: #2F8EF4;
    z-index: 150;
    pointer-events: none;
    transform: translateX(-50%);
    box-shadow: 0 0 6px rgba(47, 142, 244, 0.5);

    .resize-guide-bubble {
      position: absolute;
      top: -26px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: #ffffff;
      font-size: 11px;
      line-height: 1;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      pointer-events: none;
      font-weight: 500;
    }
  }

  // 8. 左右水平滚动边缘渐变阴影（语雀/飞书同款：存在滚动内容时浮现，到达边缘时平滑隐去）
  .table-scroll-shadow-left,
  .table-scroll-shadow-right {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 16px;
    pointer-events: none;
    z-index: 20;
    opacity: 0;
    transition: opacity 0.2s ease, top 0.15s ease;

    &.is-active {
      opacity: 1;
    }
  }

  .table-scroll-shadow-left {
    left: 0;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.02) 70%, transparent 100%);
  }

  .table-scroll-shadow-right {
    right: 0;
    background: linear-gradient(to left, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.02) 70%, transparent 100%);
    border-top-right-radius: 4px;
  }

  // 当把手栏浮现时，阴影同步向上覆盖到顶部把手栏（-20px），整体对齐一致，覆盖左上角与右上角
  .speed-table-container.show-handles {
    .table-scroll-shadow-left,
    .table-scroll-shadow-right {
      top: -20px;
    }
  }

  // 拖拽排序列或行期间，隐藏表格上方所有气泡菜单，避免挡住操作视线
  body.speed-table-is-dragging {
    .tiptap-bubble-menu,
    .bubble-menu-wrapper,
    .table-bubble-menu {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  }
}

@keyframes addBtnColPop {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.6);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

@keyframes addBtnRowPop {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.6);
  }

  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}
</style>
