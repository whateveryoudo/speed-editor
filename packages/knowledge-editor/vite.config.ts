import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createVueLibConfig } from '../../tools/vite.lib'

const dirname = fileURLToPath(new URL('.', import.meta.url))

export default createVueLibConfig(dirname, {
  build: {
    lib: {
      entry: {
        index: resolve(dirname, 'src/index.ts'),
        style: resolve(dirname, 'src/style.ts'),
        plugin: resolve(dirname, 'src/plugin-entry.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: (id) => {
        // CSS 不 external → 合并进 knowledge-editor/dist/style.css
        if (id.endsWith('.css') || id.includes('.css?')) {
          return false
        }
    
        if (id === 'vue') return true
        if (id.startsWith('@speed-editor/base-editor')) return true
        if (id.startsWith('@speed-editor/collaboration-editor')) return true
        if (id.startsWith('@speed-editor/shared')) return true
        if (id.startsWith('@speed-editor/kit-base')) return true
        if (id.startsWith('@speed-editor/extension-kit')) return true
        if (/^@speed-editor\/extension-/.test(id)) return true
    
        return false
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'style.css'
          return assetInfo.name ?? 'asset'
        },
      },
    },
  },
})
