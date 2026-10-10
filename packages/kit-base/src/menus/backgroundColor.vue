<!--
 * @Author: ykx
 * @Date: 2022-11-18 19:02:23
 * @LastEditTime: 2022-12-07 11:03:58
 * @LastEditors: your name
 * @Description: 背景色选择（兼容单元格配置）
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\backgroundColor.vue
-->

<template>
  <s-keymap-tip :keyMap="keyMap" :title="editableCpt ? '背景颜色' : null">
    <div :class="['bg-color-menu-wrapper', isTitleActive && 'menu-disabled']">
      <Button type="text" class="shadow-btn-wrapper small" :disabled="disableMenu"
        @mousedown.prevent="setBackgroundColor(curColor)">
        <span class="text-wrapper">
          <s-icon-font :size="17" type="icon-kl-fill-color" />
          <span class="under-line" :style="{ backgroundColor: curColor || '#fff' }" />
        </span>
      </Button>
      <color-picker :cur-color="curColor" :disabled="disableMenu" @triggerColor="setBackgroundColor">
        <Button type="text" class="shadow-btn-wrapper small" :disabled="disableMenu">
          <caret-down-outlined />
        </Button>
      </color-picker>
    </div>
  </s-keymap-tip>
</template>

<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { ref, inject, computed } from 'vue'
import { type Ref } from 'vue'
import { Editor } from '@tiptap/core'
import ColorPicker from '@kb/components/colorPicker/index.vue'
import { type ColorType } from '@kb/components/colorPicker/data'
import { CaretDownOutlined } from '@ant-design/icons-vue'
import { useActive } from '@speed-editor/composables'
import { getShortcutTipByKey } from '@speed-editor/shared'
import { useSpeedEditor } from '@speed-editor/composables';

const props = withDefaults(defineProps<{
  editor: Editor
  action?: (editor: Editor, payload?: any) => void
}>(), {
  editor: () => {
    return {} as Editor
  },
})

const keyMap = getShortcutTipByKey('backgroundColor')
const curColor = ref<ColorType | null>();
const isTitleActive = useActive(props.editor, 'title')
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value
})
const setBackgroundColor = (color: ColorType) => {
  // 如果外部传入了action，则直接调用action
  if (props.action) {
    props.action(props.editor, { color })
    return
  }
  if (isTitleActive.value || !color) {
    props.editor?.chain().focus().unsetBackgroundColor().run();
  } else {
    props.editor?.chain().focus().setBackgroundColor(color).run()
  }
  curColor.value = color;
}
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
