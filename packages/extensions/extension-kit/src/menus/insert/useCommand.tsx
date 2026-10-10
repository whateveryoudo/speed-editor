/*
 * @Author: ykx
 * @Date: 2022-12-28 16:25:35
 * @LastEditTime: 2023-01-03 09:47:04
 * @LastEditors: your name
 * @Description:
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\insert\useCommand.tsx
 */
import { type Editor } from '@tiptap/core'
import { type VNode, type Ref, ref, computed, inject, unref } from 'vue'
import {
  FileImageOutlined,
  FolderOutlined,
  LinkOutlined,
  DeploymentUnitOutlined,
  TableOutlined,
} from '@ant-design/icons-vue'
import imgIcon from '@ek/assets/image/insert/img.svg'
import tableIcon from '@ek/assets/image/insert/table.svg'
import fileIcon from '@ek/assets/image/insert/file.svg'
import mindIcon from '@ek/assets/image/insert/mind.svg'
import flowIcon from '@ek/assets/image/insert/flow.svg'
import tagIcon from '@ek/assets/image/insert/tag.svg'
import emojiIcon from '@ek/assets/image/insert/emoji.svg'
import codeBlockIcon from '@ek/assets/image/insert/code-block.svg'
import formulaIcon from '@ek/assets/image/insert/formula.svg'
import calloutIcon from '@ek/assets/image/insert/callout.svg'
export interface SubMenuGroup {
  key: string
  name: string
  size?: number
  iconRender?: (opt?: any) => VNode
  iconType?: string
  imgModule?: any
  hasMore?: boolean
  action?: (editor: Editor, payload?: any) => void
  payload?: any;
  order?: number
}
export interface MenuGroup {
  key: string
  name: string
  layout?: 'horizontal' | 'vertical'
  span?: number;
  children: SubMenuGroup[]
  order?: number
}
export interface InsertMenuItemConfig {
  groupKey?: string
  key: string
  name: string
  size?: number
  iconRender?: (opt?: any) => VNode
  iconType?: string
  imgModule?: any
  hasMore?: boolean
  action?: (editor: Editor, payload?: any) => void
  payload?: any
  order?: number
}

export interface InsertMenuGroupConfig {
  groupKey: string
  name?: string
  layout?: 'horizontal' | 'vertical'
  span?: number
  order?: number
  children?: InsertMenuItemConfig[]
}

export interface InsertMenuConfig {
  includeKeys?: string[] // groupKey&itemKey
  excludeKeys?: string[] // groupKey&itemKey
  insertItems?: InsertMenuItemConfig[]
  insertGroups?: InsertMenuGroupConfig[]
}

