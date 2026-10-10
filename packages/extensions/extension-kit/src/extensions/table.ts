import { Table as SchemaTable } from '@speed-editor/schema'
import '@ek/assets/style/table.less'

/** 编辑器侧：开启列宽拖拽（样式仍在本包） */
export default SchemaTable.configure({
  resizable: true,
  handleWidth: 5,
  lastColumnResizable: false,
})
