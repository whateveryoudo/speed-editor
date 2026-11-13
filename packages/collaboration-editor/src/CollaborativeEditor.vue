<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import type * as Y from 'yjs'
import { SpeedEditor } from '@speed-editor/base-editor'
import { isChangeOrigin } from '@tiptap/extension-collaboration'
import type { Transaction } from '@tiptap/pm/state'
import { getRandomColor } from '@speed-editor/shared'
import { useCollaboration, type CollaborationProviderLike } from './useCollaboration'
import type {
  CollaborationUser,
  CollaborativeShellProps,
  SpeedEditorPlugin,
} from '@speed-editor/shared'

const props = defineProps<CollaborativeShellProps & {
  /** 外部直接注入的 Y.Doc 协同文档（由协同连接器如 @speed-collaboration 提供） */
  ydoc?: Y.Doc | null
  /** 外部直接注入的 Provider（可选，用于光标与感知） */
  provider?: CollaborationProviderLike | null
  /** 外部直接注入的用户信息 */
  user?: CollaborationUser | null
  plugins?: SpeedEditorPlugin[]
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:collaborators': [users: unknown[]]
}>()

const isCollabRequested = computed(() => props.editable !== false)

watchEffect(() => {
  if (isCollabRequested.value && !props.ydoc) {
    console.warn(
      '[speed-editor] 未检测到传入的 ydoc 实例，当前为单机模式。如需协同功能，请配合协同连接器（如 @speed-collaboration/vue3）传入 ydoc 与 provider。',
    )
  }
})

const { collaborationExtensions, isCollaborationActive } = useCollaboration({
  ydoc: computed(() => props.ydoc),
  provider: computed(() => props.provider),
  user: computed(() => props.user),
  onCollaboratorsChange: (users) => emit('update:collaborators', users),
})

const collaborationMode = computed(
  () => isCollabRequested.value && isCollaborationActive.value,
)

const shouldSkipTitleEmit = (transaction: Transaction) =>
  collaborationMode.value && isChangeOrigin(transaction)

const editorBindProps = computed(() => {
  const {
    ydoc: _ydoc,
    provider: _provider,
    user: _user,
    ...rest
  } = props as Record<string, unknown>
  return rest
})

const speedEditorRef = ref<InstanceType<typeof SpeedEditor> | null>(null)
const editor = computed(() => speedEditorRef.value?.editor)

// 响应式监听用户变动：采用 Tiptap 官方命令 updateUser 更新协同光标和头像，避免 setOptions 重新配置扩展打残 UndoManager
watch(
  [() => editor.value, () => props.user],
  ([currentEditor, currentUser]) => {
    if (currentEditor && currentUser) {
      currentEditor.commands.updateUser?.({
        id: currentUser.id,
        avatar: currentUser.avatar,
        name: currentUser.nickname || currentUser.username,
        color: currentUser.color ?? getRandomColor(),
      })
    }
  },
  { immediate: true },
)

function restoreCollaborationUndoManager(ed: any) {
  if (!ed?.state) return
  const undoPlugin = ed.state.plugins?.find((p: any) => p.key?.startsWith('y-undo'))
  if (!undoPlugin) return
  const undoManager = undoPlugin.getState(ed.state)?.undoManager
  if (undoManager) {
    if (!undoManager.trackedOrigins?.has(undoManager)) {
      undoManager.trackedOrigins.add(undoManager)
    }
    if (undoManager.afterTransactionHandler && undoManager.doc) {
      undoManager.doc.off('afterTransaction', undoManager.afterTransactionHandler)
      undoManager.doc.on('afterTransaction', undoManager.afterTransactionHandler)
    }
  }
}

// 兜底保障：当编辑器及所有内部浮动插件组件（BubbleMenu、DragHandle等）全部 mounted 挂载完毕后，统一走一次 Restore
onMounted(() => {
  nextTick(() => {
    restoreCollaborationUndoManager(editor.value)
  })
})

watch(
  () => editor.value,
  (ed) => {
    if (ed) {
      nextTick(() => {
        restoreCollaborationUndoManager(ed)
      })
    }
  },
)

defineExpose({
  editor,
})
</script>

<template>
  <SpeedEditor
    ref="speedEditorRef"
    v-bind="editorBindProps"
    :extra-extensions="collaborationExtensions"
    :collaboration-mode="collaborationMode"
    :should-skip-title-emit="shouldSkipTitleEmit"
    @update:title="emit('update:title', $event)"
  />
</template>
