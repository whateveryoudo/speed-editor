import { getKnowledgeKit } from '@speed-editor/extension-kit'
import type { EditorLayoutConfig } from '@speed-editor/shared'

export const knowledgeLayout: EditorLayoutConfig = {
  name: 'knowledge',
  getExtensions: (props) => getKnowledgeKit(props) as never,
  toolbar: [
    'insert',
    '|',
    'undo', 'redo', 'format-painter', 'clearNodeAndMarks',
    '|',
    'heading', 'fontFamily', 'fontSize',
    '|',
    'bold', 'italic', 'underline', 'strike', 'moreText',
    '|',
    'textColor', 'backgroundColor',
    '|',
    'link',
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
    '|',
    'findAndReplace',
    // 这里去掉（放后端，当前document-io包就不导入了（会在后端实现，减少体积 大小））
    // '|'
    // 
    // 'import',
    // 'export',
  ],
  bubbleMenus: ['text', 'tag', 'image', 'attachment', 'table', 'callout', 'drag'],
  features: {
    hasTitle: true,
    hasDragHandle: true,
    contentMode: 'json',
    showDocumentSuggest: true,
    showSearchReplace: true,
  },
}

/** @deprecated 使用 knowledgeLayout */
export const knowledgePreset = knowledgeLayout
