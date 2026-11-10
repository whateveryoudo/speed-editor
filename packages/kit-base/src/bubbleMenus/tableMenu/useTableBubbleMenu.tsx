// 此hook为table专用固定气泡，直接点击时显示，与单元格选中和文本选中互斥
import { ref, h, computed, onUnmounted, type VNode, nextTick } from 'vue'
import { computePosition, offset, flip, shift } from '@floating-ui/dom'
import type { Editor } from '@tiptap/core'
import { CellSelection, TableMap } from '@tiptap/pm/tables'
import {
  MergeCellsOutlined, SplitCellsOutlined, DeleteColumnOutlined, DeleteRowOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  InsertRowAboveOutlined, InsertRowBelowOutlined, InsertRowLeftOutlined, InsertRowRightOutlined, DeleteOutlined, TableOutlined,
} from '@ant-design/icons-vue'
import BackgroundColor from '@kb/menus/backgroundColor.vue'
import TableSettingsPopover from './TableSettingsPopover.vue'
// 表格节点信息接口
export interface TableNodeInfo {
  table: any // Table node
  tablePos: number // 表格在文档中的位置
  tableDOM: HTMLElement | null // 表格的 DOM 元素
  cursorPos: number // 当前光标位置
}
// 气泡菜单项接口
export interface TableBubbleMenuItem {
  iconRender: VNode
  title: string
  class?: string
  name?: string
  disabled?: ((editor: Editor) => boolean)
  useComponnent?: boolean
  key: string
  action?: (editor: Editor, payload?: any) => void;
  children?: TableBubbleMenuItem[];
}
const tableMenuItemMaps: Record<string, TableBubbleMenuItem> = {
  'align': {
    title: '对齐方式',
    key: 'align',
    iconRender: h(AlignLeftOutlined),
    children: [{
      title: '左对齐',
      key: 'align-left',
      iconRender: h(AlignLeftOutlined),
      action: (editor: Editor) => {
        editor?.chain().focus().setCellAttribute('align', 'left').run()
      },
    }, {
      title: '居中对齐',
      key: 'align-center',
      iconRender: h(AlignCenterOutlined),
      action: (editor: Editor) => {
        editor?.chain().focus().setCellAttribute('align', 'center').run()
      },
    }, {
      title: '右对齐',
      key: 'align-right',
      iconRender: h(AlignRightOutlined),
      action: (editor: Editor) => {
        editor?.chain().focus().setCellAttribute('align', 'right').run()
      },
    }],
  },
  'merge-cells': {
    title: '合并单元格',
    iconRender: h(MergeCellsOutlined),
    key: 'merge-cells',
    disabled: (editor: Editor) => !editor?.can().mergeCells(),
    action: (editor: Editor) => {
      editor?.chain().focus().mergeCells().run()
    },
  },
  'split-cells': {
    title: '拆分单元格',
    iconRender: h(SplitCellsOutlined),
    key: 'split-cells',
    disabled: (editor: Editor) => !editor?.can().splitCell(),
    action: (editor: Editor) => {
      editor?.chain().focus().splitCell().run()
    },
  },
  'background-color': {
    title: '单元格背景色',
    useComponnent: true,
    iconRender: h(BackgroundColor),
    key: 'background-color',
    action: (editor: Editor, payload: any) => {
      editor?.chain().focus().setCellAttribute('backgroundColor', payload.color).run()
    },
  },
  'add-column-before': {
    title: '往前增加列',
    iconRender: h(InsertRowRightOutlined),
    key: 'add-column-before',
    action: (editor: Editor) => {
      editor?.chain().focus().addColumnBefore().run()
    },
  },
  'add-column-after': {
    title: '往后增加列',
    iconRender: h(InsertRowLeftOutlined),
    key: 'add-column-after',
    action: (editor: Editor) => {
      editor?.chain().focus().addColumnAfter().run()
    },
  },
  'delete-column': {
    title: '删除列',
    iconRender: h(DeleteColumnOutlined),
    key: 'delete-column',
    action: (editor: Editor) => {
      editor?.chain().focus().deleteColumn().run()
    },
  },
  'add-row-before': {
    title: '往前增加行',
    iconRender: h(InsertRowAboveOutlined),
    key: 'add-row-before',
    action: (editor: Editor) => {
      editor?.chain().focus().addRowBefore().run()
    },
  },
  'add-row-after': {
    title: '往后增加行',
    iconRender: h(InsertRowBelowOutlined),
    key: 'add-row-after',
    action: (editor: Editor) => {
      editor?.chain().focus().addRowAfter().run()
    },
  },
  'delete-row': {
    title: '删除行',
    iconRender: h(DeleteRowOutlined),
    key: 'delete-row',
    action: (editor: Editor) => {
      editor?.chain().focus().deleteRow().run()
    },
  },
  'delete-table': {
    title: '删除表格',
    iconRender: h(DeleteOutlined, { style: { color: '#ef4444' } }),
    key: 'delete-table',
    action: (editor: Editor) => {
      editor?.chain().focus().deleteTable().run()
    },
  },
  'table-settings': {
    title: '表格样式与属性',
    iconRender: h(TableSettingsPopover),
    key: 'table-settings',
    useComponnent: true,
  },
  'toggle-header-row': {
    title: '切换标题行',
    iconRender: h(TableOutlined),
    key: 'toggle-header-row',
    action: (editor: Editor) => {
      editor?.chain().focus().toggleHeaderRow().run()
    },
  },
  'toggle-header-column': {
    title: '切换标题列',
    iconRender: h(TableOutlined),
    key: 'toggle-header-column',
    action: (editor: Editor) => {
      editor?.chain().focus().toggleHeaderColumn().run()
    },
  },
}
// 现代精简收敛菜单项（结构性增删行列已由辅助把手承载，尾部提供删除表格能力）
export const tableItems = [
  tableMenuItemMaps['background-color'],
  tableMenuItemMaps['align'],
  tableMenuItemMaps['merge-cells'],
  tableMenuItemMaps['split-cells'],
  tableMenuItemMaps['delete-table'],
]
// 选中单元格的气泡菜单保持一致
export const bubbleTableItem = tableItems
interface UseTableBubbleMenuOptions {
  scrollElem?: HTMLElement
}


