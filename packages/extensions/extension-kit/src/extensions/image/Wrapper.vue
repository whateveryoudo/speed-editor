<!--
 * @Author: ykx
 * @Date: 2022-11-11 15:39:52
 * @LastEditTime: 2026-07-15
 * @Description: 图片 NodeView（语雀风格：选中四角等比缩放 + 拖动占位框）
-->
<template>
  <NodeViewWrapper class="node-image">
    <div v-if="!nodeAttrs.src" :class="['wrapper', uploadFailed ? 'upload-failed' : '']" @click="uploadAgain">
      <Spin :spinning="uploadLoading">
        <img :class="uploadFailed ? 'upload-failed' : ''" :src="ImgPlaceholder" alt="请选择图片"
          style="width: 150px; height: auto">
      </Spin>
    </div>
    <template v-else>
      <ImageResizeFrame v-if="editableCpt" :width="resolvedWidth" :height="resolvedHeight" :max-width="maxWidth"
        :editable="editableCpt" :selected="selected" @select="selectNode" @change-end="onResizeEnd">
        <img :src="displaySrc" :alt="nodeAttrs.alt" />
      </ImageResizeFrame>
      <img v-else @click="handlePreivew" :src="displaySrc" :alt="nodeAttrs.alt" :style="previewImgStyle" />
    </template>
    <input ref="ImageInput" type="file" class="hidden-input" hidden
      :accept="imageConfig?.accept ?? '.svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic'" @change="handleFileChange" />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { PropType, inject, ref, computed, watch, Ref } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { Editor } from '@tiptap/core'
import ImgPlaceholder from '@ek/assets/image/img-placeholder.png'
import axios from 'axios'
import {
  getEditorContainerDOMSize,
  getImageWidthHeight,
} from '@ek/prose-utils'
import { useCustomUpload } from 'speed-components-ui/hooks'
import { Spin, message } from 'ant-design-vue'
import { useSpeedEditor } from '@speed-editor/composables'
import ImageResizeFrame from './ImageResizeFrame.vue'

const speedUseTiptapConfig = inject(
  'speedUseTiptapConfig',
  ref({}),
) as Ref<any>
const { speedTiptapConfig, previewInstance, editableCpt } = useSpeedEditor()
const { image: imageConfig } = speedTiptapConfig.value
const uploadFailed = ref(false)

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
  /** TipTap NodeView 选中态 */
  selected: {
    type: Boolean,
    default: false,
  },
  getPos: {
    type: Function as any,
    default: undefined,
  },
})

const ImageInput = ref<HTMLInputElement>()
const measuredWidth = ref<number | null>(null)
const measuredHeight = ref<number | null>(null)

const nodeAttrs = computed(() => props.node?.attrs)
const maxWidth = getEditorContainerDOMSize(props.editor)?.width || 760

const parseSize = (v: unknown) => {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v
  if (v === 'auto' || v == null || v === '') return null
  const n = parseFloat(String(v))
  return Number.isFinite(n) && n > 0 ? n : null
}

const resolvedWidth = computed(() => {
  return parseSize(nodeAttrs.value?.width) ?? measuredWidth.value ?? 'auto'
})

const resolvedHeight = computed(() => {
  return parseSize(nodeAttrs.value?.height) ?? measuredHeight.value ?? 'auto'
})

const previewImgStyle = computed(() => {
  const w = resolvedWidth.value
  const h = resolvedHeight.value
  return {
    width: w !== 'auto' ? `${w}px` : 'auto',
    height: h !== 'auto' ? `${h}px` : 'auto',
    maxWidth: '100%',
  }
})
// 这里提供展示url(采用拼接token的方式)
const displaySrc = computed(() => {
  const src = nodeAttrs.value?.src
  if (src) {
    if (src?.startsWith('data:')) {
      return src
    }
    if (speedUseTiptapConfig?.value?.access_token) {
      return `${src.split('?')[0]}?access_token=${speedUseTiptapConfig?.value?.access_token}`
    }
  }
  return src
})

const selectNode = () => {
  if (typeof props.getPos !== 'function') return
  const pos = props.getPos()
  if (typeof pos === 'number') {
    props.editor.chain().setNodeSelection(pos).run()
  }
}

