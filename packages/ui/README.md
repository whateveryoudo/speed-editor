# @speed-editor/ui

编辑器 **UI 壳 + 共享控件**。业务 toolbar/bubble 按钮跟 **plugin** 走，不平铺进 ui。

## 本包内容

| 模块 | 说明 |
|------|------|
| `MenuBarShell` | 读 `toolbarKeys` + `buttons` registry 渲染顶栏 |
| `BubbleMenuBarShell` | 读 `bubbleMenus` + registry 渲染气泡 |
| `InsertMenuShell` | 聚合各 plugin 的 `insertItems` |
| （待迁）ColorPicker、EmojiPicker、dragHandle… | 多插件共用 |

## 不在本包（随 plugin 迁）

| 原 `src/` | 目标 |
|-----------|------|
| `menus/bold.vue` 等 | `kit-base` → `plugin.toolbar.bold` |
| `menus/import/` | `extension-import-export` |
| `bubbleMenus/textMenu/` | `kit-base` → `plugin.bubbleMenus.text` |

## 数据流

```
SpeedEditorPlugin[]  ──mergePluginRegistries()──►  buttons / menus / insertItems
preset.toolbarKeys   ──────────────────────────►  MenuBarShell 布局顺序
```

## 依赖

```
shared / composables → ui → base-editor
```

`ui` 不依赖任何 `-editor` 包。

## 迁移阶段

1. ✅ 壳组件 + `shared/plugin-registry.ts`
2. ⏳ 从 `src/menus/*` 按 plugin 拆入 kit-base / extension-*
3. ⏳ base-editor 用壳替换 `@st/menus/index.tsx` 静态 map
