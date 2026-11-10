import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { CellSelection, TableMap } from '@tiptap/pm/tables'

/**
 * 获取表格的 TableMap
 */
export function getTableMap(tableNode: ProseMirrorNode): TableMap {
  return TableMap.get(tableNode)
}

/**
 * 选中整行
 */
export function selectRow(editor: Editor, tablePos: number, rowIndex: number) {
  const { doc, tr } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const map = TableMap.get(tableNode)
  if (rowIndex < 0 || rowIndex >= map.height) return

  const firstCellPos = tablePos + 1 + map.map[rowIndex * map.width]
  const lastCellPos = tablePos + 1 + map.map[rowIndex * map.width + map.width - 1]

  const $firstCell = doc.resolve(firstCellPos)
  const $lastCell = doc.resolve(lastCellPos)
  const selection = CellSelection.rowSelection($firstCell, $lastCell)
  tr.setSelection(selection)
  editor.view.dispatch(tr)
  editor.view.focus()
}

/**
 * 选中整列
 */
export function selectColumn(editor: Editor, tablePos: number, colIndex: number) {
  const { doc, tr } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const map = TableMap.get(tableNode)
  if (colIndex < 0 || colIndex >= map.width) return

  const firstCellPos = tablePos + 1 + map.map[colIndex]
  const lastCellPos = tablePos + 1 + map.map[(map.height - 1) * map.width + colIndex]

  const $firstCell = doc.resolve(firstCellPos)
  const $lastCell = doc.resolve(lastCellPos)
  const selection = CellSelection.colSelection($firstCell, $lastCell)
  tr.setSelection(selection)
  editor.view.dispatch(tr)
  editor.view.focus()
}

/**
 * 选中整个表格
 */
export function selectTable(editor: Editor, tablePos: number) {
  const { doc, tr } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const map = TableMap.get(tableNode)
  const firstCellPos = tablePos + 1 + map.map[0]
  const lastCellPos = tablePos + 1 + map.map[map.map.length - 1]

  const $firstCell = doc.resolve(firstCellPos)
  const $lastCell = doc.resolve(lastCellPos)
  const selection = new CellSelection($firstCell, $lastCell)
  tr.setSelection(selection)
  editor.view.dispatch(tr)
  editor.view.focus()
}

/**
 * 移动行数据（原子事务）
 */
export function moveRow(editor: Editor, tablePos: number, fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  const { tr, doc } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const rowCount = tableNode.childCount
  if (fromIndex < 0 || fromIndex >= rowCount || toIndex < 0 || toIndex >= rowCount) return

  const rows: ProseMirrorNode[] = []
  for (let i = 0; i < rowCount; i++) {
    rows.push(tableNode.child(i))
  }

  const [movedRow] = rows.splice(fromIndex, 1)
  rows.splice(toIndex, 0, movedRow)

  const newTable = tableNode.type.create(tableNode.attrs, rows)
  tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable)
  editor.view.dispatch(tr)

  // 移动后高亮目标行
  setTimeout(() => {
    selectRow(editor, tablePos, toIndex)
  }, 20)
}

/**
 * 移动列数据（原子事务）
 */
export function moveColumn(editor: Editor, tablePos: number, fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  const { tr, doc } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const rowCount = tableNode.childCount
  const newRows: ProseMirrorNode[] = []

  for (let r = 0; r < rowCount; r++) {
    const rowNode = tableNode.child(r)
    const cells: ProseMirrorNode[] = []
    for (let c = 0; c < rowNode.childCount; c++) {
      cells.push(rowNode.child(c))
    }

    if (fromIndex < cells.length && toIndex < cells.length) {
      const [movedCell] = cells.splice(fromIndex, 1)
      cells.splice(toIndex, 0, movedCell)
    }

    newRows.push(rowNode.type.create(rowNode.attrs, cells))
  }

  const newTable = tableNode.type.create(tableNode.attrs, newRows)
  tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable)
  editor.view.dispatch(tr)

  // 移动后高亮目标列
  setTimeout(() => {
    selectColumn(editor, tablePos, toIndex)
  }, 20)
}

/**
 * 批量插入行
 */
export function insertRows(editor: Editor, count: number, direction: 'before' | 'after') {
  const safeCount = Math.max(1, count || 1)
  for (let i = 0; i < safeCount; i++) {
    if (direction === 'before') {
      editor.commands.addRowBefore()
    } else {
      editor.commands.addRowAfter()
    }
  }
}

