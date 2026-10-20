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
      :accept="resolvedConfig.accept ?? '.svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic'" @change="handleFileChange" />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { PropType, ref, computed, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { Editor } from '@tiptap/core'
import ImgPlaceholder from '@ek/assets/image/img-placeholder.png'
import {
  getEditorContainerDOMSize,
  getImageWidthHeight,
} from '@ek/prose-utils'
import { Spin } from 'ant-design-vue'
import { useSpeedEditor } from '@speed-editor/composables'
import { useEditorUpload } from '@ek/hooks/useEditorUpload'
import ImageResizeFrame from './ImageResizeFrame.vue'

const { previewInstance, editableCpt } = useSpeedEditor()

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

const nodeAttrs = computed(() => props.node?.attrs || {})
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

// 统一接入 useEditorUpload Hook 处理配置级联、拦截、上传及状态
const { resolvedConfig, uploadLoading, uploadFailed, startUpload } = useEditorUpload({
  type: 'image',
  defaultAccept: '.svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic',
  onSuccess: async (files, res) => {
    // 移除 TipTap storage 中的临时文件缓存
    const tempId = nodeAttrs.value.tempFileId || nodeAttrs.value.fileId
    if (tempId) {
      props.editor?.commands?.removeTempFile?.(tempId)
    }

    const fileItem = Array.isArray(files) && files.length > 0 ? files[0] : (Array.isArray(res?.data) ? res.data[0] : res?.data)
    const getPreviewUrl = resolvedConfig.value.apis?.getPreviewUrl
    const rawPreviewUrl = getPreviewUrl && fileItem?.id ? getPreviewUrl(fileItem.id) : (fileItem?.previewUrl || '')
    const relativePath = rawPreviewUrl ? rawPreviewUrl.split('?')[0] : ''
    const size = await getImageWidthHeight(rawPreviewUrl || relativePath, maxWidth)

    props.updateAttributes?.({
      ...size,
      src: relativePath, // 存入纯路径，避免 token 过期失效
      originalWidth: size.width,
      originalHeight: size.height,
    })
  },
})

// 这里提供展示 url（通过 access_token 拼接，支持全局注入与 props 注入）
const displaySrc = computed(() => {
  const src = nodeAttrs.value?.src
  if (src) {
    if (src.startsWith('data:')) {
      return src
    }
    const token = resolvedConfig.value.accessToken
    if (token) {
      return `${src.split('?')[0]}?access_token=${token}`
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

const handlePreivew = () => {
  if (!editableCpt.value && (previewInstance.value as any)) {
    // token 由 EditorPreviewImage 内部拼接
    ;(previewInstance.value as any).previewImage(nodeAttrs.value?.src)
  }
}

const uploadAgain = () => {
  ImageInput.value?.click()
}

const handleFileChange = (event: any) => {
  startUpload(event?.target?.files?.[0])
}

watch(
  () => nodeAttrs.value?.tempFileId,
  (tempFileId: string) => {
    if (!tempFileId) return
    const file = (props.editor.storage as any)?.image?.tempFileMap?.get(tempFileId)
    if (file && !nodeAttrs.value?.src) {
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
