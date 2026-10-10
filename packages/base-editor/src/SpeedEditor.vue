<script setup lang="ts">
import { watch, ref, inject, type Ref, computed, onUnmounted, type Component } from 'vue'
import { MenuBarShell, BubbleMenuBarShell } from '@speed-tiptap-editor/ui'
import {
  mergePluginRegistries,
  resolveToolbarKeys,
  resolveBubbleMenus,
  type EditorLayoutConfig,
  type SpeedEditorPlugin,
  type BubbleMenuKey,
  type SpeedEditorShellProps,
} from '@speed-tiptap-editor/shared'
import { legacyToolbarButtons, legacyBubbleMenus } from './legacyRegistry'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { useSpeedEditorProvider } from '@speed-tiptap-editor/composables'
import { EditorPreviewImage } from './helpers/previews'
import { editorConfig } from '@speed-tiptap-editor/shared'
import { onKeyStroke } from '@vueuse/core'
import { ConfigProvider, message, theme } from 'ant-design-vue'
import { useAntdCssVars } from 'speed-components-ui/hooks'
import { debounce } from 'lodash-es'
import { type GlobalConfig } from './plugin'
import type { CSSProperties } from 'vue'
import type { Editor, Extensions } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'
import type { UserInfo, IUploadConfig, ToolBarConfig, SearchReplaceConfig } from '@speed-tiptap-editor/shared'

const defaultLayout: EditorLayoutConfig = {
  name: 'custom',
  getExtensions: () => [],
  toolbar: [],
  bubbleMenus: [],
  features: {
    hasTitle: false,
    hasDragHandle: false,
    contentMode: 'html',
    showDocumentSuggest: false,
    showSearchReplace: false,
  },
}

const speedUseTiptapConfig = inject<Ref<GlobalConfig>>(
  'speedUseTiptapConfig',
  ref<GlobalConfig>({}),
)

defineOptions({
  name: 'SpeedEditor',
})

const props = withDefaults(defineProps<{
  /** 布局与扩展配置，由各 preset 包（lite/knowledge）传入；base 不内置场景 preset */
  layout?: EditorLayoutConfig
  /** 自定义插件（toolbar / bubble / insert 随插件注册） */
  plugins?: SpeedEditorPlugin[]
  /** 外部注入的 Tiptap 扩展（如协同壳注入 Collaboration 扩展），base 不感知 yjs */
  extraExtensions?: Extensions
  /** 协同模式：内容以 Yjs 为准，不走 v-model:content */
  collaborationMode?: boolean
  /** 协同壳注入：远端变更时跳过标题 emit */
  shouldSkipTitleEmit?: (transaction: Transaction) => boolean
  theme?: 'light' | 'dark'
  antdToken?: any
  editorStyle?: CSSProperties
  headerStyle?: CSSProperties
  mainStyle?: CSSProperties
  /** 页面式内容宽度（居中留白）；仅样式，与 preset 无关 */
  pageLayout?: boolean
  hideBorder?: boolean
  content?: string
  json?: string | null | Record<string, any>
  title?: string
  docId?: string
  docType?: 'document' | 'template'
  editable?: boolean
  menubar?: boolean
  hideComment?: boolean
  placeholder?: string
  toolbarKeys?: ToolBarConfig[]
  excludeKeys?: string[]
  quickInsertExcludeKeys?: string[]
  bubbleMenus?: BubbleMenuKey[]
  upload?: IUploadConfig
  image?: IUploadConfig
  file?: IUploadConfig
  fontSize?: {
    default?: string
    options?: { value: string; label: string }[]
  }
  fontFamily?: {
    default?: string
    options?: { value: string; label: string }[]
  }
  textBubbleMenu?: SpeedEditorShellProps['textBubbleMenu']
  ai?: SpeedEditorShellProps['ai']
  mentionUserFetch?: (query: string) => Promise<UserInfo[]>
  documentSuggestConfig?: { rules?: any[] }
  sdComponentsConfig?: {
    apis?: { [key: string]: any }
    transformRequestRes?: (res: any) => ResponseType
  }
  searchReplace?: SearchReplaceConfig
}>(), {
  content: '',
  docType: 'document',
  editable: true,
  menubar: true,
  collaborationMode: false,
  editorStyle: () => ({}),
  headerStyle: () => ({}),
  mainStyle: () => ({}),
  pageLayout: false,
  hideComment: true,
  placeholder: '输入 / 唤起更多',
  theme: 'light',
  textBubbleMenu: () => ({ enabled: true }),
  searchReplace: () => ({ enabled: true, shortcut: true }),
  documentSuggestConfig: () => ({ rules: [] }),
})

