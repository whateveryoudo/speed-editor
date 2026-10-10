<script setup lang="ts">
import { computed } from 'vue'
import { SpeedEditor } from '@speed-editor/base-editor'
import { isChangeOrigin } from '@tiptap/extension-collaboration'
import type { Transaction } from '@tiptap/pm/state'
import { useCollaboration } from './useCollaboration'
import type {
  CollaborationConfig,
  CollaborativeShellProps,
  SpeedEditorPlugin,
} from '@speed-editor/shared'

const props = defineProps<CollaborativeShellProps & {
  collaborationConfig?: CollaborationConfig | null
  plugins?: SpeedEditorPlugin[]
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:collaborators': [users: unknown[]]
}>()

const collaborationConfig = computed(() => props.collaborationConfig ?? null)

const requiresCollab = computed(
  () => props.editable !== false && !!collaborationConfig.value?.documentId,
)

const { collaborationExtensions, isCollaborationActive } = useCollaboration({
  config: collaborationConfig,
  enabled: requiresCollab,
  onCollaboratorsChange: (users) => emit('update:collaborators', users),
})

const collaborationMode = computed(
  () => requiresCollab.value && isCollaborationActive.value,
)

const ready = computed(() => !requiresCollab.value || isCollaborationActive.value)

const shouldSkipTitleEmit = (transaction: Transaction) =>
  collaborationMode.value && isChangeOrigin(transaction)

const editorBindProps = computed(() => {
  const { collaborationConfig: _cc, ...rest } = props as Record<string, unknown>
  return rest
})
</script>

<template>
  <SpeedEditor
    v-if="ready"
    :key="collaborationConfig?.documentId"
    v-bind="editorBindProps"
    :extra-extensions="collaborationExtensions"
    :collaboration-mode="collaborationMode"
    :should-skip-title-emit="shouldSkipTitleEmit"
    @update:title="emit('update:title', $event)"
  />
</template>
