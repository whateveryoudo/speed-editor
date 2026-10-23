# 内置模式 (Presets)

Speed Tiptap Editor 内置了两种开箱即用的编辑器形态，分别针对**日常轻量输入**与**长篇文档/知识库**量身定制。

---

## 模式特性对比

| 对比维度 | Lite 模式 (`LiteEditor`) | Knowledge 模式 (`KnowledgeEditor`) |
| :--- | :--- | :--- |
| **适用场景** | 评论、发帖、表单填写、后台日常文字录入 | 团队文档中心、个人知识库、类似语雀/Notion 场景 |
| **文档大标题** | ❌ 无（专注正文编辑） | ✅ 内置独立文档大标题，支持 `v-model:title` |
| **布局版心** | 紧凑型自适应，适合嵌入卡片或弹窗 | 类似语雀的居中阅读版心，行宽与间距规范优雅 |
| **悬浮块拖拽** | ❌ 默认关闭 | ✅ 内置支持，悬浮即可拖拽段落块或进行块转化 |
| **工具栏** | 精简常用工具（撤销、加粗、颜色、对齐等） | 全量工具栏（含插入下拉大菜单、表格等全套功能） |
| **思维导图扩展** | ❌ 不包含 | ✅ 开箱支持（配置 `:mind="true"` 即可） |
| **多人协同能力** | ❌ 单人本地编辑 | ✅ 原生就绪（传入 `collaboration-config` 即可） |
| **推荐数据绑定** | 直接绑定 HTML 字符串：`v-model:content` | 推荐绑定文档模型：`v-model:json` |

---

## 1. Lite 模式（轻量富文本）

适合常规业务系统中的文本录入。体积小、启动快，不附带任何重型依赖。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LiteEditor } from '@speed-editor/lite-editor'
import '@speed-editor/base-editor/style.css'

const content = ref('<p>这是一段普通富文本内容</p>')
const isEditing = ref(true)
</script>

<template>
  <div style="border: 1px solid #e2e8f0; border-radius: 8px;">
    <LiteEditor
      v-model:content="content"
      :editable="isEditing"
      :menubar="isEditing"
    />
  </div>
</template>
```

---

## 2. Knowledge 模式（知识库全功能模式）

适合知识库、长文档排版或企业协同平台。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { KnowledgeEditor } from '@speed-editor/knowledge-editor'
import '@speed-editor/base-editor/style.css'

const docTitle = ref('我的第一篇文档')
const docJson = ref({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: '知识库正文...' }] }]
})
const isEditing = ref(true)
</script>

<template>
  <KnowledgeEditor
    v-model:title="docTitle"
    :json="docJson"
    :editable="isEditing"
    :menubar="isEditing"
    :mind="true"
  />
</template>
```
