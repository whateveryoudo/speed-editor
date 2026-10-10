import {
  type ComputePositionConfig,
  type VirtualElement,
  computePosition,
} from "@floating-ui/dom";
import type { Editor } from "@tiptap/core";
// 【解耦说明】：官方源码此处静态引入了 @tiptap/extension-collaboration 和 @tiptap/y-tiptap，
// 用于在协同编辑且鼠标悬停手柄时，处理远端用户改动引起的坐标相对偏移。
// 但由于 kit-base 也是单机版 lite-editor 的底层，若静态导入会导致所有单机业务工程（如后台管理端）
// 被迫安装庞大的 yjs 和 y-protocols peer 依赖。
// 此处改用 ProseMirror 原生 tr.mapping.map(currentNodePos) 处理坐标变动，
// 且鼠标悬停时本身就会在 mousemove 中重新拾取当前节点并重新定位手柄。
// 这样既保留了完整的拖拽手柄功能，又彻底摆脱了 kit-base / lite-editor 对 Yjs 的硬性强依赖。
// import { isChangeOrigin } from "@tiptap/extension-collaboration";
import type { Node } from "@tiptap/pm/model";
import {
  type EditorState,
  type Transaction,
  Plugin,
  PluginKey,
  TextSelection,
} from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
// import {
//   absolutePositionToRelativePosition,
//   relativePositionToAbsolutePosition,
//   ySyncPluginKey,
// } from "@tiptap/y-tiptap";

import { dragHandler } from "./helpers/dragHandler.js";
import { findElementNextToCoords } from "./helpers/findNextElementFromCursor.js";
import { getOuterNode, getOuterNodePos } from "./helpers/getOuterNode.js";
import { removeNode } from "./helpers/removeNode.js";

type PluginState = {
  locked: boolean;
};
export const defaultComputePositionConfig: ComputePositionConfig = {
  placement: "left-start",
  strategy: "absolute",
};
// 【解耦说明】：保留原实现作为注释参考，解耦 Yjs 依赖。
// const getRelativePos = (state: EditorState, absolutePos: number) => {
//   const ystate = ySyncPluginKey.getState(state);
//   if (!ystate) {
//     return null;
//   }
//   return absolutePositionToRelativePosition(
//     absolutePos,
//     ystate.type,
//     ystate.binding.mapping
//   );
// };
// 
// // biome-ignore lint/suspicious/noExplicitAny: y-prosemirror (and y-tiptap by extension) does not have types for relative positions
// const getAbsolutePos = (state: EditorState, relativePos: any) => {
//   const ystate = ySyncPluginKey.getState(state);
//   if (!ystate) {
//     return -1;
//   }
//   return (
//     relativePositionToAbsolutePosition(
//       ystate.doc,
//       ystate.type,
//       relativePos,
//       ystate.binding.mapping
//     ) || 0
//   );
// };

const getOuterDomNode = (view: EditorView, domNode: HTMLElement) => {
  let tmpDomNode = domNode;

  // Traverse to top level node.
  while (tmpDomNode?.parentNode) {
    if (tmpDomNode.parentNode === view.dom) {
      break;
    }

    tmpDomNode = tmpDomNode.parentNode as HTMLElement;
  }

  return tmpDomNode;
};

export interface DragHandlePluginProps {
  pluginKey?: PluginKey | string;
  editor: Editor;
  element: HTMLElement;
  onNodeChange?: (data: {
    editor: Editor;
    node: Node | null;
    pos: number;
  }) => void;
  onElementDragStart?: (e: DragEvent) => void;
  onElementDragEnd?: (e: DragEvent) => void;
  computePositionConfig?: ComputePositionConfig;
  getReferencedVirtualElement?: () => VirtualElement | null;
  onDragStateChange?: (isDragging: boolean) => void;
}

export const dragHandlePluginDefaultKey = new PluginKey("dragHandle");