const isSearchReplaceEnabled = computed(() => {
  if (props.searchReplace?.enabled !== undefined) {
    return props.searchReplace.enabled
  }
  return activeLayout.value.features?.showSearchReplace ?? true
})
const isSearchReplaceShortcutEnabled = computed(() => {
  if (!isSearchReplaceEnabled.value) return false
  return props.searchReplace?.shortcut !== false
})

const emit = defineEmits(['update:title', 'update:content', 'update:collaborators'])

const activeLayout = computed(() => props.layout ?? defaultLayout)

const resolvedToolbarKeys = computed(() =>
  resolveToolbarKeys(activeLayout.value, props.toolbarKeys, props.excludeKeys),
)

const resolvedBubbleMenus = computed(() =>
  resolveBubbleMenus(activeLayout.value, props.bubbleMenus),
)

const pluginRegistry = computed(() => mergePluginRegistries(props.plugins ?? []))

const resolvedToolbarButtons = computed(() => ({
  ...legacyToolbarButtons,
  ...(pluginRegistry.value.toolbar.buttons as Record<string, Component>),
}))

const resolvedInsertItems = computed(() => pluginRegistry.value.toolbar.insertItems)

const resolvedBubbleRegistry = computed(() => {
  const fromPlugins = pluginRegistry.value.bubble.menus
  const merged: Partial<Record<BubbleMenuKey, Component[]>> = {
    ...legacyBubbleMenus,
  }
  for (const [key, comps] of Object.entries(fromPlugins)) {
    const k = key as BubbleMenuKey
    merged[k] = [...(merged[k] ?? []), ...(comps as Component[])]
  }
  return merged
})

const resolvedOverlays = computed(() => pluginRegistry.value.overlays)

/** 解析 antdToken：支持 props 与 app.use 配置；配置可为对象或 () => object */
function resolveAntdTokenSource(source: unknown): Record<string, unknown> | undefined {
  if (source == null) return undefined
  const value = typeof source === 'function'
    ? (source as () => Record<string, unknown>)()
    : source
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return Object.keys(value).length > 0 ? (value as Record<string, unknown>) : undefined
}

/** plugin 配置优先，props 覆盖（与 cptTheme / CSS 变量同步） */
const resolvedAntdToken = computed(() => {
  const fromConfig = resolveAntdTokenSource(speedUseTiptapConfig.value?.antdToken)
  const fromProp = resolveAntdTokenSource(props.antdToken)
  if (!fromConfig && !fromProp) return undefined
  return { ...(fromConfig ?? {}), ...(fromProp ?? {}) }
})

const cptTheme = computed(() => {
  const { theme: themeFromConfig } = speedUseTiptapConfig.value || {}
  const isDark = props.theme === 'dark' || themeFromConfig === 'dark'
  const token = resolvedAntdToken.value
  if (isDark) {
    return token
      ? { algorithm: theme.darkAlgorithm, token }
      : { algorithm: theme.darkAlgorithm }
  }
  return token ? { token } : {}
})

const { previewInstance, updateSearchReplaceVisible } = useSpeedEditorProvider(props)

