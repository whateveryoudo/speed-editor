import { computed, onUnmounted, shallowRef, unref, watch, type MaybeRef } from 'vue'
import * as Y from 'yjs'
import { HocuspocusProvider, type onAwarenessUpdateParameters } from '@hocuspocus/provider'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import type { Extensions } from '@tiptap/core'
import { getRandomColor } from '@speed-editor/shared'

export type {
  CollaborationConfig,
  CollaborationUser,
} from '@speed-editor/shared'

import type { CollaborationConfig, CollaborationUser } from '@speed-editor/shared'

export interface UseCollaborationOptions {
  config: MaybeRef<CollaborationConfig | null | undefined>
  enabled?: MaybeRef<boolean>
  onCollaboratorsChange?: (users: CollaborationUser[]) => void
}

export function useCollaboration(options: UseCollaborationOptions) {
  const ydoc = shallowRef<Y.Doc | null>(null)
  const provider = shallowRef<HocuspocusProvider | null>(null)

  let currentDoc: Y.Doc | null = null
  let currentProvider: HocuspocusProvider | null = null

  const collaborationExtensions = shallowRef<Extensions>([])

  const syncCollaborationExtensions = () => {
    const doc = ydoc.value
    const activeProvider = provider.value
    const cfg = unref(options.config)
    if (!doc) {
      collaborationExtensions.value = []
      return
    }

    const extensions: Extensions = [Collaboration.configure({ document: doc })]
    if (activeProvider && cfg?.user) {
      extensions.push(
        CollaborationCaret.configure({
          provider: activeProvider,
          user: {
            id: cfg.user.id,
            avatar: cfg.user.avatar as string | undefined,
            name: (cfg.user.nickname || cfg.user.username) as string,
            color: (cfg.user.color as string | undefined) ?? getRandomColor(),
          },
        }),
      )
    }
    collaborationExtensions.value = extensions
  }

  const destroy = () => {
    currentProvider?.awareness?.setLocalState(null)
    currentProvider?.disconnect?.()
    currentProvider?.destroy?.()
    currentProvider = null
    provider.value = null
    if (currentDoc) {
      currentDoc.destroy()
      currentDoc = null
    }
    ydoc.value = null
    collaborationExtensions.value = []
  }

  const setup = () => {
    destroy()
    const cfg = unref(options.config)
    const isEnabled = unref(options.enabled) ?? true
    if (!isEnabled || !cfg?.documentId) return

    const doc = new Y.Doc()
    currentDoc = doc
    currentProvider = new HocuspocusProvider({
      name: cfg.documentId,
      url: cfg.url,
      token: cfg.token,
      document: doc,
      onSynced: () => {
        ydoc.value = doc
        provider.value = currentProvider
        syncCollaborationExtensions()
      },
      onAwarenessUpdate: (params: onAwarenessUpdateParameters) => {
        const users = (params.states as Array<{ user?: CollaborationUser }>)
          .map((s) => s.user)
          .filter((u): u is CollaborationUser => !!u)
        options.onCollaboratorsChange?.(users)
      },
    })
  }

  watch(() => [unref(options.config), unref(options.enabled)], setup, { immediate: true, deep: true })
  onUnmounted(destroy)

  const isCollaborationActive = computed(() => !!ydoc.value && !!provider.value)

  const caretUser = computed(() => {
    const cfg = unref(options.config)
    if (!cfg?.user) return null
    return {
      id: cfg.user.id,
      avatar: cfg.user.avatar,
      name: cfg.user.nickname || cfg.user.username,
      color: cfg.user.color ?? getRandomColor(),
    }
  })

  return { ydoc, provider, caretUser, isCollaborationActive, collaborationExtensions, destroy }
}

export function buildCollaborationExtensions(
  doc: Y.Doc | null | undefined,
  activeProvider: HocuspocusProvider | null | undefined,
  user?: CollaborationUser | null,
): Extensions {
  if (!doc) return []

  const extensions: Extensions = [Collaboration.configure({ document: doc })]
  if (activeProvider && user) {
    extensions.push(
      CollaborationCaret.configure({
        provider: activeProvider,
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