/**
 * 确保指定列的单元格具备正确的 colwidth，避免在自定义列宽表格中插入新列出现宽度为 0 的情况
 */
export function ensureColumnWidth(
  editor: Editor,
  tablePos: number,
  colIndex: number,
  fallbackWidth: number = 100
) {
  const { doc, tr } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const map = TableMap.get(tableNode)
  if (colIndex < 0 || colIndex >= map.width) return

  // 检查当前表格是否已有列设置了 colwidth
  let hasAnyColWidth = false
  let adjacentWidth: number | null = null

  // 获取相邻列宽度作为优先参考
  const checkCol = colIndex > 0 ? colIndex - 1 : (colIndex < map.width - 1 ? colIndex + 1 : -1)
  if (checkCol >= 0) {
    const cellPos = tablePos + 1 + map.map[checkCol]
    const cellNode = doc.nodeAt(cellPos)
    if (cellNode?.attrs?.colwidth?.[0]) {
      adjacentWidth = cellNode.attrs.colwidth[0]
    }
  }

  // 检查整张表是否有任意一列拥有自定义列宽
  for (let i = 0; i < map.width; i++) {
    const cellPos = tablePos + 1 + map.map[i]
    const cellNode = doc.nodeAt(cellPos)
    if (cellNode?.attrs?.colwidth?.[0]) {
      hasAnyColWidth = true
      break
    }
  }

  if (!hasAnyColWidth) {
    // 整张表都还是自适应模式，无需强行写入 colwidth
    return
  }

  const targetWidth = adjacentWidth || fallbackWidth

  // 给新列的每一行单元格更新 colwidth 属性
  for (let row = 0; row < map.height; row++) {
    const cellPos = tablePos + 1 + map.map[row * map.width + colIndex]
    const cellNode = doc.nodeAt(cellPos)
    if (cellNode && !cellNode.attrs.colwidth) {
      tr.setNodeMarkup(cellPos, undefined, {
        ...cellNode.attrs,
        colwidth: [targetWidth],
      })
    }
  }

  if (tr.docChanged) {
    editor.view.dispatch(tr)
  }
}

/**
 * 批量插入列
 */
export function insertCols(
  editor: Editor,
  count: number,
  direction: 'before' | 'after',
  tablePos?: number,
  targetColIndex?: number
) {
  const safeCount = Math.max(1, count || 1)
  for (let i = 0; i < safeCount; i++) {
    if (direction === 'before') {
      editor.commands.addColumnBefore()
    } else {
      editor.commands.addColumnAfter()
    }
  }

  if (typeof tablePos === 'number' && typeof targetColIndex === 'number') {
    const baseCol = direction === 'before' ? targetColIndex : targetColIndex + 1
    for (let i = 0; i < safeCount; i++) {
      ensureColumnWidth(editor, tablePos, baseCol + i)
    }
  }
}

/**
 * 清除所选单元格内容（保留空白段落）
 */
export function clearSelectedCells(editor: Editor) {
  const { state, dispatch } = editor.view
  const selection = state.selection

  if (!(selection instanceof CellSelection)) {
    return
  }

  const { tr, schema } = state
  const emptyParagraph = schema.nodes.paragraph.create()

  selection.forEachCell((node, pos) => {
    // 单元格内容范围
    const start = pos + 1
    const end = pos + node.nodeSize - 1
    tr.replaceWith(start, end, emptyParagraph)
  })

  dispatch(tr)
}

/**
 * 在表格最左侧插入序号列
 */
export function insertIndexColumn(editor: Editor, tablePos: number, startNumber: number = 1) {
  const { tr, doc, schema } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const rowCount = tableNode.childCount
  const newRows: ProseMirrorNode[] = []

  for (let r = 0; r < rowCount; r++) {
    const rowNode = tableNode.child(r)
    const isHeaderRow = r === 0 && rowNode.child(0).type.name === 'tableHeader'

    let textContent = ''
    if (r === 0) {
      textContent = '序号'
    } else {
      textContent = String(startNumber + (r - 1))
    }

    const cellType = isHeaderRow ? schema.nodes.tableHeader : schema.nodes.tableCell
    const textNode = textContent ? schema.text(textContent) : null
    const paragraph = schema.nodes.paragraph.create(null, textNode || undefined)
    const newCell = cellType.create({ colwidth: [70] }, paragraph)

    const existingCells: ProseMirrorNode[] = []
    for (let c = 0; c < rowNode.childCount; c++) {
      existingCells.push(rowNode.child(c))
    }
    // 插入到首列
    existingCells.unshift(newCell)

    newRows.push(rowNode.type.create(rowNode.attrs, existingCells))
  }

  const newTable = tableNode.type.create(tableNode.attrs, newRows)
  tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable)
  editor.view.dispatch(tr)
}

