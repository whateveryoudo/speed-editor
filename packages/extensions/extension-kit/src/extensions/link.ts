/*
 * 编辑器侧 Link：schema 契约 + Markdown 输入规则
 */
import { markInputRule } from '@tiptap/core'
import { Link as SchemaLink } from '@speed-editor/schema'

const extractHrefFromMatch = (match: any) => {
  return { href: match.groups.href }
}

export const extractHrefFromMarkdownLink = (match: any) => {
  /**
   * Removes the last capture group from the match to satisfy
   * tiptap markInputRule expectation of having the content as
   * the last capture group in the match.
   *
   * https://github.com/ueberdosis/tiptap/blob/%40tiptap/core%402.0.0-beta.75/packages/core/src/inputRules/markInputRule.ts#L11
   */
  match.pop()
  return extractHrefFromMatch(match)
}

export const Link = SchemaLink.extend({
  addInputRules() {
    // 支持 Markdown 链接语法: [文本](链接)
    const markdownLinkSyntaxInputRuleRegExp =
      /(?:^|\s)\[([\w|\s|-|\u4e00-\u9fa5]+)\]\((?<href>.+?)\)$/gm

    return [
      markInputRule({
        find: markdownLinkSyntaxInputRuleRegExp,
        type: this.type,
        getAttributes: extractHrefFromMarkdownLink,
      }),
    ]
  },
}).configure({
  openOnClick: true,
  linkOnPaste: true,
  autolink: true,
})
