import { computed, inject, ref, type ComputedRef, type Ref } from 'vue'
import { useSpeedEditor } from './useSpeedEditorContext'
import type { IUploadConfig, SpeedEditorShellProps } from '@speed-editor/shared'

export type UploadTargetType = 'image' | 'file' | 'upload'

export interface ResolvedEditorUploadApis {
  fileUploadSingle?: (formData: FormData | any) => Promise<any>
  fileUploadMulti?: (formData: FormData | any) => Promise<any>
  fileDel?: (fieldId: string) => Promise<any>
  fileDownload?: (fieldId: string) => Promise<any>
  getPreviewUrl?: (fieldId: string) => string
  getFilePreviewUrl?: (fieldId: string) => string
  [key: string]: any
}

export interface ResolvedEditorUploadConfig {
  accept?: string
  acceptTypes: string[]
  maxSize?: number
  action?: string
  headers?: Record<string, string>
  data?: Record<string, any> | ((file: File | File[]) => any)
  beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<boolean>
  transformResult?: (res: any) => any
  apis: ResolvedEditorUploadApis
  accessToken?: string
}

export interface UseEditorUploadConfigOptions {
  defaultAccept?: string
  defaultMaxSize?: number
}

/**
 * 统一解析并级联合并 Editor 上传配置
 * 优先级顺序：
 * 1. Props 专属类型配置（props.image / props.file）
 * 2. Props 通用上传配置（props.upload）
 * 3. Editor 全局配置专属类型（speedUseTiptapConfig.image / file）
 * 4. Editor 全局配置通用上传（speedUseTiptapConfig.upload）
 * 5. Editor 全局配置 apis（speedUseTiptapConfig.apis）
 * 6. 默认入参兜底
 */
export function useEditorUploadConfig(
  type: UploadTargetType = 'upload',
  options?: UseEditorUploadConfigOptions,
) {
  const { speedTiptapConfig } = useSpeedEditor()
  const speedEditorGlobalConfig = inject('speedUseTiptapConfig', ref<Record<string, any>>({})) as Ref<Record<string, any>>

  const resolvedConfig = computed<ResolvedEditorUploadConfig>(() => {
    const props = (speedTiptapConfig.value || {}) as Record<string, any>
    const typeProp = (props[type] || {}) as IUploadConfig
    const commonProp = (props.upload || {}) as IUploadConfig
    const globalConfig = speedEditorGlobalConfig.value || {}
    const globalTypeConfig = (globalConfig[type] || {}) as IUploadConfig
    const globalUploadConfig = (globalConfig.upload || {}) as IUploadConfig
    const globalApis = (globalConfig.apis || {}) as Record<string, any>

    // 1. accept 处理
    const rawAccept =
      typeProp.accept ??
      commonProp.accept ??
      globalTypeConfig.accept ??
      globalUploadConfig.accept ??
      options?.defaultAccept

    const acceptTypes = Array.isArray(rawAccept)
      ? rawAccept
      : typeof rawAccept === 'string'
        ? rawAccept
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []

    // 2. maxSize 处理
    const maxSize =
      typeProp.maxSize ??
      commonProp.maxSize ??
      globalTypeConfig.maxSize ??
      globalUploadConfig.maxSize ??
      options?.defaultMaxSize

    // 3. action / headers / data 处理
    const action =
      typeProp.action ??
      commonProp.action ??
      globalTypeConfig.action ??
      globalUploadConfig.action

    const headers = {
      ...(globalUploadConfig.headers ?? {}),
      ...(globalTypeConfig.headers ?? {}),
      ...(commonProp.headers ?? {}),
      ...(typeProp.headers ?? {}),
    }

    const data =
      typeProp.data ??
      commonProp.data ??
      globalTypeConfig.data ??
      globalUploadConfig.data

    // 4. beforeUpload 校验
    const beforeUpload =
      typeProp.beforeUpload ??
      commonProp.beforeUpload ??
      globalTypeConfig.beforeUpload ??
      globalUploadConfig.beforeUpload

    // 5. 结果转换函数
    const transformResult =
      typeProp.transformFileItem ??
      commonProp.transformFileItem ??
      globalTypeConfig.transformFileItem ??
      globalUploadConfig.transformFileItem ??
      globalConfig.transformFileItem ??
      globalConfig.transformRequestRes

    // 6. 各 API 接口合并
    const apis: ResolvedEditorUploadApis = {
      fileUploadSingle:
        typeProp.uploadApis?.fileUploadSingle ??
        commonProp.uploadApis?.fileUploadSingle ??
        globalTypeConfig.uploadApis?.fileUploadSingle ??
        globalUploadConfig.uploadApis?.fileUploadSingle ??
        globalApis.fileUploadSingle,
      fileUploadMulti:
        typeProp.uploadApis?.fileUploadMulti ??
        commonProp.uploadApis?.fileUploadMulti ??
        globalTypeConfig.uploadApis?.fileUploadMulti ??
        globalUploadConfig.uploadApis?.fileUploadMulti ??
        globalApis.fileUploadMulti,
      fileDel:
        typeProp.uploadApis?.fileDel ??
        commonProp.uploadApis?.fileDel ??
        globalTypeConfig.uploadApis?.fileDel ??
        globalUploadConfig.uploadApis?.fileDel ??
        globalApis.fileDel,
      fileDownload:
        typeProp.uploadApis?.fileDownload ??
        commonProp.uploadApis?.fileDownload ??
        globalTypeConfig.uploadApis?.fileDownload ??
        globalUploadConfig.uploadApis?.fileDownload ??
        globalApis.fileDownload,
      getPreviewUrl:
        typeProp.uploadApis?.getPreviewUrl ??
        commonProp.uploadApis?.getPreviewUrl ??
        globalTypeConfig.uploadApis?.getPreviewUrl ??
        globalUploadConfig.uploadApis?.getPreviewUrl ??
        globalApis.getPreviewUrl,
      getFilePreviewUrl:
        typeProp.uploadApis?.getFilePreviewUrl ??
        commonProp.uploadApis?.getFilePreviewUrl ??
        globalTypeConfig.uploadApis?.getFilePreviewUrl ??
        globalUploadConfig.uploadApis?.getFilePreviewUrl ??
        globalApis.getFilePreviewUrl ??
        typeProp.uploadApis?.getPreviewUrl ??
        commonProp.uploadApis?.getPreviewUrl ??
        globalApis.getPreviewUrl,
    }

    const accessToken =
      globalConfig.access_token ??
      props.accessToken ??
      props.access_token

    return {
      accept: typeof rawAccept === 'string' ? rawAccept : undefined,
      acceptTypes,
      maxSize,
      action,
      headers,
      data,
      beforeUpload,
      transformResult,
      apis,
      accessToken,
    }
  })

  return {
    resolvedConfig,
    speedEditorGlobalConfig,
    speedTiptapProps: speedTiptapConfig,
  }
}
