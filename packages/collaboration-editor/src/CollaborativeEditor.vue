<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type * as Y from 'yjs'
import { SpeedEditor } from '@speed-editor/base-editor'
import { isChangeOrigin } from '@tiptap/extension-collaboration'
import type { Transaction } from '@tiptap/pm/state'
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

const editorKey = computed(() => {
  return props.ydoc?.guid ?? 'standalone-editor'
})
</script>

<template>
  <SpeedEditor
    :key="editorKey"
    v-bind="editorBindProps"
    :extra-extensions="collaborationExtensions"
    :collaboration-mode="collaborationMode"
    :should-skip-title-emit="shouldSkipTitleEmit"
    @update:title="emit('update:title', $event)"
  />
</template>
