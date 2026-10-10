import type { SpeedEditorPlugin } from '@speed-editor/shared'
import SearchReplaceModal from './overlays/SearchReplaceModal.vue'

export function createSearchReplacePlugin(): SpeedEditorPlugin {
  return {
    name: 'search-replace',
    extensions: [],
    overlays: [SearchReplaceModal],
  }
}