onKeyStroke((e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
    e.preventDefault()
    message.info(`${editorConfig.TITLE}会实时保存你的数据，无需手动保存。`)
    return false
  }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
    if (isSearchReplaceShortcutEnabled.value) {
      e.preventDefault()
      updateSearchReplaceVisible(true)
      return false
    }
  }
})

const { updateTheme, cleanup: cleanupAntdCssVars } = useAntdCssVars()

const debouncedEmitTitle = debounce((titleText: string) => {
  if (!titleText || titleText === props.title) {
    return
  }
  emit('update:title', titleText)
}, 500)

const resolvePluginExtensions = (): Extensions => {
  const result: Extensions = []
  for (const ext of pluginRegistry.value.extensions) {
    if (typeof ext === 'function') {
      result.push(...(ext(props as Record<string, unknown>) as Extensions))
    } else {
      result.push(...(ext as Extensions))
    }
  }
  return result
}

/** 合并 Tiptap extensions，来源分三层（顺序即注册顺序） */
const buildExtensions = (): Extensions => {
  const shellProps = {
    ...(props as Record<string, unknown>),
    collaborationMode: props.collaborationMode,
  }
  // ① preset 默认能力：layout.getExtensions，如 knowledge → getKnowledgeKit（extension-kit）
  const layoutExtensions = activeLayout.value.getExtensions(shellProps) as Extensions
  return [
    ...layoutExtensions,
    // ② 插件追加能力：plugins[].extensions，如 extraPlugins、mind adapter、import-export
    ...resolvePluginExtensions(),
    // ③ 壳层直注：extraExtensions prop，如 CollaborativeEditor 注入 Yjs / Collaboration
    ...(props.extraExtensions ?? []),
  ]
}

const editor = useEditor({
  editable: props.editable,
  autofocus: 'end',
  content: props.collaborationMode ? undefined : (props.content || undefined),
  editorProps: {
    attributes: {
      class: activeLayout.value.features.hasDragHandle
        ? 'editor-content has-drag-handle'
        : 'editor-content',
    },
  },
  onUpdate({ editor, transaction }) {
    if (!props.collaborationMode) {
      emit('update:content', editor.getHTML())
    }

    if (activeLayout.value.features.hasTitle) {
      if (props.collaborationMode && props.shouldSkipTitleEmit?.(transaction)) {
        return
      }
      try {
        const titleNode = editor.state.doc?.content?.firstChild?.content.firstChild
        debouncedEmitTitle(titleNode?.textContent ?? '')
      } catch {
        //
      }
    }
  },
  extensions: buildExtensions(),
  onCreate({ editor }) {
    previewInstance.value = new EditorPreviewImage(
      editor,
      () => speedUseTiptapConfig.value?.access_token,
    )
    if (!speedUseTiptapConfig.value) {
      throw new Error(
        '请先调用 app.use(SpeedTiptapEditor) 进行初始化一些配置，否则可能会初始化一些图标显示问题！',
      )
    }
  },
})

defineExpose({ editor })

watch(
  () => props.content,
  (newContent) => {
    if (props.collaborationMode || !editor.value) {
      return
    }
    if (newContent !== editor.value.getHTML()) {
      editor.value.commands.setContent(newContent)
    }
  },
)

watch(
  () => props.title,
  (newTitle) => {
    if (!editor.value || !newTitle || !activeLayout.value.features.hasTitle) {
      return
    }

    const { doc } = editor.value.state
    const firstChild = doc.firstChild
    const currentTitle = firstChild?.type.name === 'title' ? firstChild.textContent : ''

    if (currentTitle === newTitle) {
      return
    }

    if (firstChild?.type.name === 'title') {
      editor.value.commands.insertContentAt({ from: 0, to: firstChild.nodeSize }, newTitle)
    }
  },
)

watch(
  () => props.editable,
  (newEditable: boolean) => {
    editor.value?.setEditable(newEditable)
  },
)

