# 快速开始

Speed Editor 提供了高度分层与开箱即用的编辑器形态。根据你的业务场景，直接选择对应的组件即可快速上手。

---

## 1. 常见场景选择

* **场景 A：普通轻量编辑 / 文档纯静态查看态（无协同、极致轻量）**  
  👉 推荐使用 **`@speed-editor/lite-editor`**  
  * **编辑场景**：日常表单输入、评论留言、后台说明文本等；
  * **查看场景**：作为纯文档展示阅读器，不建立任何网络长连接，性能极佳。

* **场景 B：企业协作知识库 / 长篇技术文档（全功能、编辑态协同）**  
  👉 推荐使用 **`@speed-editor/knowledge-editor`**  
  * 自带文档大标题输入、类似语雀的阅读排版版心、全量工具栏与思维导图；
  * 进入编辑态时直接通过 socket 走多人实时协同与光标感知。

---

## 2. 安装

### 方式 1：安装轻量编辑器 (Lite)

```bash
# pnpm (推荐)
pnpm add @speed-editor/lite-editor

# npm
npm install @speed-editor/lite-editor
```

### 方式 2：安装知识库全功能编辑器 (Knowledge)

```bash
# pnpm
pnpm add @speed-editor/knowledge-editor

# npm
npm install @speed-editor/knowledge-editor
```

::: tip Peer 依赖建议
宿主请确保已安装 Vue 3 与 Ant Design Vue：
```bash
pnpm add vue ant-design-vue
```
若使用知识库多人实时协同，按需安装协同依赖：
```bash
pnpm add @tiptap/core @tiptap/pm @tiptap/vue-3 yjs
```
:::

---

## 3. 代码示例

### 使用 LiteEditor（轻量编辑 / 纯查看态）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LiteEditor } from '@speed-editor/lite-editor'
import '@speed-editor/base-editor/style.css'

const isEditing = ref(true)
const content = ref('<p>你好，Speed Editor！</p>')
</script>

<template>
  <div style="height: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <!-- 
      isEditing 为 true: 进入日常普通富文本编辑
      isEditing 为 false: 作为纯查看态文档渲染
    -->
    <LiteEditor
      v-model:content="content"
      :editable="isEditing"
      :menubar="isEditing"
    />
  </div>
</template>
```

---

### 使用 KnowledgeEditor（文档与知识库形态）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { KnowledgeEditor } from '@speed-editor/knowledge-editor'
import '@speed-editor/base-editor/style.css'

const isEditing = ref(true)
const docTitle = ref('团队协作项目方案')
const docJson = ref({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '知识库正文排版内容...' }]
    }
  ]
})

// 若需要协同，编辑态传入 collaboration-config 即可通过 socket 实时同步
const collabConfig = ref(undefined)
</script>

<template>
  <div style="height: 100vh;">
    <KnowledgeEditor
      v-model:title="docTitle"
      :editable="isEditing"
      :menubar="isEditing"
      :json="docJson"
      :mind="true"
      :collaboration-config="isEditing ? collabConfig : undefined"
    />
  </div>
</template>
```
