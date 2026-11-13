import { fileURLToPath } from 'node:url'
import { createVueLibConfig } from '../../../tools/vite.lib'

export default createVueLibConfig(fileURLToPath(new URL('.', import.meta.url)), {
  build: {
    rollupOptions: {
      external: [
        'vue',
        'ant-design-vue',
        '@ant-design/icons-vue',
        '@speed-editor/shared',
        '@speed-editor/composables',
        '@speed-editor/schema',
        '@tiptap/core',
        '@tiptap/vue-3',
        '@tiptap/pm',
        '@speed-board/core',
        '@speed-board/vue3-antd',
      ],
    },
  },
})
