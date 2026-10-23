# 文本气泡菜单配置

选中文本后出现的快捷操作条。可使用默认项，或通过 `textBubbleMenu` 自定义项目。

## 开启/关闭
```vue
<template>
  <SpeedTiptapEditor :textBubbleMenu="{ enabled: true }" />
</template>
```
默认：`enabled: true`（见 `src/editor.vue` 默认 props）

## 默认项
`['bold','italic','underline','strike','fontFamily','fontSize','textColor','backgroundColor']`

## 自定义 items
```vue
<template>
  <SpeedTiptapEditor :textBubbleMenu="textBubbleMenu" />
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core'

const textBubbleMenu = {
  enabled: true,
  items: [
    'bold',
    'italic',
    'fontSize',
    {
      icon: 'icon-custom-format',
      title: '标题为 H2',
      action: (editor: Editor) => {
        editor.chain().focus().toggleHeading({ level: 2 }).run()
      }
    },
  ]
}
</script>
```
- 字符串项：自动映射内置菜单组件
- 对象项：需提供 `icon`、`title`、`action(editor)`

## 显示条件（shouldShow，简要）
- 可编辑
- 有选区（非空 selection）
- 非表格单元格整体选择
- 不处于以下节点：`Title`、`Callout`、`CodeBlock`、`Link`、`Tag`、`Attachment`、`Image`

## 与字体大小联动
当 items 包含 `fontSize` 时，字号选择器会读取 `props.fontSize`（`default`、`options`），详见“字体大小配置”。
