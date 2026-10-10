<!--
 * @Author: ykx
 * @Date: 2022-12-05 16:06:31
 * @LastEditTime: 2022-12-28 10:42:50
 * @LastEditors: your name
 * @Description: 
 * @FilePath: \we-knowledge-base\src\tiptap\core\extensions\attachment\FileDisplayBar.vue
-->
<template>
  <Flex :class="['display-wrap max-w-[400px]', displayMode === 'card' && 'card']" align="center"
    justify="space-between">
    <Flex class="min-w-0 flex-1" align="center" gap="small">
      <s-icon-font v-if="fileTypeIcons[normalizeFileType(fileType) as keyof typeof fileTypeIcons]"
        :icon-render="fileTypeIcons[normalizeFileType(fileType) as keyof typeof fileTypeIcons].icon"
        :color="fileTypeIcons[normalizeFileType(fileType) as keyof typeof fileTypeIcons].color" />
      <span class="flex-1 flex gap-1 items-center min-w-0">
        <span class="truncate" :title="fileName">{{ fileName }}</span>
        <span class="size-text flex-shrink-0">({{ normalizeFileSize(fileSize || 0) }})</span>
      </span>
    </Flex>
    <Space :size="10" class="ml-2 flex-shrink-0" v-if="displayMode === 'card'">
      <Tooltip title="预览">
        <eye-outlined @click="handlePreview" />
      </Tooltip>
      <Tooltip title="下载">
        <download-outlined @click="handleDownLoad" />
      </Tooltip>
    </Space>
  </Flex>
</template>

<script setup lang="tsx">
import { Flex, Space, Tooltip } from 'ant-design-vue'
import { inject, ref, Ref } from "vue";
import { normalizeFileType, normalizeFileSize } from "@ek/prose-utils/file";
import {
  AudioOutlined,
  FileOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileZipOutlined,
  CodeOutlined,
} from "@ant-design/icons-vue";
import { type IFileItem } from "speed-components-ui/hooks";
import { useSpeedEditor } from '@speed-editor/composables';
// 初始化注入的对象
const speedUseTiptapConfig = inject(
  "speedUseTiptapConfig",
  ref({})
) as Ref<any>;
// 顶层组件注入对象
const { speedTiptapConfig } = useSpeedEditor();

const props = withDefaults(
  defineProps<{
    fileType: string;
    fileName: string;
    fileSize: number;
    fileId: string;
    displayMode: 'title' | 'card';
  }>(),
  {
    fileType: "",
    fileName: "",
    fileSize: 0,
    fileId: "",
    displayMode: "title",
  }
);
console.log('重新渲染了')
const emit = defineEmits<{
  (e: "download", file: IFileItem): void;
}>();
const handlePreview = () => {
  const getFilePreviewUrl = speedTiptapConfig?.value?.upload?.uploadApis?.getFilePreviewUrl
    || speedTiptapConfig?.value?.image?.uploadApis?.getFilePreviewUrl
    || speedUseTiptapConfig?.value?.apis?.getFilePreviewUrl;


  props.fileId && window.open(getFilePreviewUrl ? getFilePreviewUrl(props.fileId) : "");
};
const fileTypeIcons = {
  audio: { icon: () => <AudioOutlined />, color: '#48a25e' },
  video: { icon: () => <VideoCameraOutlined />, color: '#48a25e' },
  file: { icon: () => <FileOutlined />, color: '#48a25e' },
  image: { icon: () => <FileImageOutlined />, color: '#48a25e' },
  pdf: { icon: () => <FilePdfOutlined />, color: '#48a25e' },
  document: { icon: () => <FileWordOutlined />, color: '#48a25e' },
  archive: { icon: () => <FileZipOutlined />, color: '#48a25e' },
  code: { icon: () => <CodeOutlined />, color: '#48a25e' },
};

const handleDownLoad = () => {
  props.fileId &&
    emit("download", {
      id: props.fileId,
      fileName: props.fileName,
      fileType: props.fileType,
      fileSize: props.fileSize,
    });
};
</script>

<style scoped lang="less">
.display-wrap {
  min-width: 200px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .size-text {
    color: var(--ant-color-text-tertiary);
  }

  &.card {
    max-width: none;
    width: 100%;
    border: 1px solid var(--ant-color-border);
    border-radius: var(--ant-border-radius);
    padding: 8px 16px;
  }
}
</style>
