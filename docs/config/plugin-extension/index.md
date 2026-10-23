# 自定义扩展插件

Speed Editor 提供了完整的插件化扩展机制。你可以利用插件向编辑器中注入 **自定义 Tiptap 扩展节点**、**工具栏按钮**、**快捷插入菜单项** 以及 **浮动气泡组件**。

---

## ⚠️ 核心规范：单实例导入与版本防坑

在富文本开发中，最常见的深坑是**“多实例导致 `instanceof` 判断失效或扩展静默丢失”**。如果自定义插件自己去 `import { Node } from '@tiptap/core'`，宿主依赖树里可能出现两份物理路径不同的 Tiptap，导致扩展注册异常。

为了确保**全局单实例（Singleton）**，Speed Editor 已经将底层核心全部统一 re-export 导出：

### 1. 推荐的插件 Import 方式

```ts
// ✅ 强烈推荐：直接从编辑器包导入，保证单实例与运行时完全一致
import {
  Node,
  Mark,
  Extension,
  mergeAttributes,
  type ExtensionConfig,
  type NodeConfig,
  type MarkConfig,
} from '@speed-editor/knowledge-editor' // 或 @speed-editor/base-editor

// ✅ 节点 Schema 推荐直接复用官方封装好的规范定义（避免手写复杂 schema）
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
  Image,
  Callout,
  Attachment,
  Tag,
  CodeBlock,
  Mind,
  Title,
  Link,
  FontSize,
  FontFamily,
} from '@speed-editor/schema'
```

---

### 2. 宿主工程锁死 Peer 版本（避免多版本冲突）

::: tip 兼容 Tiptap 官方生态与官方扩展封装
Speed Editor 底层完全基于 **Tiptap 官方规范与生态体系进行深度封装**。这意味着：
- 你完全可以按照 **Tiptap 官方文档** 的标准规范去编写自定义 Extension、Node 与 Mark；
- 你也可以直接在项目中安装并引入任何 **Tiptap 官方或社区已有的扩展**（例如 `@tiptap/extension-color`、`@tiptap/extension-highlight` 等）并挂载到 Speed Editor 中。
:::

但正因为你会直接引入 Tiptap 官方或社区的各种扩展包，这些第三方包内部声明的 `@tiptap/core` 或 `prosemirror-*` 依赖版本可能略有差异。为了避免包管理器（pnpm/npm/yarn）在 node_modules 中安装出多套物理路径不同的 Tiptap 运行时（导致单例失效与 `instanceof` 冲突），**强烈建议在宿主项目的 `package.json` 中配置 Overrides**，将核心依赖强制锁死为统一单例版本：

#### pnpm 用户（推荐）
在宿主根目录 `package.json` 中配置：
```json
{
  "pnpm": {
    "overrides": {
      "yjs": "13.6.31",
      "y-protocols": "1.0.7",
      "@tiptap/core": "^3.13.0",
      "@tiptap/pm": "^3.13.0",
      "@tiptap/vue-3": "3.6.6"
    }
  }
}
```

#### npm 用户
```json
{
  "overrides": {
    "yjs": "13.6.31",
    "@tiptap/core": "^3.13.0",
    "@tiptap/pm": "^3.13.0"
  }
}
```

#### yarn 用户
```json
{
  "resolutions": {
    "yjs": "13.6.31",
    "@tiptap/core": "^3.13.0",
    "@tiptap/pm": "^3.13.0"
  }
}
```

---

## 插件契约结构 (`SpeedEditorPlugin`)

一个标准的 Speed Editor 插件遵循以下结构定义：

```ts
import type { Component } from 'vue'
import type { TiptapExtension } from '@speed-editor/shared'

export interface SpeedEditorPlugin {
  /** 插件唯一命名 */
  name: string
  /** 扩展集：可传 Tiptap 扩展数组或返回扩展的函数 */
  extensions: TiptapExtension[] | ((ctx: Record<string, unknown>) => TiptapExtension[])
  /** 自定义工具栏组件：key 对应 toolbarKeys 里的名称，值为 Vue 组件 */
  toolbar?: Record<string, Component>
  /** 自定义气泡菜单组件 */
  bubbleMenus?: Partial<Record<'text' | 'image' | 'table' | 'tag' | 'callout', Component[]>>
  /** 自定义“插入(+)”菜单项 */
  insertItems?: Array<{
    key: string
    label: string
    component?: Component
    order?: number
  }>
}
```

---

## 实战示例：开发并挂载一个自定义插件

### 1. 定义你的插件 (`myCustomPlugin.ts`)

```ts
// ✅ 直接从编辑器包导入 Extension，保证单实例
import { Extension } from '@speed-editor/knowledge-editor'
import type { SpeedEditorPlugin } from '@speed-editor/knowledge-editor'
import MyToolbarButton from './MyToolbarButton.vue'

// 1. 定义底层行为或注册快捷键
const MyExtension = Extension.create({
  name: 'myExtension',
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-m': () => {
        console.log('触发了自定义快捷键!')
        return true
      },
    }
  },
})

// 2. 导出标准 SpeedEditorPlugin 插件对象
export const MyCustomPlugin: SpeedEditorPlugin = {
  name: 'my-custom-feature',
  extensions: [MyExtension],
  toolbar: {
    'my-action': MyToolbarButton, // 注册工具栏按钮组件
  },
  insertItems: [
    {
      key: 'my-insert-item',
      label: '自定义卡片',
      order: 10,
    },
  ],
}
```

---

### 2. 在组件中挂载使用

在 `KnowledgeEditor` 中，通过 **`:extra-plugins`** 即可无缝挂载你的自定义插件：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { KnowledgeEditor } from '@speed-editor/knowledge-editor'
import { MyCustomPlugin } from './myCustomPlugin'

const isEditing = ref(true)
const docJson = ref({ type: 'doc', content: [] })

// 将自定义工具栏 key 加入到工具栏中
const customToolbar = [
  'undo', 'redo', '|',
  'bold', 'italic', '|',
  'my-action', // 👈 对应你插件里注册的 toolbar key
]
</script>

<template>
  <KnowledgeEditor
    :editable="isEditing"
    :json="docJson"
    :extra-plugins="[MyCustomPlugin]"
    :toolbar-keys="customToolbar"
  />
</template>
```

如果是使用底层的 **`SpeedEditor`** 通用壳，直接传 **`:plugins="[MyCustomPlugin]"`** 即可生效。