watch(
  () => props.json,
  (newJson: string | null | undefined | Record<string, any>) => {
    if (props.collaborationMode || !editor.value) {
      return
    }
    editor.value.commands.setContent(
      newJson ? (typeof newJson === 'string' ? JSON.parse(newJson) : newJson) : '',
    )
  },
  { immediate: true },
)

watch(
  resolvedAntdToken,
  (token) => {
    if (token) {
      updateTheme?.({ token })
    }
  },
  { immediate: true },
)
watch(
  [() => props.extraExtensions, () => props.layout, () => props.plugins],
  () => {
    if (!editor.value) {
      return
    }
    editor.value.setOptions({
      extensions: buildExtensions(),
    })
  },
  { deep: true },
)

onUnmounted(() => {
  editor.value?.destroy()
  cleanupAntdCssVars?.()
})

</script>

<template>
  <ConfigProvider :theme="cptTheme">
    <div
      :class="[
        'wrap speed-tiptap-editor',
        activeLayout.name,
        hideBorder ? 'hide-border' : '',
        pageLayout ? 'page-layout' : '',
      ]"
      :style="editorStyle"
    >
      <MenuBarShell :style="headerStyle" :toolbar-keys="resolvedToolbarKeys" v-if="menubar && editor" class="header"
        :editor="editor" :buttons="resolvedToolbarButtons" :insert-items="resolvedInsertItems" />
      <BubbleMenuBarShell v-if="editor" :editor="editor" :bubble-menus="resolvedBubbleMenus"
        :registry="resolvedBubbleRegistry" :text-bubble-menu="textBubbleMenu" />
      <main :style="mainStyle"
        :class="[
          'editor-content-wrap',
          activeLayout.name === 'knowledge' || pageLayout ? 'page-content-wrap' : '',
          activeLayout.name === 'knowledge' ? 'knowledge-content-wrap' : '',
        ]">
        <editor-content :editor="editor"
          :class="['h-full', (editor && editor?.storage?.formatPainter?.isFormatPainterActive) ? 'format-painter-active' : '']" />
      </main>
      <template v-for="(Overlay, index) in resolvedOverlays" :key="index">
        <component :is="Overlay" v-if="editor" :editor="editor" />
      </template>
    </div>
  </ConfigProvider>
</template>

<style scoped lang="less">
.wrap {
  width: 100%;
  height: 100%;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  position: relative;

  &.lite {
    &>header {
      justify-content: flex-start;

      :deep(.ste-menu-bar),
      :deep(.ste-menu-bar__items) {
        justify-content: flex-start;
      }
    }
  }

  &.knowledge {
    &>header {
      justify-content: center;
      border: none;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }

    &>main {
      border: none;
    }
  }

  /* knowledge：正文区自身限宽（与历史一致） */
  &.knowledge > main.page-content-wrap {
    max-width: 1000px;
    margin: 0 auto;
  }

  /*
   * lite + pageLayout（word）：main 通栏，滚动条贴容器最右；
   * 正文内容再居中留白。
   */
  &.page-layout:not(.knowledge) > main.page-content-wrap {
    max-width: none;
    width: 100%;
    margin: 0;

    :deep(.editor-content) {
      max-width: 1000px;
      margin-left: auto;
      margin-right: auto;
    }
  }

  &.hide-border {
    &>main {
      border: none;
    }
  }

  >header {
    z-index: 110;
    display: flex;
    padding: 0 10px;
    height: 40px;
    overflow: hidden;
    background-color: var(--ant-color-bg-base);
    align-items: center;
    border: 1px solid var(--ant-color-border);
    user-select: none;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .editor-content-wrap {
    padding-top: 10px;
  }

  >main {
    flex: 1;
    width: 100%;
    border: 1px solid var(--ant-color-border);
    border-top: none;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding: 0 10px;
    padding-bottom: 10px;
    box-sizing: border-box;
    position: relative;

    :deep(.editor-content) {
      min-height: 100%;

      &.has-drag-handle {
        padding-left: 50px;
        padding-right: 50px;
      }
    }
  }
}
</style>
