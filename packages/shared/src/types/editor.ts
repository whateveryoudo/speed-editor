import type { CSSProperties, VNode } from 'vue'
import type { BubbleMenuKey } from './preset'

export type ToolBarConfig =
  | string
  | {
      key: string
      title: string
      icon: string | VNode
      options?: ToolBarConfig[]
    }

export interface UserInfo {
  id: number
  username: string
  nickname?: string
  avatar?: string
  color?: string
  [key: string]: unknown
}

export interface IUploadConfig {
  transformFileItem?: (item: unknown) => unknown
  multiple?: boolean
  maxSize?: number
  accept?: string
  action?: string
  headers?: Record<string, string>
  data?: Record<string, unknown> | ((file: File) => Record<string, unknown>)
  beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<boolean>
  uploadApis?: {
    fileDownload?: () => Promise<string>
    fileUploadSingle?: (file: File) => Promise<string>
    fileUploadMulti?: (files: File[]) => Promise<string[]>
    fileDel?: (fileId: string) => Promise<boolean>
    getPreviewUrl?: (fileId: string) => string
    getFilePreviewUrl?: (fileId: string) => string
    [key: string]: any
  }
}

export interface CollaborationUser {
  id: string | number
  username: string
  nickname?: string
  avatar?: string
  color?: string
  [key: string]: unknown
}

export interface CollaborationConfig {
  documentId: string
  url: string
  token: string
  user: CollaborationUser
}

/** SpeedEditor 壳层 props（无 yjs / provider，协同由 collaboration-editor 注入 extraExtensions） */
export interface SpeedEditorShellProps {
  theme?: 'light' | 'dark'
  antdToken?: Record<string, unknown>
  editorStyle?: CSSProperties
  headerStyle?: CSSProperties
  mainStyle?: CSSProperties
  /**
   * 页面式内容宽度（居中留白，参考 knowledge 正文区）。
   * 仅样式，不改变 preset（lite / knowledge）。
   */
  pageLayout?: boolean
  hideBorder?: boolean
  content?: string
  json?: string | null | Record<string, unknown>
  title?: string
  docId?: string
  docType?: 'document' | 'template'
  editable?: boolean
  menubar?: boolean
  hideComment?: boolean
  placeholder?: string
  toolbarKeys?: ToolBarConfig[]
  excludeKeys?: string[]
  /** 快捷插入浮层（/ 唤起）排除的项，如 ['common&image', 'common&file'] 或 ['image', 'file'] */
  quickInsertExcludeKeys?: string[]
  bubbleMenus?: BubbleMenuKey[]
  upload?: IUploadConfig
  image?: IUploadConfig
  file?: IUploadConfig
  fontSize?: {
    default?: string
    options?: { value: string; label: string }[]
  }
  fontFamily?: {
    default?: string
    options?: { value: string; label: string }[]
  }
  textBubbleMenu?: {
    enabled?: boolean
    items?: (
      | {
          icon: string
          title: string
          action?: (editor: unknown) => void
        }
      | string
    )[]
  }
  ai?: {
    doubao?: {
      url: string
      header?: Record<string, unknown>
      bodyParams?: (
        action: string,
        content: string,
        customPrompt: string,
      ) => Record<string, unknown>
    }
  }
  mentionUserFetch?: (query: string) => Promise<unknown[]>
  documentSuggestConfig?: { rules?: unknown[] }
  sdComponentsConfig?: {
    apis?: Record<string, unknown>
    transformRequestRes?: (res: unknown) => unknown
  }
  searchReplace?: SearchReplaceConfig
}

export interface SearchReplaceConfig {
  /** 是否启用查找替换（默认在支持的预设中为 true，如设为 false 则隐藏弹窗并不拦截快捷键） */
  enabled?: boolean
  /** 是否拦截并启用快捷键 Ctrl/Cmd + F，默认跟随 enabled */
  shortcut?: boolean
  /** 自定义弹窗样式（如设置 top, right 等） */
  style?: Record<string, string | number>
}

/** @deprecated 迁移期别名，请用 SpeedEditorShellProps */
export type CollaborationEditorProps = SpeedEditorShellProps

/** CollaborativeEditor 额外 props */
export interface CollaborativeShellProps extends SpeedEditorShellProps {
  collaborationConfig?: CollaborationConfig
}
