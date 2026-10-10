/*
 * 编辑器侧 Attachment：schema 契约 + 上传命令 / Vue NodeView
 */
import { Attachment as SchemaAttachment } from '@speed-editor/schema'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import Wrapper from './Wrapper.vue'
import { Editor } from '@tiptap/core'
import { v4 as uuidv4 } from 'uuid'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    attachment: {
      uploadAttachment: (files?: any, pos?: number) => ReturnType
      downloadAttachment: (fileId?: string) => ReturnType
      updateAttachmentAttributes: (attrs: Record<string, any>) => ReturnType
    }
  }
}

export const Attachment = SchemaAttachment.extend({
  addStorage() {
    return {
      tempFileMap: new Map<string, File>(),
    }
  },

  addCommands() {
    return {
      uploadAttachment:
        (files: any, pos?: number) =>
        ({ editor, tr }) => {
          const fileList = files?.length ? files : [files]
          if (fileList.length === 0) return false
          Array.from(fileList).forEach((file) => {
            const tempFileId = `temp-file-${uuidv4()}`
            editor.storage.attachment.tempFileMap.set(tempFileId, file)
            const node = this.type.create({ fileId: '', tempFileId })
            tr.insert(pos || tr.selection.from, node)
          })

          return true
        },

      downloadAttachment:
        (fileId?: string) =>
        ({ editor }: { editor: Editor }) => {
          editor.emit('attachment:download', { fileId })
          return true
        },
      removeTempFile:
        (tempFileId: string) =>
        ({ editor }: { editor: Editor }) => {
          editor.storage.attachment.tempFileMap.delete(tempFileId)
          return false
        },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(Wrapper as any)
  },
})
