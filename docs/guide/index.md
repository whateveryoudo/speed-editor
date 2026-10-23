# 介绍

**Speed Editor** 是一个基于 **Vue 3 + Ant Design Vue + Tiptap** 深度封装与打磨的现代化富文本编辑器套件。

不仅能满足常见的轻量富文本编辑需求，还能直接用于构建类似语雀、Notion 等企业级协作知识库系统。

---

## 核心特性

- 🚀 **四类可用组件**：底层一套核心底座，上层提供 `LiteEditor`（轻量）与 `KnowledgeEditor`（文档）等两套开箱即用预设，无需繁琐拼装配置。
- 📦 **按需引入与极致体积**：通过 Monorepo 多包拆分，轻量场景不携带 Yjs、导图或重型依赖，首屏加载更迅速。
- 🤝 **企业级多人实时协同**：深度集成 Yjs 与 Collaborative 协同底座，支持多人并发编辑与光标同步。
- 🎨 **Ant Design 风格原生融入**：工具栏、弹窗、气泡菜单等均基于现代 Ant Design Vue 规范定制，交互统一、开箱即美观。
- 🔄 **前后端 Schema 统一**：提取独立的 `@speed-editor/schema`，可在 Node.js / NestJS 服务端无缝复用一致的文档模型验证。
- 🌐 **实战落地支撑**：已作为核心能力落地于开源知识库系统 [Speed Knowledge Client](http://speeddoc.cn/)，并与表格组件 [Speed Sheet](https://github.com/whateveryoudo/speed-sheet) 等构成完整协同套件。

---

## 环境要求

- **Node.js** >= 18.0.0
- **Vue** >= 3.4.0
- **Ant Design Vue** >= 4.0.0

---

## 许可证

本项目基于 [MIT](https://github.com/whateveryoudo/speed-editor/blob/main/LICENSE) 开源协议，欢迎自由商用与贡献！
