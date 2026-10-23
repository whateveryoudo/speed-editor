/*
 * @Author: ykx
 * @Date: 2022-11-11 15:38:08
 * @LastEditTime: 2022-11-11 16:07:07
 * @LastEditors: your name
 * @Description: 
 * @FilePath: \we-knowledge-base\src\tiptap\prose-utils\copy-node.ts
 */
import { Editor } from '@tiptap/core';
import { copy } from '@ek/helpers/copy-to-clipboard';
import { safeJSONStringify } from '@ek/helpers/json';
import { Fragment, Node } from '@tiptap/pm/model';

function debug(run: () => void) {
  if (typeof window !== 'undefined' && window.location?.search?.includes('dev=1')) {
    run();
  }
}

export function copyNode(nodeOrNodeName: Node | Fragment<any>, editor: Editor);
export function copyNode(nodeOrNodeName: string, editor: Editor);
export function copyNode(nodeOrNodeName: string | Node | Fragment<any>, editor: Editor) {
  let targetNode = null;
  if (typeof nodeOrNodeName === 'string') {
    const { state } = editor;
    const $pos = state.selection.$anchor;
    // @ts-ignore
    const currentNode = state.selection.node;

    if (currentNode && currentNode.type.name === nodeOrNodeName) {
      targetNode = currentNode;
    } else {
      if ($pos.depth) {
        for (let d = $pos.depth; d > 0; d--) {
          const node = $pos.node(d);
          if (node.type.name === nodeOrNodeName) {
            targetNode = node;
          }
        }
      }
    }
  } else {
    targetNode = nodeOrNodeName;
  }

  if (targetNode) {
    const toCopy = [{ text: safeJSONStringify(targetNode.toJSON()), format: 'text/node' }];

    if (targetNode.textContent) {
      toCopy.push({ text: targetNode.textContent, format: 'text/plain' });
    }

    try {
      const { markdownToHTML, prosemirrorToMarkdown } = editor.extensionStorage['paste'];
      const markdown = prosemirrorToMarkdown({ content: Fragment.from(targetNode) });
      toCopy.push({ text: markdown, format: 'text/markdown' });
      const html = markdownToHTML(markdown);
      toCopy.push({ text: html, format: 'text/html' });
    } catch (e) {
      debug(() => {
        console.group('copy');
        console.error(e.message);
        console.groupEnd();
      });
    }

    debug(() => {
      console.group('copy');
      console.log(toCopy);
      console.groupEnd();
    });

    copy(toCopy);
  }

  return false;
}
