<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:39:22
 * @LastEditTime: 2022-11-17 14:29:04
 * @LastEditors: your name
 * @Description: 
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\clearNodeAndMarks.vue
-->
<template>
  <s-keymap-tip :keyMap="keyMap" :title="editableCpt ? '格式刷' : null">
    <Button class="shadow-btn-wrapper"  @click="toggleFormatPainter" type="text"
      :class="[isActive ? 'is-active' : '']"
      :disabled="disableMenu"
      >
      <ClearOutlined style="font-size: 16px;" />
    </Button>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { PropType, ref, watch, computed } from 'vue'
import { Editor } from '@tiptap/core'
import { useActive } from '@speed-editor/composables'
import { ClearOutlined } from '@ant-design/icons-vue'
import { useSpeedEditor } from '@speed-editor/composables';
import { getShortcutTipByKey } from '@speed-editor/shared';
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
// 使用 ref 来强制响应式更新
const isFormatPainterActive = ref(false)

// 获取快捷键文本
const keyMap = getShortcutTipByKey('formatPainter');

// 直接使用 ref，不使用 computed
const isActive = isFormatPainterActive
const toggleFormatPainter = () => {
  if (props.editor) {
    if (isActive.value) {
      // 如果格式刷已激活，清除状态
      props.editor.commands.clearFormat()
    } else {
      // 复制格式
      props.editor.commands.copyFormat()
    }
    const storage = (props.editor.storage as any)?.formatPainter
    isFormatPainterActive.value = storage?.isFormatPainterActive || false
  }

}
const isTitleActive = useActive(props.editor, 'title')
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value
})
// 定义更新函数，确保在清理时能访问到
let updateFormatPainterState: (() => void) | null = null

watch(() => props.editor, (newEditor, oldEditor) => {
  // 清理旧的事件监听器
  if (oldEditor && updateFormatPainterState) {
    oldEditor.off('transaction', updateFormatPainterState)
  }
  
  if (newEditor) {
    updateFormatPainterState = () => {
      const storage = (newEditor.storage as any)?.formatPainter
      isFormatPainterActive.value = storage?.isFormatPainterActive || false
    }
    
    // 监听 transaction 事件
    newEditor.on('transaction', updateFormatPainterState)

    // 立即更新一次
    updateFormatPainterState()
  }
}, {
  immediate: true,
})
</script>

<style scoped lang="less"></style>
