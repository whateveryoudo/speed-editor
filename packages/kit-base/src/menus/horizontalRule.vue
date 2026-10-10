<!--
 * @Author: ykx
 * @Date: 2022-12-01 10:03:38
 * @LastEditTime: 2022-12-01 10:14:11
 * @LastEditors: your name
 * @Description: 插入分割线
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\horizontalRule.vue
-->
<template>
  <Tooltip :title="disableMenu ? null : '插入分割线'" placement="bottom">
    <Button
      type="text"
      class="shadow-btn-wrapper"
      :disabled="disableMenu"
      @click="setHorizontalRule"
    >
      <s-icon-font type="icon-kl-line" :size="18"></s-icon-font>
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
const {editableCpt} = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value
})
const setHorizontalRule = () => {
  if (isTitleActive.value) {
    return
  }
  props.editor && props.editor.chain().focus().setHorizontalRule().run()
}
</script>

<style scoped lang="less"></style>
