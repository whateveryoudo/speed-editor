import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@speed-editor/base-editor/style.css'
import '@speed-editor/knowledge-editor/style.css'
import SpeedTiptapEditor from '@speed-editor/base-editor/plugin'
import App from './App.vue'

// 本地内存文件存储（用于 Demo 环境免后端上传与下载）
export const localFileStore = new Map<string, { file: File | { name: string }; url: string }>()

// 预塞一个初始演示附件
localFileStore.set('mock_demo_doc', {
  file: { name: 'Speed-Knowledge-架构设计说明.docx' },
  url: '',
})

const mockApis = {
  // 单文件上传（图片或附件）
  fileUploadSingle: async (formData: FormData) => {
    const file = (formData.get('file') as File) || (formData.get('files') as File)
    if (!file) throw new Error('未获取到文件')

    const fileId = 'mock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
    const blobUrl = URL.createObjectURL(file)
    localFileStore.set(fileId, { file, url: blobUrl })

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'file'

    return {
      success: true,
      code: 200,
      message: '上传成功',
      data: {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: ext,
        url: blobUrl,
      },
    }
  },

  // 多文件上传
  fileUploadMulti: async (formData: FormData) => {
    const files = (formData.getAll('files[]') as File[]).length
      ? (formData.getAll('files[]') as File[])
      : [(formData.get('file') as File)].filter(Boolean)

    const results = files.map((file) => {
      const fileId = 'mock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
      const blobUrl = URL.createObjectURL(file)
      localFileStore.set(fileId, { file, url: blobUrl })
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'file'
      return {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: ext,
        url: blobUrl,
      }
    })

    return {
      success: true,
      code: 200,
      data: results,
    }
  },

  // 附件下载（自动触发浏览器下载本地生成文件）
  fileDownload: async (fileId: string) => {
    const record = localFileStore.get(fileId)
    if (record && record.url) {
      const a = document.createElement('a')
      a.href = record.url
      a.download = record.file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      alert(`当前为示例附件（${record?.file?.name || fileId}），你可以在工具栏点击“附件”上传自己的文件体验真实下载！`)
    }
    return true
  },

  // 附件在线预览（跳转到 OnlyOffice 生产环境说明页）
  getFilePreviewUrl: (fileId: string) => {
    const record = localFileStore.get(fileId)
    const fileName = record?.file?.name || '演示文档.docx'
    const isProd = import.meta.env.PROD
    const base = isProd ? '/speed-editor/demo/' : '/'
    return `${base}attachment-preview.html?id=${encodeURIComponent(fileId)}&name=${encodeURIComponent(fileName)}`
  },

  // 删除文件
  fileDel: async () => ({ success: true, code: 200 }),
}

const app = createApp(App)
app.use(Antd)
app.use(SpeedTiptapEditor, {
  apis: mockApis,
  transformRequestRes: (res: any) => res,
})
app.mount('#app')
