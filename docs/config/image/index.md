# 图片上传配置（image）

不同于大多数编辑器的上传配置，Speed Tiptap Editor 优先支持你传入ajax的请求集合[why not url?](#why-not-url)

### 初始use时，传入配置

```ts
import { createApp } from "vue";
import App from "./App.vue";
import router from "./src/router";
import SpeedTiptapEditor from "speed-editor";
import "speed-editor/dist/style.css";
import { createPinia } from "pinia";
import { useGlobalStore } from "#example/store/index";
import "uno.css";

import {
  fileDownload,
  fileUploadSingle,
  fileUploadMulti,
  fileDel,
} from "./src/api/attachement";
// 配置一些请求地址，用于上传文件
createApp(App)
  .use(router)
  .use(createPinia())
  .use(SpeedTiptapEditor, {
    // 定义编辑器的一些公共配置
    apis: {
      fileDownload: fileDownload,
      fileUploadSingle: fileUploadSingle,
      fileUploadMulti: fileUploadMulti,
      fileDel: fileDel,
      // 主要用于图片预览
      getPreviewUrl: (fileId: string) => {
        // 实际情况替换为实际地址(此处为本地启动的node附件服务)
        const globalStore = useGlobalStore();
        const token = globalStore.openJwt
          ? localStorage.getItem("speed-tiptap-token")
          : "speed-test-token"; // 未开启jwt 则使用一个模拟值
        return (
          "//localhost:3005/onlyoffice/filePreview/" +
          fileId +
          `?token=${token}`
        );
      },
    },
  })
  .mount("#app");
```

### 说明点

- 此处的配置会作用于`image`和`file`的上传
- `getPreviewUrl` 为`file`下的预览页面，可根据后端提供地址自行配置，本项目提供[完整示例](https://github.com/whateveryoudo/speed-editor),对应[node示例](https://github.com/whateveryoudo/speed-apis),你拉取两个仓库后，启动 `pnpm run dev`,
  editor运行在`localhost://3003`，后端运行在`localhost://3005`(后端仅提供相关api辅助功能,并未连接数据库),如需要查看附件页面需拉取，[onlyoffice服务](https://github.com/whateveryoudo/onlyoffice),执行`./start.sh`

### upload 配置传入

```vue
<template>
  <SpeedTiptapEditor v-bind="simpleProps" />
</template>
<script lang="ts" setup>
import {
  fileDownload,
  fileUploadSingle,
  fileUploadMulti,
  fileDel,
} from "#example/api/attachement";

const simpleProps = {
  upload: {
    uploadApis: {
      fileDownload: fileDownload,
      fileUploadSingle: fileUploadSingle,
      fileUploadMulti: fileUploadMulti,
      fileDel: fileDel,
      // 主要用于图片预览
      getPreviewUrl: (fileId: string) => {
        // 实际情况替换为实际地址(此处为本地启动的node附件服务)
        const globalStore = useGlobalStore();
        const token = globalStore.openJwt
          ? localStorage.getItem("speed-tiptap-token")
          : "speed-test-token"; // 未开启jwt 则使用一个模拟值
        return (
          "//localhost:3005/attachment/preview/" + fileId + `?token=${token}`
        );
      },
      // 主要用于文件预览
      getFilePreviewUrl: (fileId: string) => {
        // 实际情况替换为实际地址(此处为本地启动的node附件服务)
        const globalStore = useGlobalStore();
        const token = globalStore.openJwt
          ? localStorage.getItem("speed-tiptap-token")
          : "speed-test-token"; // 未开启jwt 则使用一个模拟值
        return (
          "//localhost:3005/onlyoffice/filePreview/" +
          fileId +
          `?token=${token}`
        );
      },
    },
  },
};
</script>
```

upload配置会作用到`image`和`file`的上传，优先级高于use时传入的配置

### 上传配置`IUploadConfig`

```ts
interface IUploadConfig {
  multiple?: boolean; // 是否支持多选
  maxSize?: number; // 最大上传大小（单位：MB）
  accept?: string; // ,拼接的mime或文件扩展名（如：.svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic,推荐使用.xx，mime仅会在选择文件进行过滤）,mime参考：https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file#accept
  action?: string; // 上传地址（注：内部会通过此配置判断是否是地址上传，配置了地址后会忽略api中的fileUploadSingle | fileUploadMulti）
  headers?: Record<string, string>; // 上传请求头(action配置后)
  data?: Record<string, any> | ((file: File) => Record<string, any>); // 上传额外参数(action配置后)
  beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<boolean>; // 上传前校验(action配置后)
  // 支持直接传入的ajax请求(同上use传入)
  uploadApis?: {
    fileDownload: () => Promise<string>;
    fileUploadSingle: (file: File) => Promise<string>;
    fileUploadMulti: (files: File[]) => Promise<string[]>;
    fileDel: (fileId: string) => Promise<boolean>;
    getPreviewUrl: (fileId: string) => string;
  };
}
```

### 注意点：action会使用普通请求，覆盖内置上传

### image 配置传入 (说明同上)

```vue
<template>
  <SpeedTiptapEditor v-bind="simpleProps" />
</template>
<script lang="ts" setup>
import {
  fileDownload,
  fileUploadSingle,
  fileUploadMulti,
  fileDel,
} from "#example/api/attachement";

const simpleProps = {
  image: {
    uploadApis: {
      fileDownload: fileDownload,
      fileUploadSingle: fileUploadSingle,
      fileUploadMulti: fileUploadMulti,
      fileDel: fileDel,
      // 主要用于图片预览
      getPreviewUrl: (fileId: string) => {
        // 实际情况替换为实际地址(此处为本地启动的node附件服务)
        const globalStore = useGlobalStore();
        const token = globalStore.openJwt
          ? localStorage.getItem("speed-tiptap-token")
          : "speed-test-token"; // 未开启jwt 则使用一个模拟值
        return (
          "//localhost:3005/attachment/preview/" + fileId + `?token=${token}`
        );
      },
      // 主要用于文件预览
      getFilePreviewUrl: (fileId: string) => {
        // 实际情况替换为实际地址(此处为本地启动的node附件服务)
        const globalStore = useGlobalStore();
        const token = globalStore.openJwt
          ? localStorage.getItem("speed-tiptap-token")
          : "speed-test-token"; // 未开启jwt 则使用一个模拟值
        return (
          "//localhost:3005/onlyoffice/filePreview/" +
          fileId +
          `?token=${token}`
        );
      },
    },
  },
};
</script>
```

### 注意点

1. 3者优先级： `image` > `upload` > `use时传入的配置`
2. image 会和 upload进行merge, 常用场景（请求配置upload，需要对大小，格式单独区分，走自身配置）


### Why not url?

1. 实际业务中，图片上传往往需要携带token信息
2. 编辑器自身已经封装了大部分的图片处理，如：图片上传、预览、删除 你只需要传入对应请求即可
3. 部分场景下，后端返回的是文件id，而不是url，需要根据id重新获取文件流
