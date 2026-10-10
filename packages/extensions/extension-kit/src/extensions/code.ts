/*
 * @Author: ykx
 * @Date: 2022-11-24 17:30:01
 * @LastEditTime: 2022-11-24 17:34:12
 * @LastEditors: your name
 * @Description:
 * @FilePath: \we-knowledge-base\src\tiptap\core\extensions\code.ts
 */
import { EXTENSION_PRIORITY_LOWER } from '@speed-editor/shared'
import BuiltInCode from '@tiptap/extension-code'

export const Code = BuiltInCode.extend({
  excludes: undefined,
  /**
   * Reduce the rendering priority of the code mark to
   * ensure the bold, italic, and strikethrough marks
   * are rendered first.
   */
  priority: EXTENSION_PRIORITY_LOWER,
})
