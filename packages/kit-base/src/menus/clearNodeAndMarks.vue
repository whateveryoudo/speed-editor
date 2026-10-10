<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:39:22
 * @LastEditTime: 2022-11-17 14:29:04
 * @LastEditors: your name
 * @Description: 
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\clearNodeAndMarks.vue
-->
<template>
  <s-keymap-tip :keyMap="keyMap" :title="!disableMenu ? '清除格式' : null">
    <Button class="shadow-btn-wrapper" @click="clear" :disabled="disableMenu" type="text">
      <s-icon-font type="icon-kl-remove-format" :size="16" />
    </Button>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { PropType, ref, inject, computed } from 'vue'
import { type Ref } from 'vue'
import { Editor } from '@tiptap/core'
import { useActive } from '@speed-editor/composables'
import { getShortcutTipByKey } from '@speed-editor/shared'
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
const keyMap = getShortcutTipByKey('clear');
const isTitleActive = useActive(props.editor, 'title')
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value
})
const clear = () => {
  // 新增逻辑 
  if (props.editor) {
    const { state } = props.editor
    const { selection } = state
    if (selection.empty) {
      const { $from } = selection
      // 获取整个段落的起始和结束位置
      const from = $from.start()
      const to = $from.end()
      props.editor.chain().focus().setTextSelection({ from, to }).unsetAllMarks().setTextSelection(selection.from).run()
    } else {
      props.editor.chain().focus().unsetAllMarks().run()
    }

  }
}
</script>

<style scoped lang="less"></style>
