<!--
 * @Author: ykx
 * @Date: 2022-11-11 15:39:52
 * @LastEditTime: 2022-12-28 10:40:15
 * @LastEditors: your name
 * @Description: 附件容器
 * @FilePath: \we-knowledge-base\src\tiptap\core\extensions\attachment\Wrapper.vue
-->
<template>
  <NodeViewWrapper :class="['cursor-pointer', nodeAttrs.displayMode !== 'card' && 'inline-block']">
    <div v-if="isEditable && !nodeAttrs.fileId" :class="['wrap px-2', uploadFailed ? 'upload-failed' : '']"
      @click="uploadAgain">
      <Spin :spinning="uploadLoading">
        <!-- 先不要进度条 -->
        <TypographyText style="cursor: pointer" @click="uploadAgain">
          <!-- <Progress v-if="showProgress" :percent="percent" showInfo></Progress> -->
          <span>
            {{ uploadLoading ? "正在上传中" : "请选择文件" }}
          </span>
          <InfoCircleOutlined class="ml-2 text-[var(--ant-color-error)]" v-if="uploadFailed"/>
        </TypographyText>
      </Spin>
    </div>
    <file-display-bar v-if="nodeAttrs.fileId" v-bind="nodeAttrs" @download="handleDownloadFile" />
    <input ref="AttachmentInput" @change="handleFileChange" type="file"
      :accept="fileConfig?.accept ?? '.docx,.doc,.txt,.lake,.lakebook,.lakesheet,.pdf,.xls,.xlsx,.xlsm,.csv,.pptx,.ppt,.pages,.numbers,.key,.keynote,.md,.mark,.markdown,.xmind,.mindnode,.mmap,.mm,.rp,.psd,.sketch,.svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic,.heif,.ts,.mp3,.mpga,.wav,.bat,.c,.cpp,.css,.go,.h,.java,.js,.json,.jsonl,.log,.m,.mkd,.php,.py,.r,.sh,.sql,.xml,.jmx,.yaml,.yml,.ipynb,.mp4'"
      hidden />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { PropType, ref, computed, watch, inject, Ref, onMounted } from "vue";
import { NodeViewWrapper } from "@tiptap/vue-3";
import { Editor } from "@tiptap/core";
import FileDisplayBar from "./FileDisplayBar.vue";
import { useCustomUpload, type IFileItem } from "speed-components-ui/hooks";
import { Progress, Spin, TypographyText, message } from 'ant-design-vue';
import axios from 'axios';
import { useSpeedEditor } from '@speed-editor/composables';
import { InfoCircleOutlined } from '@ant-design/icons-vue';
const uploadFailed = ref(false);
const props = defineProps({
  node: {
    type: Object,
    require: true,
    default: () => ({}),
  },
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
  updateAttributes: {
    type: Function,
    default: null,
  },
});
// 初始化注入的对象
const speedUseTiptapConfig = inject(
  "speedUseTiptapConfig",
  ref({})
) as Ref<any>;
// 顶层组件注入对象
const { speedTiptapConfig } = useSpeedEditor();
const { file: fileConfig } = speedTiptapConfig.value;
const isEditable = computed(() => {
  return props.editor?.isEditable;
});

const showProgress = ref(false);
const percent = ref(0);
// torefs无效？？
const nodeAttrs = computed(() => {
  return props.node?.attrs;
});

