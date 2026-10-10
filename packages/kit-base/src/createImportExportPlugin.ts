import type { SpeedEditorPlugin } from '@speed-editor/shared'
import Import from './menus/import/index.vue'
import Export from './menus/export/index.vue'

export function createImportExportPlugin(): SpeedEditorPlugin {
  return {
    name: 'import-export',
    extensions: [{ type: 'importExport' }],
    toolbar: {
      import: Import,
      export: Export,
    },
  }
}
