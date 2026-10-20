/*
 * @Author: ykx
 * @Date: 2022-11-30 19:41:03
 * @LastEditTime: 2022-11-30 19:41:05
 * @LastEditors: your name
 * @Description: 
 * @FilePath: \we-knowledge-base\src\tiptap\core\extensions\blockquote.ts
 */
import { wrappingInputRule } from '@tiptap/core';
import { Blockquote as BuiltInBlockquote } from '@tiptap/extension-blockquote';
import { getParents } from '@ek/prose-utils';

export const Blockquote = BuiltInBlockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      multiline: {
        default: false,
        parseHTML: (element) => {
          const parentsIncludeBlockquote = getParents(element).some((p) => p.nodeName.toLowerCase() === 'blockquote');
          return !parentsIncludeBlockquote;
        },
      },
    };
  },
  addInputRules() {
    const multilineInputRegex = /^\s*>>>\s$/gm;
    return [
      // eslint-disable-next-line no-unsafe-optional-chaining
      ...this.parent?.(),
      wrappingInputRule({
        find: multilineInputRegex,
        type: this.type,
        getAttributes: () => ({ multiline: true }),
      }),
    ];
  },
});