export const DragHandlePlugin = ({
  pluginKey = dragHandlePluginDefaultKey,
  element,
  editor,
  computePositionConfig,
  getReferencedVirtualElement,
  onNodeChange,
  onElementDragStart,
  onElementDragEnd,
  onDragStateChange,
}: DragHandlePluginProps) => {
  const wrapper = document.createElement("div");
  let locked = false;
  let isDragging = false;
  let currentNode: Node | null = null;
  let currentNodePos = -1;
  // biome-ignore lint/suspicious/noExplicitAny: See above - relative positions in y-prosemirror are not typed
  let currentNodeRelPos: any;
  let rafId: number | null = null;
  let pendingMouseCoords: { x: number; y: number } | null = null;

  function hideHandle() {
    if (!element) {
      return;
    }

    element.style.visibility = "hidden";
    element.style.pointerEvents = "none";
  }

  function showHandle() {
    if (!element) {
      return;
    }

    if (!editor.isEditable) {
      hideHandle();
      return;
    }

    element.style.visibility = "";
    element.style.pointerEvents = "auto";
  }

  function repositionDragHandle(dom: Element) {
    const virtualElement = getReferencedVirtualElement?.() || {
      getBoundingClientRect: () => dom.getBoundingClientRect(),
    };

    computePosition(virtualElement, element, computePositionConfig).then(
      (val) => {
        Object.assign(element.style, {
          position: val.strategy,
          left: `${val.x}px`,
          top: `${val.y}px`,
        });
      }
    );
  }

  function onDragStart(e: DragEvent) {
    isDragging = true;
    onDragStateChange?.(isDragging);
    onElementDragStart?.(e);
    // Push this to the end of the event cue
    // Fixes bug where incorrect drag pos is returned if drag handle has position: absolute
    // @ts-ignore
    dragHandler(e, editor);

    setTimeout(() => {
      if (element) {
        element.style.pointerEvents = "none";
      }
    }, 0);
  }

  function onDragEnd(e: DragEvent) {
    isDragging = false;
    onDragStateChange?.(isDragging);
    onElementDragEnd?.(e);
    hideHandle();
    if (element) {
      element.style.pointerEvents = "auto";
    }
    
    // 拖拽结束时清除文本选择，防止气泡菜单显示
    setTimeout(() => {
      const { state, dispatch } = editor.view;
      // 创建一个空的选择（光标位置）
      const tr = state.tr.setSelection(TextSelection.create(state.doc, state.selection.$anchor.pos));
      dispatch(tr);
    }, 0);
  }

  element.addEventListener("dragstart", onDragStart);
  element.addEventListener("dragend", onDragEnd);

  wrapper.appendChild(element);

  return {
    unbind() {
      element.removeEventListener("dragstart", onDragStart);
      element.removeEventListener("dragend", onDragEnd);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
        pendingMouseCoords = null;
      }
    },
    plugin: new Plugin({
      key: typeof pluginKey === "string" ? new PluginKey(pluginKey) : pluginKey,

      state: {
        init() {
          return { locked: false };
        },
        apply(
          tr: Transaction,
          value: PluginState,
          _oldState: EditorState,
          state: EditorState
        ) {
          const isLocked = tr.getMeta("lockDragHandle");
          const hideDragHandle = tr.getMeta("hideDragHandle");

          if (isLocked !== undefined) {
            locked = isLocked;
          }

          if (hideDragHandle) {
            hideHandle();

            locked = false;
            currentNode = null;
            currentNodePos = -1;

            onNodeChange?.({ editor, node: null, pos: -1 });

            return value;
          }

          // Something has changed and drag handler is visible…
          if (tr.docChanged && currentNodePos !== -1 && element) {
            // 【解耦说明】：官方源码此处原为：
            //   if (isChangeOrigin(tr)) {
            //     const newPos = getAbsolutePos(state, currentNodeRelPos);
            //     ...
            //   } else {
            //     const newPos = tr.mapping.map(currentNodePos);
            //     ...
            //     currentNodeRelPos = getRelativePos(state, currentNodePos);
            //   }
            // 为了让单机版 lite-editor 彻底与 yjs/y-protocols 解耦，不再静态 import 协同库，
            // 此处统一采用 ProseMirror 原生的 tr.mapping.map 进行坐标映射更新。
            // 鼠标悬停时本身也会在 mousemove 中重新拾取当前节点并重新定位手柄。
            const newPos = tr.mapping.map(currentNodePos);

            if (newPos !== currentNodePos) {
              currentNodePos = newPos;
              // 原官方代码：currentNodeRelPos = getRelativePos(state, currentNodePos);
            }
          }

          return value;
        },
      },

      view: (view) => {
        element.draggable = true;
        element.style.pointerEvents = "auto";

        editor.view.dom.parentElement?.appendChild(wrapper);

        wrapper.style.pointerEvents = "none";
        wrapper.style.position = "absolute";
        wrapper.style.top = "0";
        wrapper.style.left = "0";

        return {
          update(_, oldState) {
            if (!element) {
              return;
            }

            if (!editor.isEditable) {
              hideHandle();
              return;
            }

            // Prevent element being draggend while being open.
            if (locked) {
              element.draggable = false;
            } else {
              element.draggable = true;
            }

            // Recalculate popup position if doc has changend and drag handler is visible.
            if (view.state.doc.eq(oldState.doc) || currentNodePos === -1) {
              return;
            }

            // Get domNode from (new) position.
            let domNode = view.nodeDOM(currentNodePos) as HTMLElement;

            // Since old element could have been wrapped, we need to find
            // the outer node and take its position and node data.
            domNode = getOuterDomNode(view, domNode);

            // Skip if domNode is editor dom.
            if (domNode === view.dom) {
              return;
            }

            // We only want `Element`.
            if (domNode?.nodeType !== 1) {
              return;
            }

            const domNodePos = view.posAtDOM(domNode, 0);
            const outerNode = getOuterNode(editor.state.doc, domNodePos);
            const outerNodePos = getOuterNodePos(editor.state.doc, domNodePos); // TODO: needed?

            // 如果是 title 节点，不显示拖拽标识
            if (outerNode?.type.name === 'title') {
              hideHandle();
              currentNode = null;
              currentNodePos = -1;
              onNodeChange?.({ editor, node: null, pos: -1 });
              return;
            }

            currentNode = outerNode;
            currentNodePos = outerNodePos;

            // 【解耦说明】：原官方代码在此记录 Yjs 相对位置，已注释解耦：
            // currentNodeRelPos = getRelativePos(view.state, currentNodePos);

            onNodeChange?.({ editor, node: currentNode, pos: currentNodePos });

            repositionDragHandle(domNode as Element);
          },

          // TODO: Kills even on hot reload
          destroy() {
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
              pendingMouseCoords = null;
            }

            if (element) {
              removeNode(wrapper);
            }
          },
        };
      },

      props: {
        handleDOMEvents: {
          keydown(view) {
            if (!element || locked) {
              return false;
            }

            if (view.hasFocus()) {
              hideHandle();
              currentNode = null;
              currentNodePos = -1;
              onNodeChange?.({ editor, node: null, pos: -1 });

              // We want to still continue with other keydown events.
              return false;
            }

            return false;
          },
          mouseleave(_view, e) {
            // Do not hide open popup on mouseleave.
            if (locked) {
              return false;
            }

            // If e.target is not inside the wrapper, hide.
            if (e.target && !wrapper.contains(e.relatedTarget as HTMLElement)) {
              hideHandle();

              currentNode = null;
              currentNodePos = -1;

              onNodeChange?.({ editor, node: null, pos: -1 });
            }

            return false;
          },

          mousemove(view, e) {
            // Do not continue if popup is not initialized or open.
            if (!element || locked) {
              return false;
            }

            // Store latest mouse coords and schedule a single RAF per frame
            pendingMouseCoords = { x: e.clientX, y: e.clientY };

            if (rafId) {
              return false;
            }

            rafId = requestAnimationFrame(() => {
              rafId = null;

              if (!pendingMouseCoords) {
                return;
              }

              const { x, y } = pendingMouseCoords;
              pendingMouseCoords = null;

              const nodeData = findElementNextToCoords({
                x,
                y,
                direction: "right",
                editor,
              });

              // Skip if there is no node next to coords
              if (!nodeData.resultElement) {
                return;
              }

              let domNode = nodeData.resultElement as HTMLElement;

              domNode = getOuterDomNode(view, domNode);

              // Skip if domNode is editor dom.
              if (domNode === view.dom) {
                return;
              }

              // We only want `Element`.
              if (domNode?.nodeType !== 1) {
                return;
              }

              const domNodePos = view.posAtDOM(domNode, 0);
              const outerNode = getOuterNode(editor.state.doc, domNodePos);

              // 如果是 title 节点，不显示拖拽标识
              if (outerNode?.type.name === 'title') {
                hideHandle();
                currentNode = null;
                currentNodePos = -1;
                onNodeChange?.({ editor, node: null, pos: -1 });
                return;
              }

              if (outerNode !== currentNode) {
                const outerNodePos = getOuterNodePos(
                  editor.state.doc,
                  domNodePos
                );

                currentNode = outerNode;
                currentNodePos = outerNodePos;

                // 【解耦说明】：原官方代码在此记录 Yjs 相对位置，已注释解耦：
                // currentNodeRelPos = getRelativePos(view.state, currentNodePos);

                onNodeChange?.({
                  editor,
                  node: currentNode,
                  pos: currentNodePos,
                });

                // Set nodes clientRect.
                repositionDragHandle(domNode as Element);

                showHandle();
              }
            });

            return false;
          },
        },
      },
    }),
  };
};
