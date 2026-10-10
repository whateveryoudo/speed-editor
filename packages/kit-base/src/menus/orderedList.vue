<!--
 * @Author: ykx
 * @Date: 2022-11-30 20:24:25
 * @LastEditTime: 2022-12-01 09:40:44
 * @LastEditors: your name
 * @Description: 有序列表
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\orderedList.vue
-->

<template>
  <s-keymap-tip :keyMap="keyMap" :title="disableMenu ? null : '有序列表'">
    <Button :disabled="disableMenu" type="text" :class="['shadow-btn-wrapper', isOrderedListActive ? 'is-active' : '']"
      @click="toggleOrderedList">
      <ordered-list-outlined />
    </Button>
  </s-keymap-tip>
</template>
<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { PropType, computed, inject, ref, type Ref } from 'vue'
import { Editor } from '@tiptap/core'
import { OrderedListOutlined } from '@ant-design/icons-vue'
import { useActive } from '@speed-editor/composables'
import { getShortcutTipByKey } from '@speed-editor/shared'
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
const isTitleActive = useActive(props.editor, 'title')
const keyMap = getShortcutTipByKey('orderedList')
const toggleOrderedList = () => {
  if (isTitleActive.value) {
    return
  }
  props.editor && props.editor.chain().focus().toggleOrderedList().run()
}
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value || !props.editor.isEditable
})
const isOrderedListActive = useActive(props.editor, 'orderedList')
</script>

<style scoped lang="less"></style>
