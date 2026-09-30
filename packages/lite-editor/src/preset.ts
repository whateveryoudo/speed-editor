import { getLiteKit } from '@speed-tiptap-editor/extension-kit'
import type { EditorLayoutConfig } from '@speed-tiptap-editor/shared'

export const liteLayout: EditorLayoutConfig = {
  name: 'lite',
  getExtensions: (props) => getLiteKit(props) as never,
  toolbar: [
    'undo', 'redo', 'format-painter', 'clearNodeAndMarks',
    '|',
    'heading', 'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strike',
    '|',
    'textColor', 'backgroundColor',
    '|',
    'image',
    'file',
    'table',
    '|',
    'align',
    '|',
    'bulletList', 'orderedList', 'taskList',
    '|',
    'indent',
    '|',
    'emoji',
    '|',
    'blockquote', 'horizontalRule',
  ],
  bubbleMenus: ['text', 'image', 'attachment', 'table', 'callout'],
  features: {
    hasTitle: false,
    hasDragHandle: false,
    contentMode: 'html',
    showDocumentSuggest: false,
    showSearchReplace: false,
  },
}

/** @deprecated 使用 liteLayout */
export const litePreset = liteLayout
