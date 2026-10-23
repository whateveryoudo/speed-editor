<script setup lang="ts">
import { ref } from 'vue'
import { LiteEditor } from '@speed-editor/lite-editor'
import { KnowledgeEditor } from '@speed-editor/knowledge-editor'

const currentMode = ref<'knowledge' | 'lite'>('knowledge')
const isEditable = ref(true)
const enableMind = ref(true)

// LiteEditor 示例内容 (HTML)
const liteContent = ref(`
<h2>欢迎体验 Speed Tiptap Editor（Lite 模式）</h2>
<p>这是<strong>轻量编辑器模式</strong>，适合用于评论、表单输入、后台通知等场景。</p>
<ul>
  <li>📦 体积小巧，开箱即用</li>
  <li>🎨 原生 Ant Design Vue 风格工具栏与气泡菜单</li>
  <li>💡 支持快捷键、行内格式、列表与高亮引用</li>
</ul>
<p>你可以直接选中文本，体验<strong>浮动气泡菜单</strong>，或在工具栏插入图片与表格！</p>
`)

// KnowledgeEditor 示例内容 (JSON 结构，包含文本、高亮块和示例附件)
const docTitle = ref('Speed Knowledge 文档编辑器体验')
const docJson = ref({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '这是一个类似' },
        { type: 'text', marks: [{ type: 'bold' }], text: ' 语雀 / Notion ' },
        { type: 'text', text: '的现代知识库排版编辑器。自带独立文档大标题、居中版心布局以及全功能工具栏。' },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '✨ 核心亮点与附件体验' }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', marks: [{ type: 'bold' }], text: '图片与附件免后端模拟' },
                { type: 'text', text: '：你可以直接在工具栏点击“图片”或“附件”，或直接拖拽文件进编辑器体验上传！' },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', marks: [{ type: 'bold' }], text: '全功能排版' },
                { type: 'text', text: '：包含格式刷、多级标题、字号、颜色、对齐、表格与插入菜单。' },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '下方是一个预设的演示附件卡片（支持点击右侧“眼睛”查看预览说明，或点击“下载”）：' }],
    },
    {
      type: 'attachment',
      attrs: {
        fileId: 'mock_demo_doc',
        fileName: 'Speed-Knowledge-架构设计说明.docx',
        fileSize: 1048576,
        fileType: 'document',
        displayMode: 'card',
      },
    },
    {
      type: 'callout',
      attrs: { type: 'info' },
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '💡 说明：真实业务中，图片/附件对接 MinIO 对象存储，附件在线预览已深度接入 OnlyOffice。完整体验请看顶部引导链接！' },
          ],
        },
      ],
    },
  ],
})
</script>

<template>
  <div class="demo-wrapper">
    <!-- 顶部横幅：生态导流提示 -->
    <div class="demo-banner">
      <span>💡 <strong>体验提示</strong>：当前 Demo 采用纯前端本地 Mock 上传。生产级附件在线预览（已接入 <strong>OnlyOffice</strong>）、<strong>MinIO</strong> 对象存储与多人实时协同，已在开源知识库系统 <strong>SpeedDoc</strong> 中完整落地：</span>
      <a href="http://speeddoc.cn/" target="_blank" class="banner-btn">前往体验完整版知识库 ➔</a>
    </div>

    <!-- 顶部导航与控制栏 -->
    <header class="demo-header">
      <div class="demo-header__left">
        <span class="logo-title">Speed Editor</span>
        <div class="mode-tabs">
          <button
            :class="{ active: currentMode === 'knowledge' }"
            @click="currentMode = 'knowledge'"
          >
            📘 KnowledgeEditor (知识库模式)
          </button>
          <button
            :class="{ active: currentMode === 'lite' }"
            @click="currentMode = 'lite'"
          >
            📝 LiteEditor (轻量模式)
          </button>
        </div>
      </div>

      <div class="demo-header__controls">
        <label class="control-item">
          <span>可编辑状态:</span>
          <a-switch v-model:checked="isEditable" checked-children="编辑" un-checked-children="只读" />
        </label>
        <label v-if="currentMode === 'knowledge'" class="control-item">
          <span>思维导图:</span>
          <a-switch v-model:checked="enableMind" checked-children="开" un-checked-children="关" />
        </label>
        <a-button type="link" href="/speed-editor/docs/" target="_self">
          📖 查看文档
        </a-button>
      </div>
    </header>

    <!-- 编辑器主体渲染区 -->
    <main class="demo-content">
      <!-- 知识库模式 -->
      <div v-if="currentMode === 'knowledge'" class="editor-container knowledge-box">
        <KnowledgeEditor
          v-model:title="docTitle"
          :editable="isEditable"
          :menubar="isEditable"
          :json="docJson"
          :mind="enableMind"
        />
      </div>

      <!-- 轻量模式 -->
      <div v-else class="editor-container lite-box">
        <div class="lite-card">
          <LiteEditor
            v-model:content="liteContent"
            :editable="isEditable"
            :menubar="isEditable"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.demo-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.demo-banner {
  background: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 10px 24px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.banner-btn {
  color: #2563eb;
  font-weight: 600;
  text-decoration: underline;
  white-space: nowrap;
}

.banner-btn:hover {
  color: #1d4ed8;
}

.demo-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.demo-header__left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.logo-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.mode-tabs {
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  gap: 4px;
}

.mode-tabs button {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tabs button.active {
  background: #ffffff;
  color: #0ea5e9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.demo-header__controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.demo-content {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 24px;
}

.editor-container {
  width: 100%;
}

.knowledge-box {
  max-width: 1100px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  min-height: calc(100vh - 120px);
  overflow: hidden;
}

.lite-box {
  max-width: 860px;
}

.lite-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 16px;
  min-height: 500px;
}
</style>
