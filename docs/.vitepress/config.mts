import { defineConfig } from "vitepress";
import UnoCSS from "unocss/vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";

// 环境变量配置
const VITE_APP_BASE_URL = process.env.VITE_APP_BASE_URL || "/api";
const VITE_APP_BASE_PROXY_URL =
  process.env.VITE_APP_BASE_PROXY_URL || "http://localhost:4000";

// 根据环境判断 base 路径
const base =
  process.env.NODE_ENV === "production" ? "/speed-editor/docs/" : "/";

export default defineConfig({
  title: "Speed Editor",
  description: "基于 Ant Design Vue + Tiptap 的现代化富文本套件",
  base,
  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/" },
      { text: "配置", link: "/config/toolbar/" },
      { text: "示例", link: "https://whateveryoudo.github.io/speed-editor/demo/" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "指南",
          items: [
            { text: "介绍", link: "/guide/" },
            { text: "快速开始", link: "/guide/quickstart" },
          ],
        },
      ],
      "/config/": [
        {
          text: "基础",
          items: [
            { text: "预设", link: "/config/preset/" },
            { text: "协同编辑", link: "/config/collaboration/" },
            { text: "工具栏", link: "/config/toolbar/" },
            { text: "图片上传", link: "/config/image/" },
            { text: "文件上传", link: "/config/file/" },
            { text: "字体大小", link: "/config/font-size/" },
            { text: "文本气泡菜单", link: "/config/bubble-text/" },
            { text: "自定义扩展插件", link: "/config/plugin-extension/" },
          ],
        },
        {
          text: 'AI相关',
          items: [
            { text: "基础", link: "/config/ai/" },
          ],
        }
      ],
      "/demos/": [
        {
          text: "示例",
          items: [{ text: "基础", link: "/demos/simple/" }],
        },
      ],
    },
  },
  vite: {
    optimizeDeps: {
      include: ["ant-design-vue/es/locale/zh_CN", "@ant-design/icons-vue"],
    },
    ssr: {
      noExternal: ["ant-design-vue", "@ant-design/icons-vue"],
    },
    server: {
      port: 5174,
      proxy: {
        [VITE_APP_BASE_URL]: {
          target: VITE_APP_BASE_PROXY_URL,
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(new RegExp(`^${VITE_APP_BASE_URL}`), ""),
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              proxyReq.setHeader("Connection", "keep-alive");
            });
          },
          timeout: 30000,
        },
      },
    },
    plugins: [
      UnoCSS(),
      vueJsx(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false,
            resolveIcons: true,
          }),
        ],
      }),
    ],
  },
});
