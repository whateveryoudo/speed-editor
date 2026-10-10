<!--
 * @Author: ykx
 * @Date: 2022-12-01 09:51:46
 * @LastEditTime: 2022-12-01 10:12:24
 * @LastEditors: your name
 * @Description: 插入引用
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\blockQuote.vue
-->

<template>
  <Tooltip placement="bottom" :title="disableMenu ? null : '插入引用'">
    <Button
      type="text"
      class="shadow-btn-wrapper"
      :class="[isBlockquoteActive ? 'is-active' : '']"
      @click="toggleBlockquote"
      :disabled="disableMenu"
    >
    <s-icon-font type="icon-kl-quote1"></s-icon-font>
    </Button>
  </Tooltip>
</template>
<script setup lang="ts">
import { Button, Tooltip } from 'ant-design-vue'
import { PropType, computed } from 'vue'
import { Editor } from '@tiptap/core'
import { useActive } from '@speed-editor/composables'
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
const isTitleActive = useActive(props.editor, 'title')
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value
})
const toggleBlockquote = () => {
  if (isTitleActive.value) {
    return
  }
  props.editor && props.editor.chain().focus().toggleBlockquote().run()
}
const isBlockquoteActive = useActive(props.editor, 'blockquote')
</script>

<style scoped lang="less"></style>
