import { defineLibConfig } from '../../../tools/tsup.lib'

export default defineLibConfig({
  external: [/^@speed-editor\//],
})
