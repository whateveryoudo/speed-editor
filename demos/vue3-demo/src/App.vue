<script setup lang="ts">
import '@speed-editor/knowledge-editor/style.css'
import { ref } from 'vue'
import { LiteEditor } from '@speed-editor/lite-editor'
import { KnowledgeEditor } from '@speed-editor/knowledge-editor'

const tab = ref<'lite' | 'knowledge'>('lite')
const docJson = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '文档正文' }] }] }
</script>

<template>
  <div class="demo">
    <h1>speed-editor v2 架构预览</h1>
    <p>无 core 包；编辑器 UI 将迁入 <code>@speed-editor/ui</code></p>
    <nav class="demo__tabs">
      <button :class="{ active: tab === 'lite' }" @click="tab = 'lite'">LiteEditor</button>
      <button :class="{ active: tab === 'knowledge' }" @click="tab = 'knowledge'">KnowledgeEditor</button>
    </nav>
    <LiteEditor v-if="tab === 'lite'" content="<p>首页内容</p>" :editable="false" />
    <KnowledgeEditor v-else :json="docJson" :editable="false" :mind="true" />
  </div>
</template>

<style>
body { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f5; }
.demo { max-width: 900px; margin: 0 auto; padding: 24px; }
.demo__tabs { display: flex; gap: 8px; margin: 16px 0; }
.demo__tabs button { padding: 8px 14px; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
.demo__tabs button.active { border-color: #1677ff; color: #1677ff; }
</style>
