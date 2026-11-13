<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:17:06
 * @LastEditTime: 2022-11-22 15:59:22
 * @LastEditors: your name
 * @Description: 
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\undo.vue
-->
<template>
  <s-keymap-tip :keyMap="keyMap" :title="editableCpt ? '撤销' : null">
    <Button
      :disabled="!editableCpt"
      type="text"
      class="shadow-btn-wrapper"
      @click="undo"
    >
      <UndoOutlined class="text-[16px]"/>
    </Button>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { UndoOutlined } from '@ant-design/icons-vue'
import { type PropType } from 'vue'
import { Editor } from '@tiptap/core'
import { getShortcutTipByKey } from '@speed-editor/shared'
import { useSpeedEditor } from '@speed-editor/composables'

const keyMap = getShortcutTipByKey('undo')
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
const { editableCpt } = useSpeedEditor()

const undo = () => {
  if (!props.editor) return
  const plugin = props.editor.state.plugins.find((p: any) => p.key?.startsWith('y-undo'))
  const undoState = plugin ? plugin.getState(props.editor.state) : null
  const um = undoState?.undoManager
  console.log('[Undo Before]', {
    canUndo: props.editor.can().undo(),
    undoStackLen: um?.undoStack?.length,
    redoStackLen: um?.redoStack?.length,
  })
  const chainRes = props.editor.chain().focus().undo().run()
  console.log('[Undo After]', {
    chainRes,
    undoStackLen: um?.undoStack?.length,
    redoStackLen: um?.redoStack?.length,
    canRedo: props.editor.can().redo(),
  })
}
</script>

<style scoped lang="less"></style>
