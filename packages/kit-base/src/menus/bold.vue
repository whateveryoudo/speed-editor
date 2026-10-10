<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:17:06
 * @LastEditTime: 2022-12-15 15:18:59
 * @LastEditors: your name
 * @Description: 粗体
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\bold.vue
-->
<template>
  <s-keymap-tip :keyMap="keyMap" :title="editableCpt ? '粗体' : null">
    <Button type="text" class="shadow-btn-wrapper"
      :class="[isBoldActive ? 'is-active' : '', isTitleActive && 'disabled']"
      v-on="buttonEvents"
      :disabled="!editableCpt || isTitleActive">
      <bold-outlined />
    </Button>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { Editor } from '@tiptap/core'
import { BoldOutlined } from '@ant-design/icons-vue'
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
const isTitleActive = useActive(props.editor, 'title')
const { editableCpt } = useSpeedEditor();

// 获取快捷键文本
const keyMap = getShortcutTipByKey('bold');

const toggleBold = () => {
  if (isTitleActive.value) {
    return
  }
  props.editor && props.editor.chain().focus().toggleBold().run()
}
const isBoldActive = useActive(props.editor, 'bold')
const buttonEvents = useMenuButtonEvents(toggleBold, props.triggerType)
</script>

<style scoped lang="less"></style>
