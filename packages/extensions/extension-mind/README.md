# @speed-editor/extension-mind

思维导图扩展包（**占位 / 接入示例**，尚未绑定具体第三方库）。

## 现状

- `createMindPlugin()` 默认返回**空壳** plugin（无扩展、无菜单）
- `extension-kit` 的 `getKnowledgeKit` 已**默认排除** legacy `mind` 节点，避免半成品进编辑器
- 启用方式：`<KnowledgeEditor :mind="true" />` 目前仅合并空壳 plugin，**不会出现插入入口**

## 接入步骤（选型后）

```
1. 调研库 → 2. 实现 MindEditorAdapter → 3. 传入 adapter → 4. NodeView 挂载
```

### 1. 候选库（自行评估）

| 库 | 特点 |
|---|---|
| [simple-mind-map](https://github.com/wanglin2/mind-map) | 功能全、Vue/React 示例多，体积较大 |
| [jsMind](https://github.com/hizzgdev/jsmind) | 轻量、纯 JS，样式偏传统 |
| [markmap](https://github.com/markmap/markmap) | Markdown 大纲转脑图，场景不同 |

### 2. 实现适配器

见 `src/example.adapter.ts`：

```ts
import type { MindEditorAdapter } from '@speed-editor/extension-mind'

export const myMindAdapter: MindEditorAdapter = {
  id: 'simple-mind-map',
  createExtensions(ctx) {
    return [MindNode.configure({ /* 库实例、上传配置等 */ })]
  },
  insertMind(editor) {
    editor.chain().focus().setMind({ data: defaultData }).run()
  },
}
```

### 3. 在 KnowledgeEditor 启用

```ts
// createKnowledgeEditorPlugins.ts（未来）
createMindPlugin({ adapter: myMindAdapter })
```

```vue
<KnowledgeEditor :mind="true" />
```

### 4. NodeView 职责

- 在 `Wrapper.vue` 的 `onMounted` 里 `new MindMap(container, options)`
- `update` / `destroy` 时同步 attrs.data 与销毁实例
- 协同场景：attrs.data 走 Yjs JSON，需定义可序列化 schema

## 与 extension-flow 的关系

流程图包 `@speed-editor/extension-flow` 采用相同模式，可复用 `MindEditorAdapter` 思路定义 `FlowEditorAdapter`。
