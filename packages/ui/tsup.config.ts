import { defineLibConfig } from '../../tools/tsup.lib'

export default defineLibConfig({
  external: ['vue', 'ant-design-vue', '@speed-editor/shared', '@speed-editor/composables'],
})
