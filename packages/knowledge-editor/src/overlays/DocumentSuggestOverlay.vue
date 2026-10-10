<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { SuggestionToolTip, tooltipElement } from '@speed-editor/extension-kit'

defineProps<{ editor: Editor }>()
</script>

<template>
  <SuggestionToolTip :element="tooltipElement" :editor="editor" />
</template>
