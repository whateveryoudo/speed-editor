# 快速开始

本节将介绍如何在项目中使用 Speed Tiptap Editor。

## 安装

使用 npm 、 pnpm 或 yarn 安装：

```bash
# npm
npm install speed-editor

# pnpm

pnpm add speed-editor

# yarn
yarn add speed-editor
```

## 在 main.ts 中引入组件库(非必须)：

::: warning 初始化全局配置（app.use的第二个参数）
**iconfontUrl** - iconfont在线地址，实际使用替换为自己的;<br>
**transformRequestRes** - 通用响应结果转换方法（用于将后端结构转换为`'ResponseType'`形式，此方法会在上传中用到）
**registerGlobal** - 是否注册为全局组件，默认为true(如果按需，需设置为false)<br>
**apis** - 请求方法配置，部分组件会携带一些请求（常为api中导出的请求方法，图片/附件扩展需要，大多数场景你只需要配置api请求即可，可在自身api下面创建相关ajax请求（注：请按照`'ResponseType'`返回形式））
 - fileUploadSingle 上传附件(单)通用方法,默认key为`file`
 - fileUploadMulti 上传附件(多)通用方法,默认key为`files[]`
 - fileDel 删除附件通用方法
 - fileDownload 下载附件通用方法
:::

### ResponseType

``` ts
// 统一配置请求返回数据类型
export type ResponseType<T = any> = {
  code: number;
  message: string;
  success: boolean;
  data: T;
  [key: string]: any;
};
```

### 完整的main.ts示例

```ts
import { createApp } from "vue";
import SpeedTiptapEditor from "speed-editor";
import "speed-editor/dist/style.css";
import App from "./App.vue";
// 范例请求，需替换为实际请求
import { fileUploadSingle, fileUploadMulti, fileDel, fileDownload } from "@/api/attachment";

const app = createApp(App);
const globalConfig = {
  iconfontUrl: "//at.alicdn.com/t/c/font_3871804_pab634p3if.js", // 替换为你的iconfont地址
  registerGlobal: true, // false 需要你在使用的地方手动import组件
  apis: {
    fileUploadSingle: fileUploadSingle,
    fileUploadMulti: fileUploadMulti,
    fileDel: fileDel,
    fileDownload: fileDownload,
  },
};
app.use(SpeedTiptapEditor, globalConfig);
app.mount("#app");
```
### api下attachment.ts示例
这里后端是返回了`ResponseType`结构，如果你的后端返回结构不同，请使用`transformRequestRes`进行转换
``` ts
import request from "../request";
import { attachmentPrefix } from "../path";
export const fileDownload = (fileId: string) => {
  return request.get(`${attachmentPrefix}/download/${fileId}`, {
    responseType: "blob",
    headers: {
      fullRes: true,
    },
  });
};

export const fileUploadSingle = (formData: FormData) => {
  return request.post(`${attachmentPrefix}/upload/single`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
export const fileUploadMulti = (formData: FormData) => {
  return request.post(`${attachmentPrefix}/upload/multi`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

export const fileDel = (fileId: string) => {
  return request.delete(`${attachmentPrefix}/delete/${fileId}`);
};

```

## 按需引入(需手动关闭registerGlobal)

使用 Vite 的项目，推荐使用 `unplugin-vue-components` 进行按需引入：

1. 安装插件：

```bash
npm install unplugin-vue-components -D
```

2. 在 vite.config.ts 中配置：

```ts
import { defineConfig } from "vite";
import Components from "unplugin-vue-components/vite";
import { SpeedComponentsResolver } from "speed-components/resolver";

export default defineConfig({
  plugins: [
    Components({
      resolvers: [SpeedComponentsResolver()],
    }),
  ],
});
```

3. 在组件中直接使用：

```vue
<template>
  <!-- 默认 preset="lite" 简易富文本 -->
  <speed-editor v-model:content="content" />

  <!-- 知识库完整富文本 -->
  <speed-editor preset="knowledge" v-model:title="title" :json="contentJson" />
</template>
```

## 预设与协同

- 预设说明见 [预设配置](/config/preset/)
- 协同编辑需配合 `useCollaboration` hook，见 [协同编辑](/config/collaboration/)

## 注意事项

1. 按需引入时，不需要手动引入样式
2. 完整引入时，需要手动引入样式文件
3. 建议使用 TypeScript 以获得更好的开发体验