// 定义上传选项
const uploadOptions = computed(() => {
  const rawAccept =
    speedTiptapConfig?.value?.upload?.accept ||
    speedTiptapConfig?.value?.file?.accept ||
    speedUseTiptapConfig?.value?.image?.accept ||
    undefined
  // 兼容字符串或数组；其余情况返回空数组
  const acceptTypes = Array.isArray(rawAccept)
    ? rawAccept
    : typeof rawAccept === 'string'
      ? rawAccept.split(',')
      : []
  return {
    acceptTypes,
    maxSize: speedTiptapConfig?.value?.upload?.maxSize || speedTiptapConfig?.value?.file?.maxSize || speedUseTiptapConfig?.value?.file?.maxSize,
    // 传入ajax方法
    apis: {
      fileUploadMulti: speedTiptapConfig?.value?.upload?.uploadApis?.fileUploadMulti || speedTiptapConfig?.value?.file?.uploadApis?.fileUploadMulti || speedUseTiptapConfig?.value?.apis?.fileUploadMulti,
      fileUploadSingle: speedTiptapConfig?.value?.upload?.uploadApis?.fileUploadSingle || speedTiptapConfig?.value?.file?.uploadApis?.fileUploadSingle || speedUseTiptapConfig?.value?.apis?.fileUploadSingle,
      fileDel: speedTiptapConfig?.value?.upload?.uploadApis?.fileDel || speedTiptapConfig?.value?.file?.uploadApis?.fileDel || speedUseTiptapConfig?.value?.apis?.fileDel,
      fileDownload: speedTiptapConfig?.value?.upload?.uploadApis?.fileDownload || speedTiptapConfig?.value?.file?.uploadApis?.fileDownload || speedUseTiptapConfig?.value?.apis?.fileDownload,
    },
    transformResult: speedTiptapConfig?.value?.upload?.transformFileItem || speedTiptapConfig?.value?.file?.transformFileItem || speedUseTiptapConfig?.value?.upload?.transformFileItem,
    // 上传后的回调
    afterUpload: async (files: any[], res: any) => {
      if (!res?.success) {
        message.error(res?.message);
        uploadFailed.value = true;
        return;
      }
      console.log("上传完成:", files);
      const file = files[0];
      props.updateAttributes &&
        props.updateAttributes({
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          fileId: file.id,
        });
    },
    uploadError: (error: any) => {
      message.error(error.message);
      uploadFailed.value = true;
    }
  }
});

// 使用自定义上传hook
const { customRequest, uploadLoading, beforeUpload: commonBeforeUpload, handleDownloadFile } =
  useCustomUpload(uploadOptions);
// 手动上传的beforeUpload(这里仅处理单个文件判断)
const manualBeforeUpload = (file: File | File[]) => {
  const beforeUpload = speedTiptapConfig?.value?.file?.beforeUpload || speedTiptapConfig?.value?.upload?.beforeUpload || speedUseTiptapConfig?.value?.file?.beforeUpload;
  const fileItem = Array.isArray(file) ? file[0] : file;
  if (beforeUpload) {
    return beforeUpload(fileItem)
  }
  // 通用拦截判断(调用hook)
  return commonBeforeUpload(fileItem as any);
}
// 处理文件选择
const startUpload = (file: File) => {
  // 这里直接用action判断
  const action = speedTiptapConfig?.value?.file?.action || speedTiptapConfig?.value?.upload?.action;
  if (!action) {
    customRequest({
      file
    });
  } else { // 手动上传，需要用户传入一些信息（不建议使用此方案，大部分不建议直接配置url地址，而是传入方法）
    if (manualBeforeUpload(file)) {
      const headers = speedTiptapConfig?.value?.file?.headers || speedTiptapConfig?.value?.upload?.headers || speedUseTiptapConfig?.value?.file?.headers;
      const data = speedTiptapConfig?.value?.file?.data || speedTiptapConfig?.value?.upload?.data || speedUseTiptapConfig?.value?.file?.data;
      axios.post(action, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...headers
        },
        data: typeof data === 'function' ? data(file) : data
      }).then(async (res: any) => {
        if (!res?.success) {
          message.error(res?.message);
          uploadFailed.value = true;
          return;
        }
        const file = Array.isArray(res.data) ? res.data[0] : res.data;
        props.updateAttributes &&
          props.updateAttributes({
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            fileId: file.id,
          });
      }).catch((err) => {
        message.error(err);
        uploadFailed.value = true;
      })
    }

  };
};
const AttachmentInput = ref<HTMLInputElement>()
const uploadAgain = () => {
  AttachmentInput.value?.click()
}
const handleFileChange = (event: any) => {
  startUpload(event?.target?.files[0])
}
onMounted(() => {
  // 监听下载事件
  props.editor?.on('attachment:download', ({ fileId }: { fileId: string }) => {
    if (fileId === props.node.attrs.fileId) {
      handleDownloadFile(fileId)
    }
  })
})
watch(
  () => nodeAttrs.value.tempFileId,
  (tempFileId: string) => {
    if (!tempFileId) return;
    const file = (props.editor.storage as any).attachment.tempFileMap.get(tempFileId);
    if (file && !nodeAttrs.value.fileId) {
      startUpload(file);
    }
  },
  {
    immediate: true,
  }
);
</script>
<style lang="less" scoped>
.wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid transparent;

  &.upload-failed {
    border-color: var(--ant-color-error);
  }
}
</style>