// 表格固定气泡菜单

export function useTableBubbleMenu(editor: Editor, options: UseTableBubbleMenuOptions = {}) {
  const isVisible = ref(false)
  const floatingElement = ref<HTMLElement | null>(null)
  let cleanup: (() => void) | null = null
  const { scrollElem = document.querySelector('.editor-content-wrap') } = options
  // 检查点击是否在气泡菜单外部
  const isClickOutside = (event: MouseEvent): boolean => {
    if (!floatingElement.value) return true

    // 检查点击的目标是否在气泡菜单内部
    const target = event.target as Node
    if (floatingElement.value.contains(target)) {
      return false
    }

    // 检查点击的目标是否在表格容器内部（包括把手、角标、表格内容等，点击行列把手绝不当作外部点击）
    const element = target as Element
    if (element?.closest?.('.speed-table-container, .speed-table-node-view, .tableWrapper, table')) {
      return false
    }

    // 检查点击的目标是否在表格内部
    const tableInfo = getTableNodeInfo()
    if (tableInfo && tableInfo.tableDOM && tableInfo.tableDOM.contains(target)) {
      return false
    }

    // 排除 Ant Design 的 Popover/Dropdown 组件（防止气泡菜单被其他组件触发）
    const antdPopover = (target as Element).closest('.ant-popover')
    const antdDropdown = (target as Element).closest('.ant-dropdown')
    const antdTooltip = (target as Element).closest('.ant-tooltip')
    const antdModal = (target as Element).closest('.ant-modal')

    if (antdPopover || antdDropdown || antdTooltip || antdModal) {
      return false
    }

    return true
  }

  // 处理全局点击事件
  const handleGlobalClick = (event: MouseEvent) => {
    // 核心保护：如果当前依然处于多单元格框选状态，绝不允许误判关闭气泡！
    if (shouldShow.value) {
      return
    }
    if (isVisible.value && isClickOutside(event)) {
      // 延迟关闭，避免与菜单项点击冲突
      setTimeout(() => {
        if (isVisible.value && !shouldShow.value) {
          hideBubbleMenu()
        }
      }, 100)
    }
  }

  // 通过光标位置获取表格节点信息
  const getTableNodeInfo = (): TableNodeInfo | null => {
    if (!editor || !editor.state) return null

    const { selection } = editor.state

    // 如果当前是 CellSelection（单元格多选），直接精准取单元格所在的 table 节点与 DOM
    if (selection instanceof CellSelection) {
      for (let depth = selection.$anchorCell.depth; depth >= 0; depth--) {
        const node = selection.$anchorCell.node(depth)
        if (node.type.name === 'table') {
          const tablePos = selection.$anchorCell.before(depth)
          let tableDOM: HTMLElement | null = null
          try {
            const domAtPos = editor.view.domAtPos(selection.$anchorCell.pos).node as HTMLElement
            tableDOM = domAtPos?.closest?.('table') || null
          } catch {
            // ignore
          }
          return {
            table: node,
            tablePos,
            tableDOM,
            cursorPos: selection.from,
          }
        }
      }
    }

    const { $from } = selection

    // 查找光标所在的表格节点
    let tablePos = -1
    let table = null

    // 从当前位置向上查找表格节点
    for (let depth = $from.depth; depth >= 0; depth--) {
      const node = $from.node(depth)
      // 检查是否是表格相关的节点类型
      if (node.type.name === 'table') {
        table = node
        tablePos = $from.before(depth)
        break
      }
      // 如果找到了 tr、td、th 等表格相关节点，继续向上查找 table 节点
      if (['table_row', 'table_cell', 'table_header'].includes(node.type.name)) {
        continue
      }
    }

    if (!table || tablePos === -1) return null

    // 获取表格的 DOM 元素（优先 domAtPos.closest('table')，兼顾各类自定义 nodeView 包装）
    let tableDOM: HTMLElement | null = null
    try {
      const domAtPos = editor.view.domAtPos($from.pos).node as HTMLElement
      tableDOM = domAtPos?.closest?.('table') || null
    } catch {
      // ignore
    }
    if (!tableDOM) {
      try {
        const tableNodeDOM = editor.view.nodeDOM(tablePos) as HTMLElement
        tableDOM = tableNodeDOM?.nodeName === 'TABLE' ? tableNodeDOM : (tableNodeDOM?.closest?.('table') || null)
      } catch (error) {
        console.warn('Failed to get table DOM:', error)
      }
    }

    return {
      table,
      tablePos,
      tableDOM,
      cursorPos: $from.pos
    }
  }

  // 获取当前选区（单个单元格、整列、整行）对应的 DOM 矩形
  const getSelectionTargetInfo = () => {
    if (!editor || !editor.view) return null
    const { selection } = editor.state
    const { view } = editor

    // 1. 如果是单元格选择（CellSelection，如点击把手全选或框选多格）
    if (selection instanceof CellSelection) {
      const tableInfo = getTableNodeInfo()
      const tableDOM = tableInfo?.tableDOM

      // 关键优化：如果是全选整个表格，直接按照可视的 tableWrapper 容器居中定位，完全不按全宽算，绝对稳定居中！
      if (selection.isColSelection() && selection.isRowSelection()) {
        const tableWrapper = tableDOM?.closest('.tableWrapper') as HTMLElement | null
        if (tableWrapper) {
          return {
            rect: tableWrapper.getBoundingClientRect(),
            isFirstRow: true,
          }
        }
      }

      // 核心优化：瞬间通过 anchorCell 与 headCell 计算选区包围盒（0 延迟、完全不依赖 DOM 样式渲染帧，杜绝点击把手时瞬间闪烁到表格原点）
      try {
        const getCellDOMFromPos = (pos: number) => {
          const domAtPos = view.domAtPos(pos + 1).node as HTMLElement
          return (domAtPos?.closest ? domAtPos.closest('td, th') : domAtPos?.parentElement?.closest('td, th')) as HTMLElement | null
        }
        const anchorDOM = getCellDOMFromPos(selection.$anchorCell.pos)
        const headDOM = getCellDOMFromPos(selection.$headCell.pos)
        if (anchorDOM && headDOM) {
          const r1 = anchorDOM.getBoundingClientRect()
          const r2 = headDOM.getBoundingClientRect()
          const minLeft = Math.min(r1.left, r2.left)
          const minTop = Math.min(r1.top, r2.top)
          const maxRight = Math.max(r1.right, r2.right)
          const maxBottom = Math.max(r1.bottom, r2.bottom)

          const isRow = selection.isRowSelection?.() && !selection.isColSelection?.()
          const tableWrapper = tableDOM?.closest('.tableWrapper') as HTMLElement | null
          const wrapperRect = tableWrapper ? tableWrapper.getBoundingClientRect() : null

          // 如果该列/选区已被横向滚动完全滚出了当前可见区域，返回 null（气泡不脱靶显示在边缘）
          if (wrapperRect && (maxRight < wrapperRect.left || minLeft > wrapperRect.right)) {
            return null
          }

          let finalLeft = minLeft
          let finalWidth = Math.max(20, maxRight - minLeft)

          // 仅当是整行选中（超长整行）时，才按用户视口裁剪后的可视宽度居中！
          // 列选中或局部单元格选中则死死锚定该选区本身的位置，绝不偏移到表格左上角！
          if (isRow && wrapperRect) {
            finalLeft = Math.max(minLeft, wrapperRect.left)
            const finalRight = Math.min(maxRight, wrapperRect.right)
            finalWidth = Math.max(20, finalRight - finalLeft)
          }

          const tr1 = anchorDOM.parentElement as HTMLTableRowElement
          const tr2 = headDOM.parentElement as HTMLTableRowElement
          const isFirstRow = (tr1 && tr1.rowIndex === 0) || (tr2 && tr2.rowIndex === 0)

          return {
            rect: new DOMRect(finalLeft, minTop, finalWidth, Math.max(20, maxBottom - minTop)),
            isFirstRow,
          }
        }
      } catch {
        // ignore
      }

      // 降级兜底：从当前表格中获取已渲染 .selectedCell 的单元格
      let cells: HTMLElement[] = []
      if (tableDOM) {
        cells = Array.from(tableDOM.querySelectorAll('.selectedCell')) as HTMLElement[]
      }

      // 降级兜底：如果 DOM 尚未渲染 selectedCell class，通过选区坐标精准解析
      if (cells.length === 0) {
        selection.forEachCell((_node, pos) => {
          const dom = view.nodeDOM(pos) as HTMLElement
          if (dom && dom.nodeType === 1) {
            cells.push(dom)
          } else {
            try {
              // 关键：pos + 1 进入单元格内部节点，确保最近的 td/th 能够被 100% 查找到
              const domAtPos = view.domAtPos(pos + 1).node as HTMLElement
              const cell = domAtPos?.closest ? domAtPos.closest('td, th') : domAtPos?.parentElement?.closest('td, th')
              if (cell) cells.push(cell as HTMLElement)
            } catch {
              // ignore
            }
          }
        })
      }

      if (cells.length > 0) {
        let minLeft = Infinity
        let minTop = Infinity
        let maxRight = -Infinity
        let maxBottom = -Infinity
        let isFirstRow = false

        cells.forEach((cell) => {
          const rect = cell.getBoundingClientRect()
          minLeft = Math.min(minLeft, rect.left)
          minTop = Math.min(minTop, rect.top)
          maxRight = Math.max(maxRight, rect.right)
          maxBottom = Math.max(maxBottom, rect.bottom)
          const tr = cell.parentElement as HTMLTableRowElement
          if (tr && tr.rowIndex === 0) {
            isFirstRow = true
          }
        })

        const isRow = selection.isRowSelection?.() && !selection.isColSelection?.()
        const tableWrapper = tableDOM?.closest('.tableWrapper') as HTMLElement | null
        const wrapperRect = tableWrapper ? tableWrapper.getBoundingClientRect() : null

        if (wrapperRect && (maxRight < wrapperRect.left || minLeft > wrapperRect.right)) {
          return null
        }

        let finalLeft = minLeft
        let finalWidth = Math.max(20, maxRight - minLeft)

        if (isRow && wrapperRect) {
          finalLeft = Math.max(minLeft, wrapperRect.left)
          const finalRight = Math.min(maxRight, wrapperRect.right)
          finalWidth = Math.max(20, finalRight - finalLeft)
        }

        return {
          rect: new DOMRect(finalLeft, minTop, finalWidth, Math.max(20, maxBottom - minTop)),
          isFirstRow,
        }
      }
    }

    // 2. 核心保护：单格普通光标打字绝不返回任何矩形，100% 拒绝定位！
    return null
  }

  // 响应式版本号：确保 ProseMirror 的非响应式状态变更能 100% 驱动 Vue 的 computed 刷新！
  const selectionVersion = ref(0)

  const checkShouldShow = (): boolean => {
    if (!editor || !editor.isEditable) return false

    const tableInfo = getTableNodeInfo()
    if (!tableInfo) return false

    // 如果表格处于拖拽移动行列状态，静默不显示
    const isDragging = tableInfo.tableDOM?.closest('.is-dragging')
    if (isDragging) return false

    const { selection } = editor.state

    // 核心规则：必须是 CellSelection（多单元格选区）
    if (!(selection instanceof CellSelection)) {
      return false
    }

    // 单格选区（起点和终点同一个单元格）绝对不显示气泡！
    if (selection.$anchorCell.pos === selection.$headCell.pos) {
      return false
    }

    // 只有框选多个单元格、整行、整列、全选表格时才展示气泡
    return true
  }

  // 判断是否应该显示气泡菜单
  const shouldShow = computed(() => {
    // 建立与 selectionVersion 的依赖关系
    selectionVersion.value
    return checkShouldShow()
  })

  // 更新气泡菜单位置
  const updatePosition = async () => {
    if (!floatingElement.value) return

    const tableInfo = getTableNodeInfo()
    if (!tableInfo || !tableInfo.tableDOM) return

    const targetInfo = getSelectionTargetInfo()
    // 关键优化：如果当前选区没有有效的目标矩形（例如已被横向滚动移出可视区域），坚决隐藏气泡！
    // 绝不兜底降级到整个表格，彻底杜绝无选区时气泡挂在表格左上角的 bug！
    if (!targetInfo) {
      hideBubbleMenu()
      return
    }
    const targetRect = targetInfo.rect
    // 关键：如果选区包含了首行或整列选中，表格上方有 20px 的列手柄栏（含 ::: 拖拽把手）
    // 需要额外避开 20px（20px 把手 + 8px 间距 = 28px），确保气泡端正悬浮在把手上方，绝不压在把手上！
    const isCol = editor.state.selection instanceof CellSelection && (editor.state.selection as any).isColSelection?.()
    const isTopHandlePresent = targetInfo?.isFirstRow || isCol
    const topOffset = isTopHandlePresent ? 28 : 8

    // 获取顶部工具栏（header / MenuBar）的位置，计算气泡绝不能越过的顶部红线
    const editorWrap = (floatingElement.value.offsetParent || editor.view.dom.closest('.speed-editor') || document.querySelector('.speed-editor')) as HTMLElement | null
    const headerEl = (editorWrap?.querySelector('.header') || document.querySelector('.ste-menu-bar, .header')) as HTMLElement | null

    let minAllowedTop = 8 // 默认留 8px 安全边距
    let availableTopSpace = 999
    const wrapRect = editorWrap?.getBoundingClientRect() || new DOMRect()

    if (editorWrap && headerEl && headerEl.offsetHeight > 0) {
      const headerRect = headerEl.getBoundingClientRect()
      // header 的下边缘在 editorWrap 坐标系中的 Y 坐标 + 8px 安全间距
      minAllowedTop = (headerRect.bottom - wrapRect.top) + 8
      // 选区/把手顶部到 header 下边缘的实际可用高度（若存在 20px 把手需扣除）
      const topBoundary = isTopHandlePresent ? (targetRect.top - 20) : targetRect.top
      availableTopSpace = topBoundary - headerRect.bottom
    }

    // 气泡自身高度约 36~40px，加上间距共需约 48px
    // 如果上方空间不够 48px，且选区不是超大选区（例如单行或前两行选区，高度 <= 160px），
    // 优先将 placement 设为 'bottom'，气泡自然沉降在选区下方，绝不挤压 header
    const isLargeSelection = targetRect.height > 160 || isAllTableSelected.value
    const shouldPlaceBottom = !isLargeSelection && availableTopSpace < 48
    const preferredPlacement = shouldPlaceBottom ? 'bottom' : 'top'

    const virtualReference = {
      getBoundingClientRect: () => {
        const latest = getSelectionTargetInfo()
        return latest ? latest.rect : targetRect
      },
    }

    const scrollContainer = (options.scrollElem || document.querySelector('.editor-content-wrap') || document.body) as HTMLElement

    const { x, y } = await computePosition(virtualReference, floatingElement.value, {
      placement: preferredPlacement,
      middleware: [
        offset(topOffset),
        flip({
          boundary: scrollContainer,
          fallbackPlacements: preferredPlacement === 'top' ? ['bottom'] : ['top'],
          padding: 8,
        }),
        shift({ padding: 8, boundary: scrollContainer })
      ],
    })

    if (floatingElement.value) {
      const roundedX = Math.round(x)
      let safeY = Math.round(y)

      // 核心防线：如果计算出的位置覆盖了 header（safeY < minAllowedTop）：
      if (safeY < minAllowedTop) {
        if (isTopHandlePresent) {
          // 如果有列把手，强行推到 minAllowedTop 会把把手遮挡（Image 6）！
          // 把手下边缘在 editorWrap 坐标系中的 Y 坐标是 (targetRect.top - wrapRect.top)
          // 此时安全落点为：把手下方 8px，彻底露出蓝色 ::: 把手！
          const belowHandleY = Math.round((targetRect.top - wrapRect.top) + 8)
          safeY = Math.max(belowHandleY, Math.round(minAllowedTop))
        } else {
          safeY = Math.round(minAllowedTop)
        }
      }

      const currentLeft = parseFloat(floatingElement.value.style.left) || 0
      const currentTop = parseFloat(floatingElement.value.style.top) || 0
      if (Math.abs(currentLeft - roundedX) > 1 || Math.abs(currentTop - safeY) > 1) {
        floatingElement.value.style.left = `${roundedX}px`
        floatingElement.value.style.top = `${safeY}px`
      }
    }
  }

  // 判断当前选区是否为全选整个表格（直接使用官方 isColSelection && isRowSelection，绝对安全、不抛错）
  const isAllTableSelected = computed(() => {
    if (!editor || !editor.state) return false
    const { selection } = editor.state
    if (!(selection instanceof CellSelection)) return false
    return selection.isColSelection() && selection.isRowSelection()
  })

  // 动态气泡菜单项：
  // 1. 全选表格时：突出提供背景色、对齐方式以及删除表格（危险红垃圾桶）
  // 2. 局部选中时：提供背景色、对齐方式、合并、拆分、删除表格
  const currentTableItems = computed<TableBubbleMenuItem[]>(() => {
    if (isAllTableSelected.value) {
      return [
        tableMenuItemMaps['background-color'],
        tableMenuItemMaps['align'],
        tableMenuItemMaps['delete-table'],
      ]
    }
    return [
      tableMenuItemMaps['background-color'],
      tableMenuItemMaps['align'],
      tableMenuItemMaps['merge-cells'],
      tableMenuItemMaps['split-cells'],
      tableMenuItemMaps['delete-table'],
    ]
  })

  let lastShowTime = 0

  // 显示气泡菜单
  const showBubbleMenu = async () => {
    if (!shouldShow.value) {
      hideBubbleMenu()
      return
    }

    isVisible.value = true
    lastShowTime = Date.now()

    // 添加全局点击事件监听器
    document.addEventListener('click', handleGlobalClick, true)
    await nextTick()

    // 初始化计算一次位置
    await updatePosition()

    if (floatingElement.value) {
      if (cleanup) {
        cleanup()
        cleanup = null
      }

      // 与 Tiptap 官方机制完全一致：仅监听真实滚动和窗口缩放
      // 彻底移除 autoUpdate，不在 hover / DOM 变动时执行任何重算，杜绝 Tooltip / Popover 抖动
      const scrollContainer = (options.scrollElem || document.querySelector('.editor-content-wrap') || window) as HTMLElement
      const tableInfo = getTableNodeInfo()
      const tableWrapper = tableInfo?.tableDOM?.closest('.tableWrapper') as HTMLElement | null

      // 滚动或缩放时隐藏气泡：全页面任意祖先容器发生滚动立即关闭气泡，保持极度灵敏与自然
      const onScrollOrResize = () => {
        // 关键防护：过滤由聚焦 (editor.view.focus()) 引发的浏览器平滑对齐滚动 (350ms)
        // 只有 350ms 之后的真实用户浏览滚动，才关闭气泡！
        if (Date.now() - lastShowTime < 350) {
          return
        }
        hideBubbleMenu()
      }

      // 关键：scroll 事件默认不冒泡，必须在 capture: true 捕获阶段监听，才能捕获全页面任意祖先容器的滚动！
      window.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true })
      document.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true })
      window.addEventListener('resize', onScrollOrResize)
      if (scrollContainer && scrollContainer !== (window as any) && scrollContainer !== (document.body as any)) {
        scrollContainer.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true })
      }
      if (tableWrapper && tableWrapper !== scrollContainer) {
        tableWrapper.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true })
      }

      cleanup = () => {
        window.removeEventListener('scroll', onScrollOrResize, true)
        document.removeEventListener('scroll', onScrollOrResize, true)
        window.removeEventListener('resize', onScrollOrResize)
        if (scrollContainer && scrollContainer !== (window as any) && scrollContainer !== (document.body as any)) {
          scrollContainer.removeEventListener('scroll', onScrollOrResize, true)
        }
        if (tableWrapper && tableWrapper !== scrollContainer) {
          tableWrapper.removeEventListener('scroll', onScrollOrResize, true)
        }
      }
    }
  }

  // 隐藏气泡菜单
  const hideBubbleMenu = () => {
    isVisible.value = false

    // 移除全局点击事件监听器
    document.removeEventListener('click', handleGlobalClick, true)

    if (cleanup) {
      cleanup()
      cleanup = null
    }
  }

 

  // 监听编辑器选择变化
  const handleSelectionUpdate = () => {
    selectionVersion.value++
    if (checkShouldShow()) {
      showBubbleMenu()
    } else {
      hideBubbleMenu()
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    hideBubbleMenu()
  })

  return {
    isVisible,
    floatingElement,
    currentTableItems,
    isAllTableSelected,
    shouldShow,
    getTableNodeInfo,
    showBubbleMenu,
    hideBubbleMenu,
    handleSelectionUpdate,
  }
}
