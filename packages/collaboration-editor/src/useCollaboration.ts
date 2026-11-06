import { computed, onUnmounted, unref, watch, type MaybeRef } from 'vue'
import type * as Y from 'yjs'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import type { Extensions } from '@tiptap/core'
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

  // 构建 Tiptap 协同扩展
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

export function buildCollaborationExtensions(
  doc: Y.Doc | null | undefined,
  activeProvider: CollaborationProviderLike | null | undefined,
  user?: CollaborationUser | null,
): Extensions {
  if (!doc) return []

  const extensions: Extensions = [Collaboration.configure({ document: doc })]
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
