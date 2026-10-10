/** CSS 子路径入口（→ dist/style.css / 本地 alias）
 * ui 的 scoped 样式在 src 联调时随组件 import 注入；
 * 发版时仍通过 ui/style.css 打进本包 style 产物。
 * speed-components-ui 为本包 dependencies：样式随 style 入口带出，plugin 内 ensure 全局组件 / antd 变量。
 */
import 'speed-components-ui/dist/style.css'
import '@speed-editor/ui/style.css'
import './assets/index.less'
import 'uno.css'
