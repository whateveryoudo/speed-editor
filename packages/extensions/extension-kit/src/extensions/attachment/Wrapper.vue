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
        <TypographyText style="cursor: pointer" @click="uploadAgain">
          <span>
            {{ uploadLoading ? "正在上传中" : "请选择文件" }}
          </span>
          <InfoCircleOutlined class="ml-2 text-[var(--ant-color-error)]" v-if="uploadFailed"/>
        </TypographyText>
      </Spin>
    </div>
    <file-display-bar v-if="nodeAttrs.fileId" v-bind="nodeAttrs" @download="handleDownloadFile" />
    <input ref="AttachmentInput" @change="handleFileChange" type="file"
      :accept="resolvedConfig.accept ?? defaultFileAccept"
      hidden />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { PropType, ref, computed, watch, onMounted } from "vue";
import { NodeViewWrapper } from "@tiptap/vue-3";
import { Editor } from "@tiptap/core";
import FileDisplayBar from "./FileDisplayBar.vue";
import { Spin, TypographyText } from 'ant-design-vue';
import { InfoCircleOutlined } from '@ant-design/icons-vue';
import { useEditorUpload } from '@ek/hooks/useEditorUpload';

const defaultFileAccept = '.docx,.doc,.txt,.lake,.lakebook,.lakesheet,.pdf,.xls,.xlsx,.xlsm,.csv,.pptx,.ppt,.pages,.numbers,.key,.keynote,.md,.mark,.markdown,.xmind,.mindnode,.mmap,.mm,.rp,.psd,.sketch,.svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic,.heif,.ts,.mp3,.mpga,.wav,.bat,.c,.cpp,.css,.go,.h,.java,.js,.json,.jsonl,.log,.m,.mkd,.php,.py,.r,.sh,.sql,.xml,.jmx,.yaml,.yml,.ipynb,.mp4';

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

const isEditable = computed(() => {
  return props.editor?.isEditable;
});

const nodeAttrs = computed(() => {
  return props.node?.attrs || {};
});

// 统一接入 useEditorUpload Hook 处理级联配置、action 适配、校验与下载/上传
const {
  resolvedConfig,
  uploadLoading,
  uploadFailed,
  startUpload,
  handleDownloadFile,
} = useEditorUpload({
  type: 'file',
  defaultAccept: defaultFileAccept,
  onSuccess: async (files, res) => {
    // 移除 TipTap storage 中的临时文件缓存
    const tempId = nodeAttrs.value.tempFileId || nodeAttrs.value.fileId;
    if (tempId) {
      props.editor?.commands?.removeTempFile?.(tempId);
    }
    const file = Array.isArray(files) && files.length > 0 ? files[0] : (Array.isArray(res?.data) ? res.data[0] : res?.data);
    props.updateAttributes &&
      props.updateAttributes({
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        fileId: file.id,
      });
  },
});

const AttachmentInput = ref<HTMLInputElement>();
const uploadAgain = () => {
  AttachmentInput.value?.click();
};

const handleFileChange = (event: any) => {
  startUpload(event?.target?.files?.[0]);
};

onMounted(() => {
  // 监听下载事件
  props.editor?.on('attachment:download', ({ fileId }: { fileId: string }) => {
    if (fileId === props.node.attrs.fileId) {
      handleDownloadFile(fileId);
    }
  });
});

watch(
  () => nodeAttrs.value.tempFileId,
  (tempFileId: string) => {
    if (!tempFileId) return;
    const file = (props.editor.storage as any)?.attachment?.tempFileMap?.get(tempFileId);
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
