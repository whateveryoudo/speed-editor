<!--
 * @Author: ykx
 * @Date: 2022-11-16 18:21:23
 * @LastEditTime: 2023-01-09 16:23:18
 * @LastEditors: your name
 * @Description: 气泡工具（link气泡）
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\link\bubble.vue
-->
<template>
  <BaseBubbleMenu :editor="editor" :options="{
    placement: 'top',
    offset: 8,
    strategy: 'absolute',
  }" :should-show="shouldShow" plugin-key="link-bubble-menu">
    <div class="bubble-menu-wrapper">
      <Space :size="5">
        <Tooltip title="访问链接">
          <Button type="text" class="shadow-btn-wrapper" @click="visitLink">
            <share-alt-outlined />
          </Button>
        </Tooltip>
        <Tooltip title="编辑链接">
          <Button type="text" class="shadow-btn-wrapper" @click="openEditLinkModal">
            <edit-outlined />
          </Button>
        </Tooltip>
        <Tooltip title="去除链接">
          <Button type="text" class="shadow-btn-wrapper" @click="unsetLink">
            <disconnect-outlined />
          </Button>
        </Tooltip>
      </Space>
    </div>
  </BaseBubbleMenu>
</template>

<script setup lang="ts">
import { Button, Space, Tooltip } from 'ant-design-vue'
import { PropType, watch, onMounted } from 'vue'
import { type Editor } from '@tiptap/core'
import { BubbleMenu as BaseBubbleMenu } from '@tiptap/vue-3/menus'
import { findMarkPosition, isMarkActive } from '@kb/prose-utils'
import { LinkModalProps } from './modal'
import { ShareAltOutlined, DisconnectOutlined, EditOutlined } from '@ant-design/icons-vue'
import { useAttributes } from '@speed-editor/composables'

const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})

const linkProp: LinkModalProps = {}
const emit = defineEmits(['triggerOpenModal'])
const linkAttrs = useAttributes(props.editor, 'link', { href: '', target: '' }) as any

const shouldShow = ({ editor, state }: { editor: any; state: any }) => {
  return !state.selection.empty && editor.isActive('link')
}

const visitLink = () => {
  window.open(linkAttrs.value?.href, linkAttrs.value?.target)
}

const unsetLink = () => {
  props.editor?.chain().extendMarkRange('link').unsetLink().run()
}

const openEditLinkModal = () => {
  emit('triggerOpenModal', { ...linkProp, href: linkAttrs.value?.href })
}

onMounted(() => {
  // 确保样式正确应用
  const style = document.createElement('style')
  style.textContent = `
    .bubble-menu {
      background: white !important;
      border: 1px solid #d9d9d9 !important;
      border-radius: 6px !important;
      padding: 4px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      z-index: 1000 !important;
      pointer-events: auto !important;
      user-select: none !important;
    }
  `
  document.head.appendChild(style)
})

watch(
  () => props.editor,
  (editor: Editor) => {
    const listener = () => {
      const isLinkActive = editor.isActive('link')

      if (!isLinkActive) return

      const { state } = editor
      const isInLink = isMarkActive(state.schema.marks.link)(state)
      if (!isInLink) return

      const { $head, from, to } = editor.state.selection
      const marks = $head.marks()
      let start
      let end

      if (marks.length) {
        const mark = marks[0]
        const node = $head.node($head.depth)
        const startPosOfThisLine =
          $head.pos - (($head.nodeBefore && $head.nodeBefore.nodeSize) || 0)
        const endPosOfThisLine = $head.nodeAfter
          ? startPosOfThisLine + $head.nodeAfter.nodeSize
          : $head.pos - $head.parentOffset + node.content.size

        const { start: startPos, end: endPos } = findMarkPosition(
          state,
          mark,
          startPosOfThisLine,
          endPosOfThisLine,
        )
        start = startPos
        end = endPos
      } else {
        start = from
        end = to
      }

      const text = state.doc.textBetween(start, end)
      linkProp.text = text
      linkProp.from = start
      linkProp.to = end
    }

    editor.on('selectionUpdate', listener)
    return () => {
      editor.off('selectionUpdate', listener)
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="less">

</style>
