<!--
 * @Description: 字号（对齐 Umo：中文号 + pt / px）
-->

<template>
  <Select
    :bordered="false"
    class="w-[88px] shadow-ant-select"
    :value="currentFontSize"
    :disabled="!editableCpt || isTitleActive"
    popupClassName="popover-check-dropdown"
    :options="fontSizeOptions"
    @change="handleChange"
  >
    <template #option="{ value: val, label }">
      <span class="place-check-icon">
        <check-outlined v-if="currentFontSize === val" />
      </span>
      {{ label }}
    </template>
    <template #suffixIcon>
      <CaretDownOutlined
        :style="{
          color: !isTitleActive && editableCpt ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.25)',
        }"
      />
    </template>
  </Select>
</template>

<script setup lang="ts">
import { Select } from 'ant-design-vue'
import { type PropType, computed } from 'vue'
import { Editor } from '@tiptap/core'
import { useActive } from '@speed-editor/composables'
import { useAttributes } from '@speed-editor/composables'
import { CheckOutlined, CaretDownOutlined } from '@ant-design/icons-vue'
import { useSpeedEditor } from '@speed-editor/composables'

/** 与 Umo Editor 字号列表对齐（value 保留 pt/px，便于对上 Word 粘贴） */
const DEFAULT_FONT_SIZE_OPTIONS = [
  { value: '14px', label: '默认' },
  { value: '42pt', label: '初号' },
  { value: '36pt', label: '小初' },
  { value: '26pt', label: '一号' },
  { value: '24pt', label: '小一' },
  { value: '22pt', label: '二号' },
  { value: '18pt', label: '小二' },
  { value: '16pt', label: '三号' },
  { value: '15pt', label: '小三' },
  { value: '14pt', label: '四号' },
  { value: '12pt', label: '小四' },
  { value: '10.5pt', label: '五号' },
  { value: '9pt', label: '小五' },
  { value: '7.5pt', label: '小六' },
  { value: '6.5pt', label: '默认' },
  { value: '10px', label: '10' },
  { value: '11px', label: '11' },
  { value: '12px', label: '12' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '22px', label: '22' },
  { value: '24px', label: '24' },
  { value: '26px', label: '26' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
  { value: '36px', label: '36' },
  { value: '42px', label: '42' },
  { value: '48px', label: '48' },
  { value: '72px', label: '72' },
  { value: '96px', label: '96' },
]

const { speedTiptapConfig, editableCpt } = useSpeedEditor()
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})
const isTitleActive = useActive(props.editor, 'title')

const defaultSize = computed(
  () => speedTiptapConfig?.value?.fontSize?.default ?? '14px',
)

const currentFontSize = useAttributes(
  props.editor,
  'textStyle',
  { fontSize: defaultSize.value },
  (attrs) => attrs.fontSize || defaultSize.value,
)

const fontSizeOptions = computed(() => {
  return speedTiptapConfig?.value?.fontSize?.options ?? DEFAULT_FONT_SIZE_OPTIONS
})

const handleChange = (value: string) => {
  props.editor?.chain().focus().setFontSize(value).run()
}
</script>
