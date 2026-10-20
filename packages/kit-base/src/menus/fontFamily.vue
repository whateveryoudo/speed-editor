<template>
  <Select
    :dropdown-match-select-width="false"
    :bordered="false"
    class="w-[110px] shadow-ant-select"
    :value="currentFontFamily"
    :disabled="!editableCpt || isTitleActive"
    popup-class-name="popover-check-dropdown"
    :options="fontFamilyOptions"
    @change="handleChange"
  >
    <template #option="{ value: val, label }">
      <span class="place-check-icon">
        <check-outlined v-if="currentFontFamily === val" />
      </span>
      <span :style="val ? { fontFamily: String(val) } : undefined">{{ label }}</span>
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
import type { Editor } from '@tiptap/core'
import { useActive, useAttributes, useSpeedEditor } from '@speed-editor/composables'
import { CheckOutlined, CaretDownOutlined } from '@ant-design/icons-vue'

const DEFAULT_FONT_OPTIONS = [
  { value: '', label: '默认字体' },
  { value: 'SimSun', label: '宋体' },
  { value: 'SimHei', label: '黑体' },
  { value: 'KaiTi', label: '楷体' },
  { value: 'KaiTi_GB2312', label: '楷体_GB2312' },
  { value: 'FangSong', label: '仿宋' },
  { value: 'FangSong_GB2312', label: '仿宋_GB2312' },
  { value: 'STSong', label: '华文宋体' },
  { value: 'STFangsong', label: '华文仿宋' },
  { value: 'FZFangSong-Z02S', label: '方正仿宋简体' },
  { value: 'FZXiaoBiaoSong-B05S', label: '方正小标宋' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'PingFang SC', label: '苹方' },
  { value: 'Hiragino Sans GB', label: '冬青黑体简体中文' },
  { value: 'DengXian', label: '等线' },
  { value: 'DengXian Light', label: '等线 Light' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
]

const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
})

const { speedTiptapConfig, editableCpt } = useSpeedEditor()
const isTitleActive = useActive(props.editor, 'title')
const currentFontFamily = useAttributes(
  props.editor,
  'textStyle',
  { fontFamily: '' },
  (attrs) => attrs.fontFamily || '',
)

const fontFamilyOptions = computed(
  () => speedTiptapConfig?.value?.fontFamily?.options ?? DEFAULT_FONT_OPTIONS,
)

const handleChange = (value: string) => {
  const chain = props.editor?.chain().focus()
  if (!chain) return
  if (!value) {
    chain.unsetFontFamily().run()
    return
  }
  chain.setFontFamily(value).run()
}
</script>
