<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:34:49
 * @LastEditTime: 2022-11-22 16:08:55
 * @LastEditors: your name
 * @Description: 
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\redo.vue
-->
<template>
  <s-keymap-tip :keyMap="keyMap" :title="editableCpt ? '重做' : null">
    <Button
      :disabled="!editableCpt"
      type="text"
      class="shadow-btn-wrapper"
      @click="redo"
    >
      <RedoOutlined class="text-[16px]"/>
    </Button>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { RedoOutlined } from '@ant-design/icons-vue'
import { type PropType } from 'vue'
import { Editor } from '@tiptap/core'
import { getShortcutTipByKey } from '@speed-editor/shared'
import { useSpeedEditor } from '@speed-editor/composables'

const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
const keyMap = getShortcutTipByKey('redo')
const { editableCpt } = useSpeedEditor()

const redo = () => {
  if (!props.editor) return
  const plugin = props.editor.state.plugins.find((p: any) => p.key?.startsWith('y-undo'))
  const undoState = plugin ? plugin.getState(props.editor.state) : null
  const um = undoState?.undoManager
  console.log('[Redo Clicked]', {
    canRedo: props.editor.can().redo(),
    undoStackLen: um?.undoStack?.length,
    redoStackLen: um?.redoStack?.length,
    trackedOrigins: um?.trackedOrigins ? Array.from(um.trackedOrigins) : [],
  })
  const chainRes = props.editor.chain().focus().redo().run()
  console.log('[Redo chain run result]:', chainRes, 'new redoStackLen:', um?.redoStack?.length)
}
</script>

<style scoped lang="less"></style>
