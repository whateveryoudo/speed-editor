import type { SpeedEditorPlugin } from '@speed-tiptap-editor/shared'
import type { Component } from 'vue'

import InsertPopover from './menus/insert/popover.tsx'
import Undo from './menus/undo.vue'
import Redo from './menus/redo.vue'
import FormatPainter from './menus/formatPainter.vue'
import ClearNodeAndMarks from './menus/clearNodeAndMarks.vue'
import Bold from './menus/bold.vue'
import Italic from './menus/italic.vue'
import Underline from './menus/underline.vue'
import Strike from './menus/strike.vue'
import Link from './menus/link/index.vue'
import Heading from './menus/heading.vue'
import FontFamily from './menus/fontFamily.vue'
import FontSize from './menus/fontSize.vue'
import TextColor from './menus/textColor.vue'
import BackgroundColor from './menus/backgroundColor.vue'
import Align from './menus/align'
import MoreText from './menus/moreText.vue'
import BulletList from './menus/bulletList.vue'
import OrderedList from './menus/orderedList.vue'
import TaskList from './menus/taskList.vue'
import BlockQuote from './menus/blockQuote.vue'
import HorizontalRule from './menus/horizontalRule.vue'
import Emoji from './menus/emoji.vue'
import Indent from './menus/indent.vue'
import FindAndReplace from './menus/findAndReplace.vue'
import Table from './menus/insert/table.tsx'
import Image from './menus/insert/image.vue'
import File from './menus/insert/file.vue'

import TextMenu from './bubbleMenus/textMenu/index.vue'
import ImageMenu from './bubbleMenus/imageMenu/index.vue'
import TableMenu from './bubbleMenus/tableMenu/index.vue'
import TableBubbleMenu from './bubbleMenus/tableMenu/Bubble.vue'
import AttachmentMenu from './bubbleMenus/attachmentMenu/index.vue'
import TagMenu from './bubbleMenus/tagMenu/index.vue'
import CalloutMenu from './bubbleMenus/calloutMenu/index.vue'
import DragNodeMenu from './bubbleMenus/dragNodeMenu/index.vue'

const toolbarButtons: Record<string, Component> = {
  insert: InsertPopover,
  undo: Undo,
  redo: Redo,
  'format-painter': FormatPainter,
  clearNodeAndMarks: ClearNodeAndMarks,
  bold: Bold,
  italic: Italic,
  heading: Heading,
  fontFamily: FontFamily,
  fontSize: FontSize,
  underline: Underline,
  strike: Strike,
  moreText: MoreText,
  textColor: TextColor,
  backgroundColor: BackgroundColor,
  link: Link,
  align: Align,
  bulletList: BulletList,
  orderedList: OrderedList,
  taskList: TaskList,
  indent: Indent,
  emoji: Emoji,
  blockquote: BlockQuote,
  horizontalRule: HorizontalRule,
  findAndReplace: FindAndReplace,
  table: Table,
  image: Image,
  file: File,
}

/** kit-base 默认 UI 插件：toolbar + bubbleMenus（不含 import/export，由 extension-import-export 提供） */
export function createKitBasePlugin(): SpeedEditorPlugin {
  return {
    name: 'kit-base',
    extensions: [],
    toolbar: toolbarButtons,
    bubbleMenus: {
      text: [TextMenu],
      tag: [TagMenu],
      image: [ImageMenu],
      attachment: [AttachmentMenu],
      table: [TableMenu, TableBubbleMenu],
      callout: [CalloutMenu],
      drag: [DragNodeMenu],
    },
  }
}

export function createKitBasePlugins(): SpeedEditorPlugin[] {
  return [createKitBasePlugin()]
}
