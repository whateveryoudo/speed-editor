import { defineLibConfig } from '../../tools/tsup.lib'

export default defineLibConfig({
  external: ['vue', '@vueuse/core', '@tiptap/core', 'lodash-es', /^@speed-editor\//],
})
