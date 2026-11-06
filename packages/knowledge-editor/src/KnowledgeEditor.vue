<script setup lang="ts">
import { computed } from 'vue'
import type * as Y from 'yjs'
import { SpeedEditor } from '@speed-editor/base-editor'
import { CollaborativeEditor, type CollaborationProviderLike } from '@speed-editor/collaboration-editor'
import type {
  CollaborationUser,
  SpeedEditorShellProps,
  SpeedEditorPlugin,
} from '@speed-editor/shared'
import {
  createKnowledgeEditorPlugins,
  type KnowledgeEditorPluginsOptions,
} from './createKnowledgeEditorPlugins'
import { knowledgeLayout } from './preset'

const props = defineProps<SpeedEditorShellProps & KnowledgeEditorPluginsOptions & {
  /** 外部直接注入的 Y.Doc（由协同连接器提供） */
  ydoc?: Y.Doc | null
  /** 外部直接注入的协同 Provider（可选，用于光标和感知） */
  provider?: CollaborationProviderLike | null
  /** 外部直接注入的用户信息 */
  user?: CollaborationUser | null
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
    ydoc: _ydoc,
    provider: _provider,
    user: _user,
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
    :ydoc="ydoc"
    :provider="provider"
    :user="user"
    @update:title="emit('update:title', $event)"
    @update:collaborators="emit('update:collaborators', $event)"
  />
  <SpeedEditor
    v-else
    v-bind="editorBindProps"
    @update:title="emit('update:title', $event)"
  />
</template>
