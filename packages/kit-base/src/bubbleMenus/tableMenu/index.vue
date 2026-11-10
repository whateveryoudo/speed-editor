<script lang="ts" setup>
import type { Editor } from '@tiptap/vue-3'
import { onMounted, onUnmounted } from 'vue'
import { useTableBubbleMenu } from './useTableBubbleMenu.tsx'
import RenderMenuItems from './RenderMenuItems.vue'
const props = defineProps<{
  editor: Editor
}>()

const {
  isVisible,
  floatingElement,
  currentTableItems,
  handleSelectionUpdate
} = useTableBubbleMenu(props.editor)


// 组件挂载时设置事件监听器
onMounted(() => {
  if (props.editor) {
    props.editor.on('selectionUpdate', handleSelectionUpdate)
    props.editor.on('transaction', handleSelectionUpdate)
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  if (props.editor) {
    props.editor.off('selectionUpdate', handleSelectionUpdate)
    props.editor.off('transaction', handleSelectionUpdate)
  }
})
</script>

<template>
  <div v-if="isVisible" ref="floatingElement" class="bubble-menu-wrapper absolute z-[500]">
    <RenderMenuItems :editor="editor" :tableItems="currentTableItems" />
  </div>
</template>

<style lang="less" scoped></style>
