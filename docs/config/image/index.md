# 上传配置与架构（Image & File Upload）

Speed Tiptap Editor 采用**分层级联合并（Cascading Configuration）**与**统一管道抽象**的设计，外部既支持通过全局注入默认 API，也支持在组件 Props 层面传入通用上传或类型专属配置。

---

## 一、配置优先级与层级

所有上传相关配置（包括 `accept`、`maxSize`、`uploadApis`、`action`、`headers`、`data`、`beforeUpload` 等）按照以下优先级从高到低自动深度合并：

$$\begin{aligned}
\text{Props 专属配置 } (props.image / props.file) &\longrightarrow \text{Props 通用上传 } (props.upload) \\
&\longrightarrow \text{Editor 全局专属 } (global.image / global.file) \\
&\longrightarrow \text{Editor 全局上传 } (global.upload) \\
&\longrightarrow \text{Editor 全局通用 APIs } (global.apis)
\end{aligned}$$

- **通用场景**：在 `app.use` 或 `props.upload` 中配置一次通用接口，所有扩展（图片、附件等）自动继承。
- **细分场景**：若图片与附件的格式、大小或上传接口不同，可通过 `props.image` 或 `props.file` 覆盖对应字段。

---

## 二、配置方式示例

### 1. 全局配置（`app.use`）

在应用入口处注册全局默认上传接口：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import SpeedTiptapEditor from '@speed-editor/base-editor/plugin'
import {
  fileDownload,
  fileUploadSingle,
  fileUploadMulti,
  fileDel,
} from '@/api/attachment'

const app = createApp(App)

app.use(SpeedTiptapEditor, {
  apis: {
    fileDownload,
    fileUploadSingle,
    fileUploadMulti,
    fileDel,
    // 图片/文件预览地址
    getPreviewUrl: (fileId: string) => `/api/attachment/preview/${fileId}`,
    getFilePreviewUrl: (fileId: string) => `/api/attachment/filePreview/${fileId}`,
  },
  // 可选：全局设置默认 token
  access_token: 'your-auth-token',
})

app.mount('#app')
```

---

### 2. 组件 Props 通用配置（`upload`）

在具体编辑器组件上配置通用上传行为，适用于单个页面需定制请求参数的场景：

```vue
<template>
  <SpeedEditor :upload="uploadConfig" />
</template>

<script lang="ts" setup>
import { SpeedEditor } from '@speed-editor/base-editor'
import { fileUploadSingle, fileDel } from '@/api/attachment'

const uploadConfig = {
  maxSize: 20, // 限制 20MB
  uploadApis: {
    fileUploadSingle,
    fileDel,
    getPreviewUrl: (fileId: string) => `/api/preview/${fileId}`,
  },
}
</script>
```

---

### 3. 组件 Props 专属配置（`image` / `file`）

当需要对图片和附件进行差异化控制时：

```vue
<template>
  <SpeedEditor
    :upload="commonUploadConfig"
    :image="imageConfig"
    :file="fileConfig"
  />
</template>

<script lang="ts" setup>
import { SpeedEditor } from '@speed-editor/base-editor'

const commonUploadConfig = {
  uploadApis: {
    fileUploadSingle,
    getPreviewUrl: (id: string) => `/preview/${id}`,
  },
}

// 专属图片配置：单文件限 5MB，限制格式
const imageConfig = {
  maxSize: 5,
  accept: '.png,.jpg,.jpeg,.webp',
}

// 专属附件配置：放宽到 100MB
const fileConfig = {
  maxSize: 100,
}
</script>
```

---

### 4. 传统 URL 地址模式（`action` 适配器）

若不希望手动提供 Promise 函数，亦可直接传入后端 HTTP 上传 URL：

```vue
<template>
  <SpeedEditor
    :image="{
      action: '/api/v1/upload',
      headers: { Authorization: 'Bearer token' },
      data: { category: 'editor-images' },
    }"
  />
</template>
```

> **实现机制**：系统内置了 `action` 自动适配器，当配置了 `action` 时，会自动将其封装为标准接口接入流水线，**统一享受格式校验、大小拦截、`beforeUpload` 与 Loading 状态管理**，无需在组件内部区分两套分支。

---

## 三、配置项接口定义（`IUploadConfig`）

```ts
interface IUploadConfig {
  multiple?: boolean // 是否支持多选
  maxSize?: number // 单个文件最大大小（单位：MB）
  accept?: string | string[] // 允许的文件扩展名（如 '.png,.jpg' 或 ['.png', '.jpg']）
  action?: string // 传统上传接口 URL
  headers?: Record<string, string> // 上传请求头（action 模式下有效）
  data?: Record<string, any> | ((file: File) => Record<string, any>) // 上传附带数据
  beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<boolean> // 上传前自定义拦截校验
  transformFileItem?: (res: any) => any // 响应结果字段映射转换
  uploadApis?: {
    fileUploadSingle: (formData: FormData) => Promise<any>
    fileUploadMulti?: (formData: FormData) => Promise<any>
    fileDel?: (fileId: string) => Promise<any>
    fileDownload?: (fileId: string) => Promise<any>
    getPreviewUrl?: (fileId: string) => string
    getFilePreviewUrl?: (fileId: string) => string
  }
}
```

---

## 四、自定义扩展接入（开发者指南）

若需要开发新的上传类 NodeView（如音频、视频扩展），可直接使用内置 Hook：

```ts
import { useEditorUpload } from '@speed-editor/extension-kit'

const {
  resolvedConfig, // 经过多层级联计算后的终态配置
  uploadLoading,  // 上传加载态
  uploadFailed,   // 失败态
  startUpload,    // 触发上传（内置校验 -> 上传 -> 回调）
} = useEditorUpload({
  type: 'video', // 扩展类型
  defaultAccept: '.mp4,.mov',
  onSuccess: async (files, res) => {
    // 写入节点属性
  },
})
```
