/*
 * @Author: ykx
 * @Date: 2022-11-11 14:30:33
 * @LastEditTime: 2023-01-09 10:05:11
 * @LastEditors: your name
 * @Description: Tiptap 3.0 扩展配置
 *
 * 分层约定：
 * - 会进文档 JSON、服务端 generateHTML 需要的 Node/Mark attrs → @speed-tiptap-editor/schema
 * - 有 Vue NodeView 的：schema 无 UI 版 + 本包 extend 挂 View/命令/快捷键
 * - 纯交互（搜索、格式刷、QuickInsert、FileHandler 等）→ 仅本包
 */

// 基础扩展
import { Title } from "./title";
import { Document as BaseDocument } from "./document";
import { Paragraph } from "./paragraph";
import { Image } from "./image";
import { Attachment } from "./attachment";
import { Placeholder, Focus } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "./link";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontSize } from "./fontSize";
import { FontFamily } from "./fontFamily";
import { Color } from "@tiptap/extension-color";
import { BackgroundColor } from "./backgroundColor";
import FileHandler from "./fileHandler";
import { Code } from "./code";
import { Parse } from "./parse";
import { Loading } from "./loading";
import { QuickInsert } from "./quickInsert";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Blockquote } from "./blockquote";
import { Emoji } from "@tiptap/extension-emoji";
import { TextAlign } from "./textAlign";
import { Tag } from "./tag";
import { Mind } from "./mind";
import { Mention } from "./mention";
import { getMentionSuggestion } from "./mention/suggestion";
import { CodeBlock } from "./codeBlock";
import { Callout } from "./callout";
import { Table, TableRow, TableHeader, TableCell } from "@speed-tiptap-editor/schema";
import { TaskList } from "./taskList";
import { TaskItem } from "@tiptap/extension-list";
import { Indent } from "./indent";
import { SearchAndReplace } from "./searchAndReplace";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { FormatPainter } from "./formatPainter";
import {
  DocumentSuggest,
  type Suggestion as DocumentSuggestion,
} from "./documentSuggest";
import { Decoration } from "@tiptap/pm/view";
import { ref } from "vue";

// 用于 DocumentSuggest 扩展与 Vue 组件之间共享 tooltip 容器
export const tooltipElement = ref<{
  element: HTMLElement;
  suggestion: DocumentSuggestion;
  ruleTitle: string;
} | null>(null);
const DocumentWithHeading = BaseDocument.extend({
  content: "title block+",
});

const placeholders = [
  "输入 / 唤起更多",
  // '使用 markdown 语法进行输入',
  "输入 @ 来提及他人",
  "输入 : 来插入表情",
  // '你知道吗？输入 $katex 然后在输入一个 $ 就可以快速插入数学公式，其他节点操作类似哦',
];

// 默认文档（无 title）
export const getDefaultKit = (props: any) => [
  // 使用 StarterKit 作为基础，禁用需要自定义的扩展
  StarterKit.configure({
    // 禁用一些扩展，因为我们要使用自定义版本
    document: false,
    paragraph: false,
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    link: false,
    // 协同由 Yjs 管理历史，不能与本地 undoRedo 并存
    undoRedo: props.collaborationMode ? false : undefined,
    // 保留 StarterKit 中的其他扩展
    // bold, italic, strike, underline, link, heading, hardBreak, text
    // bulletList, orderedList, listItem, dropcursor, gapcursor, undoRedo, listKeymap, trailingNode
  }),
  // 自定义扩展（带 NodeView 的已从 schema extend）
  Paragraph,
  Link,
  Placeholder.configure({
    placeholder: ({ node, editor, pos, hasAnchor }) => {
      if (node.type.name === "title") {
        return editor.isEditable ? "请输入标题" : "未命名文档";
      }
      if (["codeBlock", "callout"].includes(node.type.name)) {
        return "";
      }

      if (!editor.isEditable) return "";
      // 这里不使用随机，比如选择颜色就会又执行这个方法导致placeholder一直变化
      return props.placeholder;
    },
    showOnlyCurrent: false,
    showOnlyWhenEditable: false,
  }),
  Focus,
  Image.extend({
    draggable: false,
  }).configure({
    HTMLAttributes: {
      crossOrigin: "anonymous",
    },
  }),
  Attachment,
  FileHandler,
  BaseDocument, // 用普通的 document
  TextStyle.extend({
    priority: 1000,
  }),
  FontSize,
  FontFamily,
  Color,
  BackgroundColor,
  Mind,
  CodeBlock,
  Callout,
  Code,
  Loading,
  QuickInsert,
  HorizontalRule,
  Blockquote,
  Emoji,
  Parse,
  // 这里传入自定义请求
  Mention.configure({
    HTMLAttributes: {
      class: "mention",
    },
    suggestion: getMentionSuggestion({
      mentionUserFetch: props.mentionUserFetch,
    }),
  }),
  FormatPainter,
  // 开源 替换 搜索插件
  SearchAndReplace.configure({
    searchResultClass: "speed-tiptap-search-result",
    disableRegex: true,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  // 这里没使用tableKit,要扩展tableCell属性
  Table.configure({
    resizable: true,
    handleWidth: 5,
    lastColumnResizable: false,
  }),
  TableRow,
  TableHeader,
  TableCell,
  TaskList,
  TaskItem,
  Indent.configure({
    types: ["paragraph", "heading", "listItem"],
    minIndent: 0,
    maxIndent: 8,
  }),
  Superscript,
  Subscript,
  Tag,
];

/** 简易富文本扩展集：不含脑图、流程图、查找替换、标签等重型能力 */
export const getLiteKit = (props: any) =>
  getDefaultKit(props).filter(
    (ext) =>
      ext &&
      !['mind', 'searchAndReplace', 'tag'].includes(
        ext.name as string,
      ),
  );

// 知识库
export const getKnowledgeKit = (props: any) => [
  Title,
  DocumentWithHeading, // 用带 title 的 document
  DocumentSuggest.configure({
    backendUrl: "http://localhost:8010/api/v1/ai/document/check",
    rules: props.documentSuggestConfig?.rules || [],
    // 自定义装饰器
    getCustomSuggestionDecoration({
      suggestion,
      allSuggestions,
      ruleTitle,
      isSelected,
      range,
      getDefaultDecorations,
    }: {
      suggestion: DocumentSuggestion;
      allSuggestions: DocumentSuggestion[];
      ruleTitle: string;
      isSelected: boolean;
      range: { from: number; to: number };
      getDefaultDecorations: () => Decoration[];
    }) {
      // 如果当前 tooltip 关联的 suggestion 已经不在列表中（如被拒绝/全部应用），主动清空 tooltip
      if (
        tooltipElement.value &&
        !allSuggestions.some(
          (s) => s.id === tooltipElement.value!.suggestion.id,
        )
      ) {
        tooltipElement.value = null;
        return [];
      }
      const decorations = getDefaultDecorations();
      if (isSelected) {
        decorations.push(
          Decoration.widget(range.to, () => {
            const element = document.createElement("span");
            // 选中时，更新 tooltipElement
            tooltipElement.value = { element, suggestion, ruleTitle };
            return element;
          }),
        );
      } else {
        // 如果当前取消选中的正好是 tooltip 上那条，清空 tooltip
        if (tooltipElement.value?.suggestion?.id === suggestion.id) {
          tooltipElement.value = null;
        }
      }

      return decorations;
    },
  }),
  ...getDefaultKit(props).filter(
    (ext) => ext?.name !== "doc" && ext?.name !== "mind",
  ),
];
