/*
 * 编辑器侧 Image：schema 契约 + 上传命令 / Vue NodeView
 */
import { Image as SchemaImage } from '@speed-editor/schema'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageWrapper from './Wrapper.vue'
import { v4 as uuidv4 } from 'uuid'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      uploadImage: (files: any, pos?: number) => ReturnType
      getTempFile: (fileId: string) => ReturnType
      removeTempFile: (fileId: string) => ReturnType
    }
  }
}

export const Image = SchemaImage.extend({
  addStorage() {
    return {
      tempFileMap: new Map<string, File>(),
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      uploadImage:
        (files: any) =>
        ({ chain, editor }) => {
          const fileList = files?.length ? files : [files]
          if (fileList.length === 0) return false
          const imageNodes: any[] = []
          Array.from(fileList).forEach((file: any) => {
            const tempFileId = `temp-file-${uuidv4()}`
            editor.storage.image.tempFileMap.set(tempFileId, file)
            imageNodes.push({
              type: this.name,
              attrs: { src: '', tempFileId },
            })
          })
          return chain().insertContent(imageNodes).run()
        },
      removeTempFile:
        (tempFileId: string) =>
        ({ editor }) => {
          editor.storage.image.tempFileMap.delete(tempFileId)
          return false
        },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageWrapper as any)
  },
})
