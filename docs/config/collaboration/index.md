# 协同编辑

协同能力已从编辑器组件内部剥离，由 `useCollaboration` hook 在业务侧管理。编辑器只接收外部传入的 `ydoc` 和 `provider`。

## 为什么这样设计

- 业务侧可控制协同连接生命周期（如等待 `onSynced` 后再渲染编辑器）
- 避免 `v-model:content` 与 Yjs CRDT 冲突
- 与表格等其他协同编辑器保持一致的接入方式

## 安装依赖

协同依赖 `yjs` 和 `@hocuspocus/provider`，使用协同时请确保项目中已安装：

```bash
pnpm add yjs @hocuspocus/provider
```

## 基础用法

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { SpeedTiptapEditor, useCollaboration } from 'speed-editor'

const collaborationConfig = computed(() => ({
  documentId: 'doc-001',
  url: 'ws://localhost:3005/collaboration',
  token: 'your-token',
  user: {
    id: '1',
    username: 'ykx',
    nickname: 'YKX',
    avatar: '',
  },
}))

const { ydoc, provider } = useCollaboration({
  config: collaborationConfig,
  enabled: true,
  onCollaboratorsChange: (users) => {
    console.log('在线协作者', users)
  },
})

const ready = computed(() => !!ydoc.value)
</script>

<template>
  <SpeedTiptapEditor
    v-if="ready"
    preset="knowledge"
    :ydoc="ydoc!"
    :provider="provider!"
    :collaboration-user="collaborationConfig.user"
    :json="initialContentJson"
  />
</template>
```

::: warning 注意
请等待 `ydoc` 就绪（`onSynced` 之后）再渲染编辑器，避免用空文档初始化导致结构缺失。
:::

## useCollaboration API

### 参数

```ts
interface UseCollaborationOptions {
  /** 协同配置，传 null 时不连接 */
  config: MaybeRef<CollaborationConfig | null | undefined>
  /** 是否启用，默认 true */
  enabled?: MaybeRef<boolean>
  /** 协作者列表变化回调 */
  onCollaboratorsChange?: (users: CollaborationUser[]) => void
}

interface CollaborationConfig {
  documentId: string
  url: string
  token: string
  user: CollaborationUser
}
```

### 返回值

| 字段 | 说明 |
|------|------|
| `ydoc` | 同步完成后的 Y.Doc，传给编辑器 |
| `provider` | HocuspocusProvider 实例，传给编辑器 |
| `caretUser` | 光标用户信息 |
| `isCollaborationActive` | 是否已进入协同态 |
| `collaborationExtensions` | 协同 Tiptap 扩展（一般无需手动使用） |
| `destroy` | 手动销毁连接 |

## 编辑器协同相关 Props

| prop | 类型 | 说明 |
|------|------|------|
| `ydoc` | `Y.Doc` | 外部协同文档 |
| `provider` | `HocuspocusProvider` | 外部协同 Provider |
| `collaborationUser` | `CollaborationUser` | 协同光标展示的用户信息 |
| `json` | `string \| object` | 非协同模式下的 JSON 初始化；协同模式下由 Yjs 管理内容 |

## 内容同步规则

| 模式 | 内容来源 | 是否 emit `update:content` |
|------|----------|---------------------------|
| 普通（无 ydoc） | `v-model:content` / `json` | 是 |
| 协同（有 ydoc） | Yjs 实时同步 | 否 |

协同模式下请勿绑定 `v-model:content`，否则会和 CRDT 产生冲突。

## 知识库平台接入示例

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { SpeedTiptapEditor, useCollaboration } from 'speed-editor'

const collaborationConfig = computed(() => ({
  documentId: documentId.value,
  url: `${import.meta.env.VITE_APP_COLLABORATE_URL}/collaboration?knowledgeId=${knowledgeId.value}`,
  token: localStorage.getItem('access_token')!,
  user: currentUser.value,
}))

const { ydoc, provider } = useCollaboration({
  config: collaborationConfig,
  enabled: computed(() => isEditMode.value),
  onCollaboratorsChange: (users) => emit('update:collaborators', users),
})
</script>

<template>
  <SpeedTiptapEditor
    v-if="isEditMode ? ydoc : true"
    preset="knowledge"
    :editable="isEditMode"
    :ydoc="isEditMode ? ydoc : undefined"
    :provider="isEditMode ? provider : undefined"
    :collaboration-user="collaborationConfig.user"
    :json="!isEditMode ? previewJson : undefined"
  />
</template>
```

## 后端服务

协同需要配合 WebSocket 服务，可参考 [speed-apis](https://github.com/whateveryoudo/speed-apis) 启动示例后端。
