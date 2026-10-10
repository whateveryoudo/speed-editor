/*
 * @Author: ykx
 * @Date: 2022-11-15 16:17:06
 * @LastEditTime: 2022-12-15 15:18:59
 * @LastEditors: your name
 * @Description: 表格（单独触发）
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\bold.vue
 */

import { inject, ref, type Ref, computed, defineComponent } from 'vue'
import { type Editor } from '@tiptap/core'
import { TableOutlined } from '@ant-design/icons-vue'
import { useActive } from '@speed-editor/composables'
import AutoExpandTableSelect from './autoExpandTableSelect.vue'
import { Tooltip, Popover, Button } from 'ant-design-vue'
import { useSpeedEditor } from '@speed-editor/composables';
export default defineComponent({
  name: 'TableMenu',
  components: {
    AutoExpandTableSelect
  },
  props: {
    editor: {
      type: Object as () => Editor,
      default: () => ({}) as Editor,
    },
    triggerType: {
      type: String as () => 'menu' | 'bubble',
      default: 'menu'
    }
  },
  setup(props) {
    const open = ref(false)
    const isTitleActive = useActive(props.editor, 'title')
    const { editableCpt } = useSpeedEditor();

    const disableMenu = computed(() => {
      return isTitleActive.value || !editableCpt.value
    })

    const handleTableSelect = (payload: any) => {
      if (isTitleActive.value) {
        return
      }
      // 如果没选择则默认3 * 3
      props.editor?.chain().insertTable({ rows: payload.rows || 3, cols: payload.cols || 3, withHeaderRow: true }).focus().run()
      open.value = false
    }

    const isTableActive = useActive(props.editor, 'table')
    return () => (
      <Tooltip title={disableMenu.value ? null : '表格'}>
        <Popover 
          trigger="click" 
          placement="bottom" 
          v-model:open={open.value}
          content={!disableMenu.value ? <AutoExpandTableSelect onSelect={handleTableSelect} /> : undefined}
        >
          <Button 
            type="text" 
            disabled={disableMenu.value}
            class={`shadow-btn-wrapper ${isTableActive.value ? 'is-active' : ''}`}
          >
            <TableOutlined />
          </Button>
        </Popover>
      </Tooltip>
    )
  }
})