const onResizeEnd = ({ width, height }: { width: number; height: number }) => {
  const pos = typeof props.getPos === 'function' ? props.getPos() : undefined
  props.updateAttributes?.({
    width: String(width),
    height: String(height),
  })
  // 写回 attrs 后保持节点选中，方便连续拖角调大小（手柄不消失）
  if (typeof pos === 'number') {
    requestAnimationFrame(() => {
      props.editor.chain().focus().setNodeSelection(pos).run()
    })
  }
}

/** 导入等场景缺宽高：测自然尺寸写回（可选落库）+ 本地兜底渲染 */
const ensureMeasuredSize = async (src: string) => {
  if (!src) return
  if (parseSize(nodeAttrs.value?.width) && parseSize(nodeAttrs.value?.height)) return
  const size = await getImageWidthHeight(src, maxWidth)
  const w = parseSize(size.width)
  const h = parseSize(size.height)
  if (!w || !h) return
  measuredWidth.value = w
  measuredHeight.value = h
  // 缺 attrs 时写回，避免编辑态塌成 0
  if (!parseSize(nodeAttrs.value?.width) || !parseSize(nodeAttrs.value?.height)) {
    props.updateAttributes?.({
      width: String(w),
      height: String(h),
      originalWidth: nodeAttrs.value?.originalWidth || String(w),
      originalHeight: nodeAttrs.value?.originalHeight || String(h),
    })
  }
}

watch(
  () => nodeAttrs.value?.src,
  (src: string) => {
    measuredWidth.value = null
    measuredHeight.value = null
    if (src) ensureMeasuredSize(src)
  },
  { immediate: true },
)

const uploadOptions = computed(() => {
  const rawAccept =
    speedTiptapConfig?.value?.upload?.accept ||
    speedTiptapConfig?.value?.image?.accept ||
    speedUseTiptapConfig?.value?.image?.accept ||
    undefined
  const acceptTypes = Array.isArray(rawAccept)
    ? rawAccept
    : typeof rawAccept === 'string'
      ? rawAccept.split(',')
      : []
  return {
    acceptTypes,
    maxSize:
      speedTiptapConfig?.value?.upload?.maxSize ||
      speedTiptapConfig?.value?.image?.maxSize ||
      speedUseTiptapConfig?.value?.image?.maxSize,
    apis: {
      fileUploadMulti:
        speedTiptapConfig?.value?.upload?.uploadApis?.fileUploadMulti ||
        speedTiptapConfig?.value?.image?.uploadApis?.fileUploadMulti ||
        speedUseTiptapConfig?.value?.apis?.fileUploadMulti,
      fileUploadSingle:
        speedTiptapConfig?.value?.upload?.uploadApis?.fileUploadSingle ||
        speedTiptapConfig?.value?.image?.uploadApis?.fileUploadSingle ||
        speedUseTiptapConfig?.value?.apis?.fileUploadSingle,
      fileDel:
        speedTiptapConfig?.value?.upload?.uploadApis?.fileDel ||
        speedTiptapConfig?.value?.image?.uploadApis?.fileDel ||
        speedUseTiptapConfig?.value?.apis?.fileDel,
      fileDownload:
        speedTiptapConfig?.value?.upload?.uploadApis?.fileDownload ||
        speedTiptapConfig?.value?.image?.uploadApis?.fileDownload ||
        speedUseTiptapConfig?.value?.apis?.fileDownload,
    },
    transformResult:
      speedTiptapConfig?.value?.upload?.transformFileItem ||
      speedTiptapConfig?.value?.image?.transformFileItem ||
      speedUseTiptapConfig?.value?.upload?.transformFileItem,
    afterUpload: async (files: any[], res: any) => {
      props.editor.commands.removeTempFile(nodeAttrs.value.fileId)
      if (!res?.success) {
        message.error(res?.message)
        uploadFailed.value = true
        return
      }
      const file = files[0]
      const getPreviewUrl =
        speedTiptapConfig?.value?.upload?.uploadApis?.getPreviewUrl ||
        speedTiptapConfig?.value?.image?.uploadApis?.getPreviewUrl ||
        speedUseTiptapConfig?.value?.apis?.getPreviewUrl

      const imgUrl = getPreviewUrl ? getPreviewUrl(file.id) : ''
      const size = await getImageWidthHeight(imgUrl, maxWidth)
      props.updateAttributes?.({
        ...size,
        src: imgUrl,
        originalWidth: size.width,
        originalHeight: size.height,
      })
    },
    uploadError: (error: any) => {
      message.error(error.message)
      uploadFailed.value = true
    },
  }
})

