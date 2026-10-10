<!--
 * @Description: 插入表情
 * @Autor: ykx
 * @Date: 2022-12-02 09:58:37
 * @LastEditors: your name
 * @LastEditTime: 2023-01-04 15:48:55
-->
<template>

  <emoji-picker @triggerEmoji="setEmoji" v-if="!disableMenu">
    <Tooltip placement="bottom" :title="disableMenu ? null : '插入表情'">
      <Button type="text" :class="['shadow-btn-wrapper', isEmojiActive ? 'is-active' : '']">
        <s-icon-font type="icon-kl-emoji" :size="18" />
      </Button>
    </Tooltip>

  </emoji-picker>
  <Button v-else type="text" :class="['shadow-btn-wrapper']" disabled>
    <s-icon-font type="icon-kl-emoji" :size="18" />
  </Button>

</template>

<script setup lang="ts">
import { Button, Tooltip } from 'ant-design-vue'
import { PropType, computed, inject, ref, type Ref } from 'vue'
import { Editor } from '@tiptap/core'
import EmojiPicker from '@kb/components/emojiPicker/index.vue'
import { useActive } from '@speed-editor/composables'
import { Emoji } from '@tiptap/extension-emoji'
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
const setEmoji = (emoji: string) => {
  const { selection } = props.editor.state
  const { $anchor } = selection
  return props.editor.chain().insertContentAt($anchor.pos, emoji).run()
}

const isEmojiActive = useActive(props.editor, Emoji.name)
</script>

<style scoped lang="less">
.bg-color-menu-wrapper {
  display: flex;
  justify-items: center;

  .text-wrapper {
    display: flex;
    position: relative;

    .under-line {
      position: absolute;
      bottom: 0px;
      height: 2px;
      width: 80%;
      left: 10%;
    }
  }

  .dropdown-trigger {
    :deep(.anticon) {
      font-size: 10px;
      color: #666;
    }
  }
}
</style>
