import { computed, onUnmounted, unref, watch, type MaybeRef } from 'vue'
import * as Y from 'yjs'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { type Extensions } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { relativePositionToAbsolutePosition, ySyncPluginKey } from '@tiptap/y-tiptap'
import { getRandomColor } from '@speed-editor/shared'


export type {
  CollaborationConfig,
  CollaborationUser,
} from '@speed-editor/shared'

import type { CollaborationUser } from '@speed-editor/shared'

export interface CollaborationProviderLike {
  awareness?: {
    getStates: () => Map<number, Record<string, unknown>>
    on: (event: string, handler: (...args: any[]) => void) => void
    off: (event: string, handler: (...args: any[]) => void) => void
  }
  [key: string]: unknown
}

export interface UseCollaborationOptions {
  /** 外部注入的 Y.Doc 实例（由协同连接器如 @speed-collaboration 提供） */
  ydoc?: MaybeRef<Y.Doc | null | undefined>
  /** 外部注入的 Provider 实例（可选，用于光标和在线感知） */
  provider?: MaybeRef<CollaborationProviderLike | null | undefined>
  /** 当前用户信息，用于协同光标与头像展示 */
  user?: MaybeRef<CollaborationUser | null | undefined>
  /** 在线协同成员变化回调 */
  onCollaboratorsChange?: (users: CollaborationUser[]) => void
}

/**
 * 装配富文本协同扩展
 * speed-editor 内部不再自带连接器与兜底，统一消费外部传入的 ydoc / provider
 */
export function useCollaboration(options: UseCollaborationOptions) {
  let currentAwarenessHandler: (() => void) | null = null

  const activeDoc = computed(() => unref(options.ydoc) ?? null)
  const activeProvider = computed(() => unref(options.provider) ?? null)
  const activeUser = computed(() => unref(options.user) ?? null)

  const isCollaborationActive = computed(() => !!activeDoc.value)

  // 构建 Tiptap 协同扩展：同步构建，确保在子组件 useEditor 初始化时即可获取全部协同扩展
  const collaborationExtensions = computed<Extensions>(() => {
    const doc = activeDoc.value
    if (!doc) return []
    return buildCollaborationExtensions(doc, activeProvider.value, activeUser.value)
  })

  // 监听 Provider 的 awareness 变化并同步协作者列表
  watch(
    () => activeProvider.value,
    (provider, oldProvider) => {
      if (oldProvider?.awareness && currentAwarenessHandler) {
        oldProvider.awareness.off('change', currentAwarenessHandler)
        currentAwarenessHandler = null
      }

      if (provider?.awareness && options.onCollaboratorsChange) {
        currentAwarenessHandler = () => {
          const states = Array.from(provider.awareness!.getStates().values()) as Array<{ user?: CollaborationUser }>
          const users = states.map((s) => s.user).filter((u): u is CollaborationUser => !!u)
          options.onCollaboratorsChange?.(users)
        }
        provider.awareness.on('change', currentAwarenessHandler)
        currentAwarenessHandler() // 立即派发一次当前在线成员
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (activeProvider.value?.awareness && currentAwarenessHandler) {
      activeProvider.value.awareness.off('change', currentAwarenessHandler)
      currentAwarenessHandler = null
    }
  })

  const caretUser = computed(() => {
    const user = activeUser.value
    if (!user) return null
    return {
      id: user.id,
      avatar: user.avatar,
      name: user.nickname || user.username,
      color: user.color ?? getRandomColor(),
    }
  })

  return {
    ydoc: activeDoc,
    provider: activeProvider,
    caretUser,
    isCollaborationActive,
    collaborationExtensions,
  }
}



export const CollaborationExtension = Collaboration.extend({
  addProseMirrorPlugins() {
    const plugins = this.parent?.() || []
    const undoPlugin = plugins.find((p: any) => p.key?.startsWith('y-undo'))
    if (undoPlugin) {
      const origView = undoPlugin.spec.view
      undoPlugin.spec.view = (view: any) => {
        const undoManager = (undoPlugin as any).getState(view.state)?.undoManager

        if (undoManager) {
          // 恢复 trackedOrigins，保证 Redo 栈能接收反向操作
          if (!undoManager.trackedOrigins.has(undoManager)) {
            undoManager.trackedOrigins.add(undoManager)
          }
          // 恢复 afterTransaction 监听，保证事务变更能被捕捉
          if (undoManager.afterTransactionHandler && undoManager.doc) {
            undoManager.doc.off('afterTransaction', undoManager.afterTransactionHandler)
            undoManager.doc.on('afterTransaction', undoManager.afterTransactionHandler)
          }

          // 修复 Redo 光标竞态问题：
          // stack-item-popped 在 ProseMirror dispatch 完成之后才触发，
          // 导致 _mux 在恢复内容时读到的是 undo 时的光标位置。
          // 解决方案：仅在 redo 时，在 stack-item-popped 里额外补发一次纯光标定位事务。
          // undo 不需要处理：内容被删除后 relativePositionToAbsolutePosition 返回 null，
          // ProseMirror 自然将光标落到正确位置。
          // 修复 Redo 光标竞态问题（根本解法）：
          // stack-item-popped 在 _mux dispatch 之后才触发，导致无法在事后修正光标。
          // 正确方式：在 undoManager.redo() 执行前，提前将 redo 栈顶的选区注入
          // binding.beforeTransactionSelection，_mux 在 transact 内部运行时直接读到正确值！
          if (!(undoManager as any).__redo_cursor_fix_bound__) {
            ;(undoManager as any).__redo_cursor_fix_bound__ = true
            const origRedo = (undoManager as any).redo.bind(undoManager)
            ;(undoManager as any).redo = function () {
              const redoStack = (undoManager as any).redoStack
              if (redoStack && redoStack.length > 0) {
                const topItem = redoStack[redoStack.length - 1]
                if (topItem?.meta) {
                  const syncPlugin = plugins.find((p: any) => p.key?.startsWith('y-sync'))
                  const binding = syncPlugin?.getState(view.state)?.binding
                  if (binding) {
                    const relSel = topItem.meta.get(binding)
                    if (relSel) {
                      // 提前注入正确的 redo 光标，_mux 内 restoreRelativeSelection 会直接使用它
                      binding.beforeTransactionSelection = relSel
                    }
                  }
                }
              }
              return origRedo()
            }
          }
        }

        // 调用官方的 origView 以保证 stack-item-added / stack-item-popped 监听完整绑定
        const viewRet = origView ? origView(view) : undefined
        return {
          update: viewRet?.update,
          destroy: () => {
            // 严禁调用 viewRet.destroy()：官方 destroy 会调用 undoManager.destroy()
            // 清空 trackedOrigins + 解绑所有事件监听 -> Redo 坏死 + 光标恢复失效！
          },
        }
      }
    }
    return plugins
  },
})

export function buildCollaborationExtensions(
  doc: Y.Doc | null | undefined,
  activeProvider?: CollaborationProviderLike | null | undefined,
  user?: CollaborationUser | null,
): Extensions {
  if (!doc) return []

  const extensions: Extensions = [
    CollaborationExtension.configure({
      document: doc,
    }),
  ]
  if (activeProvider && user) {
    extensions.push(
      CollaborationCaret.configure({
        provider: activeProvider as any,
        user: {
          id: user.id,
          avatar: user.avatar as string | undefined,
          name: (user.nickname || user.username) as string,
          color: (user.color as string | undefined) ?? getRandomColor(),
        },
      }),
    )
  }
  return extensions
}
