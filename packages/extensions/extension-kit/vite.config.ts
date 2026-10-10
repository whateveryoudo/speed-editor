import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from '@unocss/vite'
import { defineConfig } from 'vite'

const dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue(), vueJsx(), UnoCSS()],
  resolve: {
    alias: {
      '@ek': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(dirname, 'src/index.ts'),
        style: resolve(dirname, 'src/style.ts'),
      },
      name: 'SpeedTiptapExtensionKit',
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [
        'vue',
        'ant-design-vue',
        '@ant-design/icons-vue',
        'lodash-es',
        'axios',
        /^@tiptap\//,
        /^@floating-ui\//,
        '@speed-editor/shared',
        '@speed-editor/composables',
        '@speed-editor/schema',
        'speed-components-ui/components',
        'es-drager',
        'yjs',
        'y-protocols',
        'lib0',
        '@tiptap/y-tiptap',
        '@hocuspocus/provider',
      ],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css'
          return assetInfo.name ?? 'asset'
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
