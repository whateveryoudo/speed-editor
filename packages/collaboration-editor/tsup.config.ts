import { defineLibConfig } from '../../tools/tsup.lib'

export default defineLibConfig({
  external: [
    'vue',
    'yjs',
    '@hocuspocus/provider',
    '@tiptap/core',
    '@tiptap/extension-collaboration',
    '@tiptap/extension-collaboration-caret',
    '@speed-editor/shared',
  ],
})
