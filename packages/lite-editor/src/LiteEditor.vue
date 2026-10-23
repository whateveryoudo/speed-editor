<script setup lang="ts">
import { computed, ref } from 'vue'
import { SpeedEditor } from '@speed-editor/base-editor'
import type {
  BubbleMenuKey,
  EditorLayoutConfig,
  SpeedEditorShellProps,
} from '@speed-editor/shared'
import { createLiteEditorPlugins } from './createLiteEditorPlugins'
import { liteLayout } from './preset'

/** lite 文字气泡默认不含 AI（宿主可传 textBubbleMenu 覆盖） */
const LITE_TEXT_BUBBLE_ITEMS: string[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'fontFamily',
  'fontSize',
  'textColor',
  'backgroundColor',
]

const props = withDefaults(
  defineProps<
    SpeedEditorShellProps & {
      /**
       * 支持 v-model（即 v-model:modelValue）
       */
      modelValue?: string
      /**
       * lite 下的页面样式：word = 内容区居中留白 + 左侧拖拽/转化为（仍是 lite preset）
       */
      layout?: 'default' | 'word'
    }
  >(),
  {
    editable: false,
    menubar: false,
    hideBorder: false,
    layout: 'default',
    searchReplace: () => ({ enabled: false, shortcut: false }),
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:content': [value: string]
  'update:title': [value: string]
  'update:collaborators': [users: unknown[]]
}>()

const speedEditorRef = ref<InstanceType<typeof SpeedEditor> | null>(null)
const editor = computed(() => speedEditorRef.value?.editor)

defineExpose({
  editor,
})

const plugins = computed(() => createLiteEditorPlugins())

const isWordLayout = computed(() => props.layout === 'word')

/** word 仍走 liteLayout，只开拖拽把手与 drag 气泡 */
const resolvedLayout = computed<EditorLayoutConfig>(() => {
  if (!isWordLayout.value) return liteLayout
  return {
    ...liteLayout,
    bubbleMenus: [...liteLayout.bubbleMenus, 'drag'] as BubbleMenuKey[],
    features: {
      ...liteLayout.features,
      hasDragHandle: true,
    },
  }
})

/** 优先使用 content，其次 modelValue 作为编辑内容 */
const resolvedContent = computed(() => props.content ?? props.modelValue ?? '')

/** 与 KnowledgeEditor 同：避免 shared shell props 与 base 包 dist 类型细差 */
const editorBindProps = computed(() => {
  const {
    textBubbleMenu: hostMenu,
    layout: _layout,
    content: _content,
    modelValue: _mv,
    ...rest
  } = props as Record<string, unknown>
  return {
    ...rest,
    content: resolvedContent.value,
    layout: resolvedLayout.value,
    pageLayout: isWordLayout.value,
    plugins: plugins.value,
    textBubbleMenu: hostMenu ?? {
      enabled: true,
      items: LITE_TEXT_BUBBLE_ITEMS,
    },
  }
})

const onUpdateContent = (value: string) => {
  emit('update:content', value)
  emit('update:modelValue', value)
}
</script>

<template>
  <SpeedEditor
    ref="speedEditorRef"
    v-bind="editorBindProps"
    @update:content="onUpdateContent"
    @update:title="emit('update:title', $event)"
    @update:collaborators="emit('update:collaborators', $event)"
  />
</template>
