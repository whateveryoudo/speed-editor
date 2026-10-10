import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from '@unocss/vite'
import { defineConfig, type PluginOption, type UserConfig } from 'vite'

export interface VueLibConfigOptions {
  /** 启用 UnoCSS，需在 src/index.ts 中 import 'uno.css' */
  unocss?: boolean
}

export function createVueLibConfig(
  dirname: string,
  overrides: UserConfig = {},
  options: VueLibConfigOptions = {},
): UserConfig {
  const { build: buildOverride, plugins: pluginsOverride, ...rest } = overrides

  const plugins: PluginOption[] = [vue(), vueJsx()]
  if (options.unocss) {
    plugins.push(UnoCSS())
  }
  if (pluginsOverride) {
    plugins.push(...(Array.isArray(pluginsOverride) ? pluginsOverride : [pluginsOverride]))
  }

  return defineConfig({
    plugins,
    build: {
      lib: {
        entry: resolve(dirname, 'src/index.ts'),
        name: 'SpeedTiptapEditor',
        formats: ['es'],
        fileName: 'index',
      },
      cssCodeSplit: options.unocss ? false : undefined,
      rollupOptions: {
        external: [
          'vue',
          /^@speed-editor\//,
          /^@tiptap\//,
          'ant-design-vue',
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
        ...buildOverride?.rollupOptions,
      },
      sourcemap: true,
      emptyOutDir: true,
      ...buildOverride,
    },
    ...rest,
  })
}
