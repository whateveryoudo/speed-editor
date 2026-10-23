# 协同编辑

Speed Editor 原生支持多人实时在线协同编辑。底层基于 **Yjs (CRDT)** 与 **WebSocket (Hocuspocus 协议)**，保证多人并发编辑冲突能够自动平滑解决，并实时感知所有协作者的光标与选中范围。

---

## 核心设计：查看态与协同编辑态分离

在真实业务场景中（如企业知识库），绝大多数用户是在“阅读/查看”文档，只有在主动点击“编辑”时才需要建立实时协同连接：

* **查看态（预览模式）**：
  * 无需连接 WebSocket，直接渲染文档内容，**零网络长连接开销，首屏渲染极快**。
* **编辑态（协同模式）**：
  * 自动建立 WebSocket 连接，直接走 socket 与服务端协同集群进行文档状态同步，并实时广播协作者光标。

---

## 安装依赖

使用协同编辑能力时，请确保宿主已安装 peer 依赖：

```bash
pnpm add yjs @hocuspocus/provider
```

---

## 开箱即用配置示例 (KnowledgeEditor)

在 `KnowledgeEditor` 中，你无需在外部手动管理复杂的 `ydoc` 生命周期，只需将协同配置传入 `:collaboration-config` 即可：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { KnowledgeEditor } from '@speed-editor/knowledge-editor'
import '@speed-editor/base-editor/style.css'

const isEditing = ref(false)
const docTitle = ref('团队协同方案说明')
const previewJson = ref({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: '文档正文内容...' }] }]
})

// 协同服务连接配置
const collaborationConfig = computed(() => ({
  documentId: 'doc_10024',
  url: 'ws://your-collab-server.com/collaboration',
  token: 'user_access_token',
  user: {
    id: 'user_01',
    username: 'alex',
    nickname: 'Alex',
    avatar: 'https://avatar-url.png',
  },
}))
</script>

<template>
  <div style="height: 100vh;">
    <!-- 
      查看态（isEditing 为 false）时：不连接协同，快速纯静态展示
      编辑态（isEditing 为 true）时：自动接入 socket 协同同步
    -->
    <KnowledgeEditor
      v-model:title="docTitle"
      :json="!isEditing ? previewJson : undefined"
      :editable="isEditing"
      :menubar="isEditing"
      :collaboration-config="isEditing ? collaborationConfig : undefined"
      @update:collaborators="(users) => console.log('当前在线协作者:', users)"
    />
  </div>
</template>
```

---

## CollaborationConfig 字段说明

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| **`documentId`** | `string` | 当前协同文档的唯一标识 ID |
| **`url`** | `string` | 协同服务的 WebSocket 地址（如 `wss://your-domain.com/collab`） |
| **`token`** | `string` | 用户鉴权 Token |
| **`user`** | `CollaborationUser` | 当前用户的协同信息，包含 `id`, `name`/`nickname`, `avatar` 等，用于多人光标显示 |

---

## 生产级后端与协同服务参考

多人实时协同需要服务端的 WebSocket 协同集群与数据库状态落盘支持。

如果你需要了解完整的生产级实现（包括 **WebSocket 协同服务、MinIO 对象存储接入、OnlyOffice 在线文档预览引擎** 等），请参考我们的全栈开源知识库项目：

* 🚀 **开源知识库系统**：[speed-knowledge-client](https://github.com/whateveryoudo/speed-knowledge-client)
* 🌐 **生产环境在线体验**：[SpeedDoc (speeddoc.cn)](http://speeddoc.cn/)
