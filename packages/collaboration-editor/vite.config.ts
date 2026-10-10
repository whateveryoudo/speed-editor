import { fileURLToPath } from 'node:url'
import { createVueLibConfig } from '../../tools/vite.lib'

export default createVueLibConfig(fileURLToPath(new URL('.', import.meta.url)), {
  build: {
    rollupOptions: {
      external: [
        'vue',
        '@speed-editor/base-editor',
        '@speed-editor/shared',
        '@hocuspocus/provider',
        '@tiptap/core',
        '@tiptap/extension-collaboration',
        '@tiptap/extension-collaboration-caret',
        '@tiptap/pm',
        '@tiptap/y-tiptap',
        'yjs',
        'y-protocols',
        'lib0',
      ],
    },
  },
})