export const useCommand = (config?: InsertMenuConfig | Ref<InsertMenuConfig | undefined> | (() => InsertMenuConfig | undefined)) => {
  // 基础分组（作为构建的基底）
  const baseMenuGroup = ref<MenuGroup[]>([
    {
      key: 'common',
      name: '通用',
      layout: 'horizontal',
      span: 12,
      children: [
        {
          key: 'image',
          name: '图片',
          imgModule: imgIcon,
          action: (editor,payload) => editor.chain().focus().uploadImage(payload).run(),
        },
        {
          key: 'table',
          name: '表格',
          imgModule: tableIcon,
          hasMore: true,
          action: (editor, payload) => {
            // 如果没选择则默认3 * 3
            editor?.chain().insertTable({ rows: payload.rows || 3, cols: payload.cols || 3, withHeaderRow: true }).focus().run()
          },
          // 追加默认参数
          payload: {
            rows: 3,
            cols: 3,
          }
        },
        {
          key: 'file',
          name: '附件',
          imgModule: fileIcon,
          payload: null,
          action: (editor,payload) => editor.chain().focus().uploadAttachment(payload).run(),
        },
        {
          key: 'tag',
          name: '标签',
          imgModule: tagIcon,
          action: (editor,payload) => editor.chain().focus().insertTag(payload).run(),
        }
      ],
    },
    // {
    //   key: 'board',
    //   name: '画板类',
    //   children: [
    //     {
    //       key: '2-1',
    //       name: '思维导图',
    //       size: 18,
    //       imgModule: mindIcon,
    //       action: editor => {
    //         editor?.chain().focus().setMind().run()
    //         updateFlowState && updateMindState('visible', true)
    //         updateFlowState && updateMindState('data')
    //       },
    //     },
    //     {
    //       key: '2-2',
    //       name: '流程图',
    //       imgModule: flowIcon,
    //       action: editor => {
    //         editor
    //           .chain()
    //           .focus()
    //           .setFlowMap()
    //           // .setFlow({ width: '100%', defaultShowPicker: true, createUser: user.id })
    //           .run()
    //         updateFlowState && updateFlowState('visible', true)
    //         updateFlowState && updateFlowState('data')
    //       },
    //     },
    //   ],
    // },
    {
      key: 'programmer',
      name: '程序员专区',
      children: [
        {
          key: 'codeBlock',
          name: '代码块',
          size: 18,
          imgModule: codeBlockIcon,
          action: editor => {
            editor?.chain().focus().setCodeBlock().run()
          },
        }
      ],
    },
    {
      key: 'layout',
      name: '布局和样式',
      children: [
        {
          key: 'callout',
          name: '高亮块',
          size: 18,
          imgModule: calloutIcon,
          action: editor => {
            editor?.chain().focus().setCallout().run()
          },
        }
      ],
    },

  ])
  // 基于配置生成最终分组
  const menuGroup = computed<MenuGroup[]>(() => {
    const rawCfg = typeof config === 'function' ? config() : unref(config)
    const cfg = rawCfg || {}
    const includeKeys = cfg.includeKeys
    const excludeKeys = cfg.excludeKeys
    const insertItems = cfg.insertItems || []
    const insertGroups = cfg.insertGroups || []

    // 深拷贝并附加默认顺序
    const groups: Array<MenuGroup & { order?: number }> = baseMenuGroup.value.map((g, gi) => ({
      ...g,
      order: (g as any).order ?? gi,
      children: g.children.map((c, ci) => ({ ...c, order: (c as any).order ?? ci })) as any,
    }))

    const groupMap = new Map<string, any>()
    groups.forEach(g => groupMap.set(g.key, { ...g, children: [...g.children] }))

    // 合并 insertGroups（新增或覆盖）
    insertGroups.forEach((g, gi) => {
      const normalizedChildren = (g.children || []).map((c, ci) => ({
        key: c.key,
        name: c.name,
        size: c.size,
        iconRender: c.iconRender,
        iconType: c.iconType,
        imgModule: c.imgModule,
        hasMore: c.hasMore,
        action: c.action,
        payload: c.payload,
        order: c.order ?? ci,
      }))

      const existing = groupMap.get(g.groupKey)
      if (existing) {
        existing.name = g.name ?? existing.name
        existing.layout = g.layout ?? existing.layout
        existing.span = g.span ?? existing.span
        existing.order = g.order ?? existing.order ?? gi
        const childMap = new Map<string, any>()
        existing.children.forEach((c: any) => childMap.set(c.key, c))
        normalizedChildren.forEach((c: any) => childMap.set(c.key, c))
        existing.children = Array.from(childMap.values())
      } else {
        groupMap.set(g.groupKey, {
          key: g.groupKey,
          name: g.name ?? g.groupKey,
          layout: g.layout,
          span: g.span,
          order: g.order ?? gi,
          children: normalizedChildren,
        })
      }
    })

    // 合并 insertItems（追加到对应组）
    insertItems.forEach((it, idx) => {
      const groupKey = it.groupKey
      let target = groupMap.get(groupKey)
      if (!target) {
        target = {
          key: groupKey,
          name: groupKey,
          layout: 'vertical',
          span: 24,
          order: Number.MAX_SAFE_INTEGER,
          children: [],
        }
        groupMap.set(groupKey, target)
      }
      const existIdx = (target.children as any[]).findIndex((c: any) => c.key === it.key)
      const normalized = {
        key: it.key,
        name: it.name,
        size: it.size,
        iconRender: it.iconRender,
        iconType: it.iconType,
        imgModule: it.imgModule,
        hasMore: it.hasMore,
        action: it.action,
        payload: it.payload,
        order: it.order ?? (target.children.length + idx),
      }
      if (existIdx >= 0) {
        target.children[existIdx] = normalized
      } else {
        target.children.push(normalized)
      }
    })

    // 排序组与子项
    let result = Array.from(groupMap.values()) as Array<MenuGroup & { order?: number }>
    result.forEach(g => { (g.children as any[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) })
    result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    // include/exclude 过滤
    if (Array.isArray(includeKeys) && includeKeys.length > 0) {
      const set = new Set(includeKeys)
      result = result.map(g => ({
        ...g,
        children: g.children.filter((c: any) => set.has(`${g.key}&${c.key}`)),
      })).filter(g => g.children.length > 0)
    }
    if (Array.isArray(excludeKeys) && excludeKeys.length > 0) {
      const set = new Set(excludeKeys)
      result = result.map(g => ({
        ...g,
        children: g.children.filter((c: any) => !set.has(`${g.key}&${c.key}`) && !set.has(c.key)),
      })).filter(g => g.children.length > 0)
    }
    return result as MenuGroup[]
  })

  // 扁平项（基于最终分组）
  const flatLeafMenu = computed(() => {
    let tempMenus: SubMenuGroup[] = []
    menuGroup.value.forEach((pItem: MenuGroup) => {
      tempMenus = tempMenus.concat(pItem.children)
    })
    return tempMenus
  })
  return {
    menuGroup,
    flatLeafMenu,
  }
}