/**
 * 从指定行起，自动编号当前列
 */
export function autoNumberColumn(
  editor: Editor,
  tablePos: number,
  colIndex: number,
  startRowIndex: number = 1,
  startNumber: number = 1,
) {
  const { tr, doc, schema } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const map = TableMap.get(tableNode)
  let currentNum = startNumber

  for (let r = startRowIndex; r < map.height; r++) {
    const cellPos = tablePos + map.map[r * map.width + colIndex] + 1
    const cellNode = doc.nodeAt(cellPos - 1)
    if (!cellNode) continue

    const textNode = schema.text(String(currentNum++))
    const paragraph = schema.nodes.paragraph.create(null, textNode)

    tr.replaceWith(cellPos, cellPos + cellNode.nodeSize - 2, paragraph)
  }

  editor.view.dispatch(tr)
}

/**
 * 拖拽调整列宽生效：在释放时一次性更新指定列的 colwidth
 * 如果是自适应表格首次拖拽，将其它列的当前实际渲染宽度一并固化，彻底避免其它列被挤压变形
 */
export function applyTableColumnWidth(
  editor: Editor,
  tablePos: number,
  colIndex: number,
  newWidth: number,
  currentRenderedWidths?: number[]
) {
  const { doc, tr } = editor.state
  const tableNode = doc.nodeAt(tablePos)
  if (!tableNode) return

  const map = TableMap.get(tableNode)
  if (colIndex < 0 || colIndex >= map.width) return

  const safeWidth = Math.max(30, Math.round(newWidth))

  // 1. 检查整张表是否已经存在 colwidth（利用 TableMap 精准读取每一列的属性）
  let hasAnyColWidth = false
  const existingWidths: (number | null)[] = []

  for (let c = 0; c < map.width; c++) {
    const cellPos = map.map[c]
    const cellNode = tableNode.nodeAt(cellPos)
    let cwVal: number | null = null
    if (cellNode && Array.isArray(cellNode.attrs.colwidth)) {
      const cellRect = map.findCell(cellPos)
      const indexInCell = c - cellRect.left
      const val = cellNode.attrs.colwidth[indexInCell]
      if (typeof val === 'number' && val > 0) {
        cwVal = val
        hasAnyColWidth = true
      }
    }
    existingWidths.push(cwVal)
  }

  // 2. 准备整张表每一列的目标宽度
  const finalWidths: number[] = []
  for (let c = 0; c < map.width; c++) {
    if (c === colIndex) {
      finalWidths.push(safeWidth)
    } else if (hasAnyColWidth && existingWidths[c]) {
      finalWidths.push(existingWidths[c]!)
    } else if (currentRenderedWidths && currentRenderedWidths[c]) {
      finalWidths.push(Math.round(currentRenderedWidths[c]))
    } else {
      finalWidths.push(100)
    }
  }

  // 3. 遍历整张表的所有单元格，给每个单元格更新 colwidth 属性
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      const mapIndex = row * map.width + col
      // 如果跨行，跳过非主单元格
      if (row > 0 && map.map[mapIndex] === map.map[mapIndex - map.width]) continue
      // 如果跨列，跳过非主单元格
      if (col > 0 && map.map[mapIndex] === map.map[mapIndex - 1]) continue

      const cellPos = map.map[mapIndex]
      const cellNode = tableNode.nodeAt(cellPos)
      if (!cellNode) continue

      const colspan = cellNode.attrs.colspan || 1
      const widthsForCell: number[] = []
      for (let i = 0; i < colspan; i++) {
        widthsForCell.push(finalWidths[col + i] || 100)
      }

      tr.setNodeMarkup(tablePos + 1 + cellPos, undefined, {
        ...cellNode.attrs,
        colwidth: widthsForCell,
      })
    }
  }

  if (tr.docChanged) {
    editor.view.dispatch(tr)
  }
}
