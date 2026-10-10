<!--
 * @Author: ykx
 * @Date: 2022-11-16 19:16:43
 * @LastEditTime: 2022-11-24 12:00:15
 * @LastEditors: your name
 * @Description: 斜体
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\italic.vue
-->
<template>
  <s-keymap-tip :keyMap="keyMap" :title="editableCpt ? '斜体' : null">
    <Button type="text" class="shadow-btn-wrapper"
      :class="[isItalicActive ? 'is-active' : '', isTitleActive && 'disabled']"
      v-on="buttonEvents"
      :disabled="!editableCpt || isTitleActive">
      <italic-outlined />
    </Button>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { Editor } from '@tiptap/core'
import { ItalicOutlined } from '@ant-design/icons-vue'
import { useActive } from '@speed-editor/composables'
import { useMenuButtonEvents } from '@speed-editor/composables'
import { getShortcutTipByKey } from '@speed-editor/shared'
import { useSpeedEditor } from '@speed-editor/composables';
const props = withDefaults(defineProps<{
  editor: Editor,
  triggerType?: 'menu' | 'bubble'
}>(), {
  editor: () => ({}) as Editor,
  triggerType: 'menu'
})
const keyMap = getShortcutTipByKey('italic');
const isTitleActive = useActive(props.editor, 'title')
const { editableCpt } = useSpeedEditor();
const toggleItalic = () => {
  if (isTitleActive.value) {
    return
  }
  props.editor && props.editor.chain().focus().toggleItalic().run()
}
const isItalicActive = useActive(props.editor, 'italic')
const buttonEvents = useMenuButtonEvents(toggleItalic, props.triggerType)
</script>

<style scoped lang="less"></style>