const { customRequest, beforeUpload: commonBeforeUpload, uploadLoading } =
  useCustomUpload(uploadOptions)

const manualBeforeUpload = (file: File | File[]) => {
  const beforeUpload =
    speedTiptapConfig?.value?.image?.beforeUpload ||
    speedTiptapConfig?.value?.upload?.beforeUpload ||
    speedUseTiptapConfig?.value?.image?.beforeUpload
  const fileItem = Array.isArray(file) ? file[0] : file
  if (beforeUpload) return beforeUpload(fileItem)
  return commonBeforeUpload(fileItem as any)
}

const startUpload = (file: File) => {
  const action =
    speedTiptapConfig?.value?.image?.action ||
    speedTiptapConfig?.value?.upload?.action
  if (!action) {
    customRequest({ file })
    return
  }
  if (!manualBeforeUpload(file)) return
  const headers =
    speedTiptapConfig?.value?.image?.headers ||
    speedTiptapConfig?.value?.upload?.headers ||
    speedUseTiptapConfig?.value?.image?.headers
  const data =
    speedTiptapConfig?.value?.image?.data ||
    speedTiptapConfig?.value?.upload?.data ||
    speedUseTiptapConfig?.value?.image?.data
  axios
    .post(action, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...headers,
      },
      data: typeof data === 'function' ? data(file) : data,
    })
    .then(async (res: any) => {
      props.editor.commands.removeTempFile(nodeAttrs.value.fileId)
      if (!res?.success) {
        message.error(res?.message)
        uploadFailed.value = true
        return
      }
      const fileItem = Array.isArray(res.data) ? res.data[0] : res.data
      const getPreviewUrl =
        speedTiptapConfig?.value?.upload?.uploadApis?.getPreviewUrl ||
        speedTiptapConfig?.value?.image?.uploadApis?.getPreviewUrl ||
        speedUseTiptapConfig?.value?.apis?.getPreviewUrl
      const imgUrl = getPreviewUrl ? getPreviewUrl(fileItem.id) : ''
      const relativePath = imgUrl.split('?')[0]
      const size = await getImageWidthHeight(imgUrl, maxWidth)
      props.updateAttributes?.({
        ...size,
        src: relativePath, // 这里存入的是相对路径（避免存入json后 token过期）
        originalWidth: size.width,
        originalHeight: size.height,
      })
    })
    .catch((err) => {
      message.error(err)
      uploadFailed.value = true
    })
}

const handlePreivew = () => {
  if (!editableCpt.value && previewInstance.value) {
    // token 由 EditorPreviewImage 内部拼接
    previewInstance.value.previewImage(nodeAttrs.value?.src)
  }
}

const uploadAgain = () => {
  ImageInput.value?.click()
}

const handleFileChange = (event: any) => {
  startUpload(event?.target?.files[0])
}

watch(
  () => nodeAttrs.value.tempFileId,
  (tempFileId: string) => {
    if (!tempFileId) return
    const file = (props.editor.storage as any).image.tempFileMap.get(tempFileId)
    if (file && !nodeAttrs.value.src) {
      startUpload(file)
    }
  },
  { immediate: true },
)
</script>

<style lang="less" scoped>
.node-image {
  display: inline-block;
  position: relative;
  max-width: 100%;
  line-height: 0;

  .wrapper {
    display: flex;
    padding-left: 6px;
    padding-right: 6px;
    cursor: pointer;
    justify-content: space-between;
    align-items: center;
    border: 1px solid transparent;
    line-height: normal;

    &.upload-failed {
      border-color: var(--ant-color-error);
    }
  }

  .hidden-input {
    display: none;
  }
}
</style>
