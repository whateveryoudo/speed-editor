/** @deprecated legacyRegistry 已清空，toolbar/bubble 由 kit-base 插件提供 */
import type { Component } from 'vue'
import type { BubbleMenuKey } from '@speed-editor/shared'

export const legacyToolbarButtons: Record<string, Component> = {}

export const legacyBubbleMenus: Partial<Record<BubbleMenuKey, Component[]>> = {}
