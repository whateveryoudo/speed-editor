import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { createVueLibConfig } from '../../tools/vite.lib'

const dirname = fileURLToPath(new URL('.', import.meta.url))

export default createVueLibConfig(
  dirname,
  {
    resolve: {
      alias: {
        '@kb': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      lib: {
        entry: {
          index: resolve(dirname, 'src/index.ts'),
          style: resolve(dirname, 'src/style.ts'),
        },
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
          /^@tiptap\//,
          '@floating-ui/dom',
          '@microsoft/fetch-event-source',
          '@vueuse/core',
          '@speed-editor/shared',
          '@speed-editor/composables',
          '@speed-editor/schema',
          'markdown-it',
          'speed-components-ui/components',
          'speed-components-ui/hooks',
        ],
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) return 'style.css'
            return assetInfo.name ?? 'asset'
          },
        },
      },
    },
  },
  { unocss: true },
)
