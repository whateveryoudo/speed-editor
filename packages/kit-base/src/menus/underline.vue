<!--
 * @Author: ykx
 * @Date: 2022-11-16 19:24:26
 * @LastEditTime: 2022-11-24 12:00:02
 * @LastEditors: your name
 * @Description: 下划线
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\underline.vue
-->
<template>
  <s-keymap-tip :keyMap="keyMap" :title="editableCpt ? '下划线' : null">
    <Button
      type="text"
      class="shadow-btn-wrapper"
      :class="[isUnderlineActive ? 'is-active' : '', isTitleActive && 'disabled']"
      v-on="buttonEvents"
      :disabled="!editableCpt || isTitleActive"
    >
      <underline-outlined />
    </Button>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { Editor } from '@tiptap/core'
import { UnderlineOutlined } from '@ant-design/icons-vue'
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
const keyMap = getShortcutTipByKey('underline');
const isTitleActive = useActive(props.editor, 'title')
const { editableCpt } = useSpeedEditor();
const toggleUnderline = () => {
  if (isTitleActive.value) {
    return
  }
  props.editor && props.editor.chain().focus().toggleUnderline().run()
}
const isUnderlineActive = useActive(props.editor, 'underline')
const buttonEvents = useMenuButtonEvents(toggleUnderline, props.triggerType)
</script>

<style scoped lang="less"></style>
