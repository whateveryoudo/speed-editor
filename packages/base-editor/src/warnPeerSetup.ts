/** 开发期提示：peer speed-components-ui 未装好 / 未注入 antd CSS 变量 */
export function warnSpeedComponentsPeerSetup(): void {
  const isDev =
    (typeof import.meta !== 'undefined' &&
      Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV)) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')

  if (!isDev || typeof document === 'undefined') return

  // ensureSpeedComponents / useAntdCssVars 多为同步写入，微任务后再读，避免误报
  queueMicrotask(() => {
    const root = document.documentElement
    const border = getComputedStyle(root).getPropertyValue('--ant-color-border').trim()
    const bg = getComputedStyle(root).getPropertyValue('--ant-color-bg-base').trim()
    const hasAntdVarsStyle = Boolean(document.getElementById('antd-css-vars'))

    if (border && bg && hasAntdVarsStyle) return

    console.warn(
      [
        '[speed-editor] speed-components-ui 未就绪（缺少 --ant-* / #antd-css-vars）。',
        '正常应由 @speed-editor/* 传递安装；请确认已 app.use(lite/knowledge-editor/plugin)，',
        "并引入 '@speed-editor/lite-editor/style.css'（或 knowledge 对应 style）。",
        '本地联调可把 speed-components 源码 alias 到宿主 vite。',
      ].join('\n'),
    )
  })
}
