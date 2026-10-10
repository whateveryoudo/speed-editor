<script setup lang="ts">
import { computed } from 'vue'
import { SpeedEditor } from '@speed-editor/base-editor'
import { CollaborativeEditor } from '@speed-editor/collaboration-editor'
import type {
  CollaborationConfig,
  SpeedEditorShellProps,
  SpeedEditorPlugin,
} from '@speed-editor/shared'
import {
  createKnowledgeEditorPlugins,
  type KnowledgeEditorPluginsOptions,
} from './createKnowledgeEditorPlugins'
import { knowledgeLayout } from './preset'

const props = defineProps<SpeedEditorShellProps & KnowledgeEditorPluginsOptions & {
  collaborationConfig?: CollaborationConfig | null
  extraPlugins?: SpeedEditorPlugin[]
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:collaborators': [users: unknown[]]
}>()

const plugins = computed(() =>
  createKnowledgeEditorPlugins({
    mind: props.mind,
    flow: props.flow,
    extraPlugins: props.extraPlugins,
  }),
)

const menubar = computed(() => props.menubar ?? props.editable)

const editorBindProps = computed(() => {
  const {
    collaborationConfig: _cc,
    mind: _m,
    flow: _f,
    extraPlugins: _e,
    ...rest
  } = props as Record<string, unknown>
  return {
    ...rest,
    layout: knowledgeLayout,
    menubar: menubar.value,
    plugins: plugins.value,
  }
})
</script>

<template>
  <CollaborativeEditor
    v-if="editable"
    v-bind="editorBindProps"
    :collaboration-config="collaborationConfig"
    @update:title="emit('update:title', $event)"
    @update:collaborators="emit('update:collaborators', $event)"
  />
  <SpeedEditor
    v-else
    v-bind="editorBindProps"
    @update:title="emit('update:title', $event)"
  />
</template>
