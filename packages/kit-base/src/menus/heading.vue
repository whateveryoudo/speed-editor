<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:55:26
 * @LastEditTime: 2022-11-18 16:39:08
 * @LastEditors: your name
 * @Description: 文字选择
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\heading.vue
-->
<template>
  <Select :dropdownMatchSelectWidth="false" :bordered="false" class="w-[80px] shadow-ant-select" :value="current"
    :disabled="!editableCpt || isTitleActive" popupClassName="popover-check-dropdown popover-heading-dropdown" :options="headingOptions"
    @change="handleChange">
    <template #option="{ value: val, label, style }">
      <span class="place-check-icon">
        <check-outlined v-if="current === val" />
      </span>
      <span :style="val === 'paragraph' ? { fontWeight: 'normal' } : style">
        {{ label }}
      </span>
    </template>
    <template #suffixIcon>
      <CaretDownOutlined :style="{ color: (!isTitleActive && editableCpt) ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.25)' }" />
    </template>
  </Select>
</template>

<script setup lang="ts">
import { Select } from 'ant-design-vue'
import { PropType, reactive, computed } from 'vue'
import { Editor } from '@tiptap/core'
import { useActive } from '@speed-editor/composables'
import { CheckOutlined, CaretDownOutlined } from '@ant-design/icons-vue'
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
const { editableCpt } = useSpeedEditor();
const isTitleActive = useActive(props.editor, 'title')
const isH1Active = useActive(props.editor, 'heading', { level: 1 })
const isH2Active = useActive(props.editor, 'heading', { level: 2 })
const isH3Active = useActive(props.editor, 'heading', { level: 3 })
const isH4Active = useActive(props.editor, 'heading', { level: 4 })
const isH5Active = useActive(props.editor, 'heading', { level: 5 })
const isH6Active = useActive(props.editor, 'heading', { level: 6 })
const current = computed(() => {
  if (isH1Active.value) {
    return '1'
  } else if (isH2Active.value) {
    return '2'
  } else if (isH3Active.value) {
    return '3'
  } else if (isH4Active.value) {
    return '4'
  } else if (isH5Active.value) {
    return '5'
  } else if (isH6Active.value) {
    return '6'
  } else {
    return 'paragraph'
  }
})
const headingOptions = reactive([
  { value: 'paragraph', label: '正文' },
  { value: '1', label: '标题1', style: { fontSize: '1.3em' } },
  { value: '2', label: '标题2', style: { fontSize: '1.1em' } },
  { value: '3', label: '标题3', style: { fontSize: '1.0em' } },
  { value: '4', label: '标题4', style: { fontSize: '0.9em' } },
  { value: '5', label: '标题5', style: { fontSize: '0.8em' } },
  { value: '6', label: '标题6', style: { fontSize: '0.8em' } },
])
const handleChange = (value: string) => {
  if (value === 'paragraph') {
    props.editor?.chain().focus().setParagraph().run()
  } else {
    props.editor
      ?.chain()
      .focus()
      .toggleHeading({ level: Number(value) as any })
      .run()
  }
}
</script>
<style lang="less">
.popover-heading-dropdown {
  .ant-select-item-option-content {
    font-weight: 600;
  }
}
</style>