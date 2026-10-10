# 预设配置

Speed Tiptap Editor 通过 **预设（preset）** 提供开箱即用的编辑器形态。预设决定扩展集、默认工具栏、气泡菜单和若干功能开关；外界仍可通过 props 覆盖其中一部分。

## 内置预设

| 预设 | 说明 |
|------|------|
| `lite` | 简易富文本，适合评论、表单说明等日常场景 |
| `knowledge` | 完整知识库富文本，含标题、拖拽句柄、导入导出等 |

### lite

- 扩展集较轻量（不含脑图、流程图、格式刷、查找替换、标签等）
- 默认工具栏较精简
- 气泡菜单：`text`、`image`、`attachment`、`table`、`callout`
- 内容通过 `v-model:content` 同步

### knowledge

- 完整扩展集（含标题节点、文档检测等）
- 知识库风格工具栏（含插入菜单、导入导出、查找替换等）
- 气泡菜单全开（含拖拽句柄）
- 协同场景下内容以 Yjs 为准，使用 `json` 做只读初始化

## 基础用法

```vue
<template>
  <!-- 简易富文本（默认即为 lite） -->
  <SpeedTiptapEditor v-model:content="content" />

  <!-- 显式指定 lite -->
  <SpeedTiptapEditor preset="lite" v-model:content="content" />

  <!-- 知识库完整富文本 -->
  <SpeedTiptapEditor
    preset="knowledge"
    v-model:title="title"
    :json="contentJson"
  />
</template>
```

## 外界覆盖默认配置

预设提供默认值，以下 props 可覆盖：

```vue
<SpeedTiptapEditor
  preset="knowledge"
  :exclude-keys="['import', 'export']"
  :toolbar-keys="customToolbar"
  :bubble-menus="['text', 'image', 'table']"
  :insert-menu-config="{ excludeKeys: ['mind', 'flowMap'] }"
/>
```

| prop | 作用 |
|------|------|
| `toolbarKeys` | 全量覆盖预设工具栏 |
| `excludeKeys` | 在预设工具栏基础上去除部分按键 |
| `bubbleMenus` | 覆盖预设气泡菜单白名单 |
| `insertMenuConfig` | 合并/排除插入菜单项 |
| `textBubbleMenu` | 控制文本选区气泡菜单 |

## 预设与协同的关系

协同不是第三种预设，而是可组合能力。请配合 [`useCollaboration`](/config/collaboration/) 在业务侧创建 `ydoc` / `provider`，再传入编辑器：

```vue
<script setup>
import { SpeedTiptapEditor, useCollaboration } from 'speed-editor'

const { ydoc, provider } = useCollaboration({ config, enabled })
</script>

<template>
  <SpeedTiptapEditor
    v-if="ydoc"
    preset="knowledge"
    :ydoc="ydoc"
    :provider="provider"
    :collaboration-user="config.user"
  />
</template>
```

协同模式下请勿使用 `v-model:content` 双向同步，内容以 Yjs 为准。
