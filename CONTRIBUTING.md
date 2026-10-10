# 提交规范与发版

本仓库使用 [Changesets](https://github.com/changesets/changesets) 管理 monorepo 多包发版。

## 提交格式

```text
<type>(<scope>): <subject>
```

示例：

```text
fix(knowledge-editor): 修复协同光标未显示
feat(lite-editor): 支持只读预览模式
docs(readme): 更新安装说明
```

## 发版流程

1. 改动需要发布的子包后，运行 `pnpm changeset` 选择包与 bump 类型
2. PR 合并到 `main` 后，GitHub Actions `Release NPM` 会创建 **Version Packages** PR
3. 合并 Version PR 后自动 `pnpm build` 并 `changeset publish` 到 npm

也可在 Actions 页面手动触发 `workflow_dispatch`。

## 本地命令

```bash
pnpm changeset:check   # 查看自上次 tag 以来哪些包有变更
pnpm changeset         # 添加 changeset
pnpm version-packages  # 本地 bump 版本（一般由 CI 执行）
pnpm release           # build + publish（一般由 CI 执行）
```

## Secrets

在 GitHub 仓库 Settings → Secrets → Actions 配置：

| Secret | 说明 |
|--------|------|
| `NPM_TOKEN` | npm Automation token，需有 `@speed-editor` scope 发布权限 |

## 单体版（v1）

旧版单体代码在 `legacy/v1` 分支维护；`main` 为 monorepo v2（`@speed-editor/*`）。

发版前请确保 `pnpm build` 通过。
