<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import type { BubbleMenuKey, SpeedEditorShellProps } from '@speed-tiptap-editor/shared'

const props = defineProps<{
  editor: unknown
  bubbleMenus: BubbleMenuKey[]
  registry: Partial<Record<BubbleMenuKey, Component[]>>
  textBubbleMenu?: SpeedEditorShellProps['textBubbleMenu']
}>()

const activeMenus = computed(() =>
  props.bubbleMenus.filter((key) => {
    if (key === 'text') return props.textBubbleMenu?.enabled !== false
    return true
  }),
)
</script>

<template>
  <template v-for="key in activeMenus" :key="key">
    <component
      v-for="(Comp, idx) in registry[key] ?? []"
      :key="`${key}-${idx}`"
      :is="Comp"
      :editor="editor"
      :text-bubble-menu="key === 'text' ? textBubbleMenu : undefined"
    />
  </template>
</template>
