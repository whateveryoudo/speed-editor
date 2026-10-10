<!--
 * @Author: ykx
 * @Date: 2022-11-16 19:24:26
 * @LastEditTime: 2023-01-09 16:14:27
 * @LastEditors: your name
 * @Description: 插入链接
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\link\index.vue
-->
<template>
  <Tooltip placement="bottom" :title="disableMenu ? null : '插入链接'">
    <Button
      type="text"
      class="shadow-btn-wrapper"
      :class="[isLinkActive ? 'is-active' : '']"
      @click="createOrToggleLink"
      :disabled="disableMenu"
    >
      <link-outlined />
    </Button>
  </Tooltip>
  <!-- bubble气泡 -->
  <link-bubble
    v-if="!isEmpty(editor)"
    :editor="editor"
    @triggerOpenModal="handleEditLink"
  />
  <!-- modal设置 -->
  <link-modal-setting
    v-bind="linkModalProp"
    :editor="editor"
    @closeModal="linkModalProp.visible = false"
  />
</template>

<script setup lang="ts">
import { Button, Tooltip } from 'ant-design-vue'
import { PropType, ref, computed } from 'vue'
import { Editor } from '@tiptap/core'
import { LinkOutlined } from '@ant-design/icons-vue'
import { isMarkActive } from '@kb/prose-utils'
import LinkModalSetting from './modal.vue'
import LinkBubble from './bubble.vue'
import { LinkModalProps } from './modal'
import { useActive } from '@speed-editor/composables'
import { isEmpty } from 'lodash-es'
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
const linkModalProp = ref<LinkModalProps>({})
const isTitleActive = useActive(props.editor, 'title')
const isLinkActive = useActive(props.editor, 'Link')
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value
})
const createOrToggleLink = () => {
  if (isTitleActive.value) {
    return
  }
  if (props.editor && props.editor.state) {
    const state = props.editor.state
    const isInLink = isMarkActive(state.schema.marks.link)(state)
    if (!isInLink) {
      const selection = state.selection
      const text = state.doc.textBetween(selection.from, selection.to)
      linkModalProp.value.text = text
      linkModalProp.value.from = selection.from
      linkModalProp.value.to = selection.to
      linkModalProp.value.visible = true
    } else {
      props.editor.chain().focus().unsetLink().run()
    }
  }
}
// 编辑选中link
const handleEditLink = (data: LinkModalProps) => {
  console.log(data);
  linkModalProp.value = { ...linkModalProp.value, visible: true, ...data }
}
</script>

<style scoped lang="less"></style>
