import { TextAlign as TiptapTextAlign } from '@tiptap/extension-text-align'

/**
 * Word 粘贴常同时带 align="center" 和 style="text-align: left"。
 * 官方扩展只认 style，会提前落到 left；这里优先读 align 属性。
 */
export const TextAlign = TiptapTextAlign.extend({
  addGlobalAttributes() {
    const alignments = this.options.alignments

    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => {
              const fromAttr = (element.getAttribute('align') || '').toLowerCase()
              if (alignments.includes(fromAttr)) {
                return fromAttr
              }
              const fromStyle = (element.style?.textAlign || '').toLowerCase()
              if (alignments.includes(fromStyle)) {
                return fromStyle
              }
              return this.options.defaultAlignment
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign) {
                return {}
              }
              return {
                style: `text-align: ${attributes.textAlign}`,
              }
            },
          },
        },
      },
    ]
  },
})
