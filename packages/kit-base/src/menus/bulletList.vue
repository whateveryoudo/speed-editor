<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:17:06
 * @LastEditTime: 2022-11-30 19:56:33
 * @LastEditors: your name
 * @Description: 无序列表
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\bulletList.vue
-->
<template>
  <s-keymap-tip :keyMap="keyMap" :title="disableMenu ? null : '无序列表'">
    <Button type="text" :class="['shadow-btn-wrapper', isBulletListActive ? 'is-active' : '']"
      @click="toggleBulletList" :disabled="disableMenu">
      <unordered-list-outlined />
    </Button>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { PropType, computed } from 'vue'
import { Editor } from '@tiptap/core'
import { UnorderedListOutlined } from '@ant-design/icons-vue'
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
const keyMap = getShortcutTipByKey('unorderedList')

const toggleBulletList = () => {
  if (isTitleActive.value) {
    return
  }
  props.editor && props.editor.chain().focus().toggleBulletList().run()
}
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value || !props.editor.isEditable
})
const isBulletListActive = useActive(props.editor, 'bulletList')
</script>

<style scoped lang="less"></style>
