# Speed Tiptap Editor

基于 Vue 3 + Ant Design Vue + Tiptap 的富文本编辑器（Monorepo v2）

> **v2 重构说明**：本次 monorepo 迁移由 **vibecoding** 协助完成。

## 版本与分支

| 分支 / 包 | 说明 |
|-----------|------|
| **`main`** | Monorepo v2，npm scope：`@speed-editor/*` |
| **`legacy/v1`** | 旧版单体代码，npm 包 `speed-editor@1.x` |

仍在使用单体版的项目，请切换到 **`legacy/v1`** 分支维护，或继续使用 npm 上的 `speed-editor@1.x`。

---

## 为什么要重构？

v1 将所有能力打成一个包（`speed-editor`），随着功能增加，暴露出几个问题：

### 1. 扩展越来越多，单体难以维护

思维导图、流程图、协同、导入导出、AI 等能力不断叠加，全部堆在 `src/` 里会导致：

- 模块边界模糊，改一处容易牵动全局
- 新扩展难以独立演进、独立发版
- 工具栏 / 气泡菜单 / 扩展节点无法按插件拆分

v2 按职责拆成 `extension-kit`、`kit-base`、`extension-mind`、`extension-flow` 等包，**扩展即插件**，后续加能力只需新增或扩展对应子包。

### 2. 多 Editor 场景需要按需引入

业务上存在多种编辑器形态，依赖和 UI 差异很大：

| 包 | 场景 | 特点 |
|----|------|------|
| `@speed-editor/lite-editor` | 首页 / 轻量编辑 | 精简工具栏，无协同 |
| `@speed-editor/knowledge-editor` | 知识库文档 | 完整能力 + 协同 |
| `@speed-editor/base-editor` | 完全自定义 | 只提供 `SpeedEditor` 壳 |
| `@speed-editor/collaboration-editor` | 协同壳 | Yjs + Provider 集成 |

v1 无论用哪种场景，都要引入整包；v2 宿主 **只装用到的 Editor 预设**，依赖链随包传递，避免「为了一个 Lite 页面背上 mammoth / yjs / 协同」。

### 3. 包体积与 Tree-shaking

单体构建时，即使用户只用基础排版，打包结果仍容易带上：

- 协同（`yjs`、`@hocuspocus/provider`）
- 文档 IO（`mammoth`、`html-to-docx` 等）
- 可选扩展（mind、flow…）

拆包后由 bundler 按 import 路径裁剪，**Lite 场景体积显著下降**；重型能力仅在 `knowledge-editor` 或显式依赖对应 extension 时进入产物。

### 4. 其他收益

- **前后端 schema 一致**：`@speed-editor/schema` 可单独给 NestJS 等后端复用
- **独立发版**：Changesets 管理多包版本，修 `kit-base` 不必整库 bump
- **Peer 单例清晰**：`@tiptap/core`、`@tiptap/pm`、`yjs` 由宿主安装，避免 monorepo 多实例问题

更细的架构说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

---

## 快速开始

### 安装（按需选择预设）

```bash
# 知识库完整编辑器（含协同能力链）
pnpm add @speed-editor/knowledge-editor

# 或轻量首页编辑器
pnpm add @speed-editor/lite-editor
```

宿主还需安装 Tiptap / 协同相关 **peer**（避免多实例）：

```bash
pnpm add @tiptap/core @tiptap/pm @tiptap/vue-3 @tiptap/y-tiptap yjs
```

### 使用示例

```vue
<script setup lang="ts">
import { KnowledgeEditor } from '@speed-editor/knowledge-editor'
import '@speed-editor/base-editor/style.css'
</script>

<template>
  <KnowledgeEditor v-model="content" :editable="true" />
</template>
```

### Monorepo 本地开发

```bash
pnpm install
pnpm build          # 构建所有 packages
pnpm demo           # 启动 vue3-demo
pnpm docs:dev       # 文档站
```

---

## 包一览

```
@speed-editor/
├── shared, composables, schema, ui     # 基础层
├── extension-kit, kit-base             # 扩展与工具栏
├── extension-mind, extension-flow      # 可选扩展
├── extension-import-export, document-io
├── base-editor                         # SpeedEditor 壳
├── collaboration-editor                # 协同壳
├── lite-editor                         # Lite 预设
└── knowledge-editor                    # Knowledge 预设
```

---

## 文档与示例

- [在线文档](https://whateveryoudo.github.io/speed-editor/docs/)
- [在线 Demo](https://whateveryoudo.github.io/speed-editor/demo/)
- [发版与贡献指南](./CONTRIBUTING.md)

---

## npm 发版（v2）

使用 [Changesets](https://github.com/changesets/changesets) 管理多包发版：

1. 改动后运行 `pnpm changeset`
2. 合并到 `main` → CI 创建 **Version Packages** PR
3. 合并 Version PR → 自动 `pnpm build` 并发布到 `@speed-editor/*`

工作流：`.github/workflows/release-npm.yml`  
需在仓库 Secrets 配置 `NPM_TOKEN`。详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 功能清单

### 已支持

#### 基础文本编辑
- 撤销/重做、格式刷、格式清除
- 字体大小、字体颜色、背景色、上标/下标、对齐

#### 文本样式
- 标题（H1–H6）、加粗、斜体、下划线、删除线

#### 列表与结构
- 有序/无序/任务列表、缩进、引用块、分隔线

#### 富媒体与扩展
- 图片、附件、表格、代码块（语法高亮）
- 高亮块（Callout）、表情、标签

#### 高级能力
- 查找与替换、AI 写作助手
- 实时协同编辑（`knowledge-editor` + `collaboration-editor`）
- 导入导出（Word / Markdown 等，见 `document-io`）

### 规划中

- 主题切换（亮/暗）
- 多语言
- 快捷键自定义
- 数学公式
- 更多图表类扩展

### 相关生态

- [speed-knowledge-client](https://github.com/whateveryoudo/speed-knowledge-client) — 语雀类知识库平台（持续更新）

---

## License

MIT
