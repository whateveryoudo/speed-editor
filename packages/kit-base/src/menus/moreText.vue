<!--
 * @Author: ykx
 * @Date: 2022-11-10 19:15:40
 * @LastEditTime: 2022-12-07 11:19:20
 * @LastEditors: your name
 * @Description: 更多文字形式设置
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\moreText.vue
-->
<template>
  <Popover v-if="!disableMenu" @open-change="handlePopoverOpenChange" overlay-class-name="toolbar-popover-wrapper text-popover-wrapper" trigger="click"
    placement="bottom">
    <template #content>
      <Space>
        <ul class="text-list-wrapper">
          <li v-for="item in textItems" :key="item.key" class="list-item">
            <s-keymap-tip :keyMap="item.keyMap" :title="item.name" placement="right">
              <Button type="text" class="shadow-btn-wrapper" v-on="item.action ? getButtonEvents(item.action) : {}"
                style="width: 100%; text-align: left;">
                <s-icon-font v-if="item.iconType" :size="item.size || 17" :type="item.iconType" />
                {{ item.name }}
              </Button>
              <s-icon-font v-if="selectItem && selectItem.key === item.key" type="icon-kl-gouxuan"
                class="absolute top-[50%] translate-y-[-50%] left-[13px]" />
            </s-keymap-tip>
          </li>
        </ul>
      </Space>
    </template>
    <Tooltip placement="bottom" v-model:open="tooltipOpen">
      <template #title> 更多文本样式 </template>
      <Button type="text" class="shadow-btn-wrapper">
        <s-icon-font :size="16" type="icon-kl-text" />
        <caret-down-outlined class="dropdown-trigger" />
      </Button>
    </Tooltip>
  </Popover>
  <Tooltip v-else :title="false">
    <Button type="text" class="shadow-btn-wrapper" disabled>
      <s-icon-font :size="16" type="icon-kl-text" />
      <caret-down-outlined class="dropdown-trigger" />
    </Button>
  </Tooltip>
</template>

<script setup lang="tsx">
import { Button, Popover, Space, Tooltip } from 'ant-design-vue'
import { Editor } from '@tiptap/core'
import { CaretDownOutlined } from '@ant-design/icons-vue'
import { useActive } from '@speed-editor/composables'
import { ref, PropType, computed } from 'vue'
// import { Code as InlineCode } from '@st/extensions/code'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { getShortcutTipByKey } from '@speed-editor/shared'
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
  triggerType: {
    type: String as PropType<'menu' | 'bubble'>,
    default: 'menu',
  },
})
type TextType = 'sup' | 'sub' | 'code'
const tooltipOpen = ref(false)
const isTitleActive = useActive(props.editor, 'title')
const isSupActive = useActive(props.editor, Superscript.name)
const isSubActive = useActive(props.editor, Subscript.name)
const isCodeActive = useActive(props.editor, 'code')
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value
})
const current = computed(() => {
  if (isSupActive.value) {
    return 'sup'
  } else if (isSubActive.value) {
    return 'sub'
  } else if (isCodeActive.value) {
    return 'code'
  } else {
    return ''
  }
})
interface TextItem {
  key: TextType
  name: string
  iconType?: string
  keyMap?: string
  size?: number
  action?: (editor: Editor) => void
}
// 选中的项
const selectItem = computed(() => {
  return textItems.value.find((item: TextItem) => item.key === current.value) as TextItem
})
const getButtonEvents = (action: (editor: Editor) => void) => {
  return props.triggerType === 'menu' ? {
    mousedown: (e: MouseEvent) => {
      e.preventDefault()
      action(props.editor)
    }
  } : { click: () => action(props.editor) }
}
//追加互斥操作
const removeAllText = () => {
  props?.editor.chain().focus().unsetSuperscript().run()
  props?.editor.chain().focus().unsetSubscript().run()
  props?.editor.chain().focus().unsetCode().run()
}
const textItems = ref<TextItem[]>([
  {
    key: 'sup',
    name: '上标',
    iconType: 'icon-kl-superscript',
    keyMap: getShortcutTipByKey('sup'),
    action: () => {
      
      let tempActive = isSupActive.value;
      removeAllText();
      if (!tempActive) {
        props?.editor.chain().focus().setSuperscript().run()
      }
    },
  },  
  {
    key: 'sub',
    name: '下标',
    keyMap: getShortcutTipByKey('sub'),
    iconType: 'icon-kl-subscript',
    action: () => {
      let tempActive = isSubActive.value;
      removeAllText();
      if (!tempActive) {
        props?.editor.chain().focus().setSubscript().run()
      }
    },
  },
  {
    key: 'code',
    name: '代码',
    iconType: 'icon-kl-code',
    keyMap: '⌘/Ctrl + E',
    size: 18,
    action: () => {
      let tempActive = isCodeActive.value;
      removeAllText();
      if (!tempActive) {
        props?.editor.chain().focus().setCode().run()
      }
    },
  },
])
const handlePopoverOpenChange = (open: boolean) => {
  if (open) {
    tooltipOpen.value = false
  }
}
</script>
<style lang="less">
.text-popover-wrapper {


  .text-list-wrapper {
    padding: 4px 0;
    margin: 0;
    width: 120px;

    .list-item {
      position: relative;
      padding: 0 10px;
      display: flex;
      align-items: center;
      height: 35px;
      justify-content: flex-start;
    }
  }
}
</style>
