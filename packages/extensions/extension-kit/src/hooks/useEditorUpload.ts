import { ref, computed } from 'vue'
import axios from 'axios'
import { message } from 'ant-design-vue'
import { useCustomUpload, type IFileItem } from 'speed-components-ui/hooks'
import { useEditorUploadConfig, type UploadTargetType } from '@speed-editor/composables'

export interface UseEditorUploadProps {
  type: UploadTargetType
  defaultAccept?: string
  defaultMaxSize?: number
  name?: string
  multiple?: boolean
  onSuccess?: (files: any[], rawRes: any) => Promise<void> | void
  onError?: (error: any) => void
}

/**
 * 针对富文本 NodeView（图片、附件等）的通用上传 Hook
 * 1. 深度聚合 props.upload / props[type] / 全局 speedUseTiptapConfig
 * 2. 自动将 action 地址适配为标准 uploadApis.fileUploadSingle / Multi 请求
 * 3. 统一统一管控 beforeUpload 拦截、Loading 状态、失败提示及数据回调
 */
export function useEditorUpload(options: UseEditorUploadProps) {
  const { type, defaultAccept, defaultMaxSize, name, multiple, onSuccess, onError } = options
  const { resolvedConfig } = useEditorUploadConfig(type, {
    defaultAccept,
    defaultMaxSize,
  })

  const uploadFailed = ref(false)

  // 构造标准传递给 useCustomUpload 的 options
  const uploadOptions = computed(() => {
    const cfg = resolvedConfig.value
    const action = cfg.action
    const headers = cfg.headers || {}

    // 如果未传自定义 API 且配置了 action，将其转换为适配函数
    let fileUploadSingle = cfg.apis.fileUploadSingle
    let fileUploadMulti = cfg.apis.fileUploadMulti

    if (!fileUploadSingle && action) {
      fileUploadSingle = async (formData: FormData) => {
        const res = await axios.post(action, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...headers,
          },
        })
        return res.data
      }
    }

    if (!fileUploadMulti && action) {
      fileUploadMulti = async (formData: FormData) => {
        const res = await axios.post(action, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...headers,
          },
        })
        return res.data
      }
    }

    return {
      maxSize: cfg.maxSize,
      acceptTypes: cfg.acceptTypes,
      name: name || 'file',
      multiple: multiple ?? false,
      data: cfg.data,
      apis: {
        ...cfg.apis,
        fileUploadSingle,
        fileUploadMulti,
      },
      transformResult: cfg.transformResult,
      afterUpload: async (files: any[], res: any) => {
        if (!res?.success) {
          uploadFailed.value = true
          message.error(res?.message || '上传失败')
          return
        }
        uploadFailed.value = false
        if (onSuccess) {
          await onSuccess(files, res)
        }
      },
      uploadError: (error: any) => {
        uploadFailed.value = true
        message.error(error?.message || '上传出错')
        onError?.(error)
      },
    }
  })

  const {
    customRequest,
    uploadLoading,
    beforeUpload: commonBeforeUpload,
    handleDownloadFile,
    handlePreviewFile,
    handleDelFile,
    files,
  } = useCustomUpload(uploadOptions)

  /**
   * 触发文件上传统一入口
   */
  const startUpload = (file: File | File[]) => {
    if (!file) return
    const fileItem = Array.isArray(file) ? file[0] : file
    const fileList = Array.isArray(file) ? file : [file]

    // 1. 用户自定义 beforeUpload 校验
    if (resolvedConfig.value.beforeUpload) {
      const checkRes = resolvedConfig.value.beforeUpload(fileItem, fileList)
      if (checkRes === false) return
    }

    // 2. 内置格式与文件大小校验
    if (!commonBeforeUpload(fileItem as any)) {
      return
    }

    // 3. 执行上传请求
    customRequest({ file })
  }

  return {
    resolvedConfig,
    uploadOptions,
    uploadLoading,
    uploadFailed,
    startUpload,
    customRequest,
    commonBeforeUpload,
    handleDownloadFile,
    handlePreviewFile,
    handleDelFile,
    files,
  }
}

export type { IFileItem }
