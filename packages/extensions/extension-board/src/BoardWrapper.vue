<template>
  <NodeViewWrapper
    class="speed-board-node-wrapper"
    :class="{
      'is-fullscreen': isFullscreen,
      'is-selected': selected,
      'is-editing': isSelfEditing,
      'is-locked': isLocked,
    }"
    contenteditable="false"
  >
    <div
      ref="cardRef"
      class="speed-board-card"
      :class="{ 'is-locked': isLocked, 'is-editing': isSelfEditing }"
      :style="cardStyle"
      tabindex="-1"
      @pointerdown.capture="onCardPointerDown"
    >
      <!-- 协同块级编辑锁遮罩（语雀同款红底遮罩 + 正在编辑标签） -->
      <div v-if="isLocked" class="speed-board-locked-mask">
        <div
          class="speed-board-locked-tag"
          :style="{ backgroundColor: lockingUser?.color || '#ff4d4f' }"
        >
          <span class="user-text">{{ lockingUser?.name }} 正在编辑</span>
        </div>
      </div>

      <!-- 右上角悬浮操作栏（全屏/退出全屏，非锁定态可见） -->
      <div v-if="!isLocked" class="speed-board-fullscreen-btn-wrap">
        <a-tooltip :title="isFullscreen ? '退出全屏 (ESC)' : '全屏编辑'">
          <button
            type="button"
            class="speed-board-action-btn"
            @click.stop="toggleFullscreen"
          >
            <FullscreenExitOutlined v-if="isFullscreen" />
            <FullscreenOutlined v-else />
          </button>
        </a-tooltip>
      </div>

      <!-- 画板主体组件 -->
      <div class="speed-board-body" :class="{ 'is-disabled-events': isLocked }">
        <SpeedBoard
          v-if="isMounted"
          :options="boardOptions"
          :readonly="!isSelfEditing || isLocked"
          @created="onBoardCreated"
        />
      </div>

      <!-- 底部高度 Resize 拖拽手柄 (仅在编辑态且未被锁定时可见) -->
      <div
        v-if="isEditable && !isFullscreen && !isLocked"
        class="speed-board-resize-handle"
        @mousedown.stop.prevent="startResize"
      >
        <div class="speed-board-resize-bar" />
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { Tooltip as ATooltip } from 'ant-design-vue'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons-vue'
import { SpeedBoard } from '@speed-board/vue3-antd'

const props = defineProps(nodeViewProps)

const isMounted = ref(false)
const isFullscreen = ref(false)
const boardInstance = ref<any>(null)
const cardRef = ref<HTMLDivElement | null>(null)

// 从 node.attrs 读取配置
const nodeAttrs = computed(() => props.node?.attrs || {})
const isEditable = computed(() => Boolean(props.editor?.isEditable))

const boardId = computed(() => nodeAttrs.value.id || '')

// 卡片高度
const localHeight = ref<number>(nodeAttrs.value.height || 480)

const cardStyle = computed(() => {
  if (isFullscreen.value) {
    return {}
  }
  return {
    height: `${localHeight.value}px`,
  }
})

// --- 语雀同款块级独占编辑锁机制 ---
const isSelfEditing = ref(false)
const lockingUser = ref<{ name: string; color?: string; avatar?: string } | null>(null)
const isLocked = computed(() => Boolean(lockingUser.value))

// 获取当前宿主编辑器的 Yjs Awareness 实例
const getAwareness = () => {
  const editor = props.editor
  if (!editor) return null

  // 1. 优先从 collaborationCaret 扩展读取
  const caretExt = editor.extensionManager?.extensions?.find(
    (e: any) => e.name === 'collaborationCaret',
  )
  if (caretExt?.options?.provider?.awareness) {
    return caretExt.options.provider.awareness
  }

  // 2. 从 collaboration 扩展读取
  const collabExt = editor.extensionManager?.extensions?.find(
    (e: any) => e.name === 'collaboration',
  )
  if (collabExt?.options?.provider?.awareness) {
    return collabExt.options.provider.awareness
  }

  return null
}

// 检查远端协作者对该卡片的锁定状态
const updateAwarenessLockState = () => {
  const awareness = getAwareness()
  if (!awareness || !boardId.value) return

  const myClientId = awareness.clientID
  const currentId = boardId.value
  let foundUser = null

  const states = awareness.getStates()
  for (const [clientId, state] of states.entries()) {
    if (clientId !== myClientId && state?.activeBlockId === currentId) {
      const u = (state.user || {}) as any
      foundUser = {
        name: u.name || u.nickname || u.username || '协作者',
        color: u.color || '#ff4d4f',
        avatar: u.avatar,
      }
      break
    }
  }

  lockingUser.value = foundUser
}

// 本地请求持有编辑锁
const acquireLock = () => {
  if (isLocked.value || !isEditable.value) return
  if (!isSelfEditing.value) {
    isSelfEditing.value = true
    const awareness = getAwareness()
    if (awareness && boardId.value) {
      awareness.setLocalStateField('activeBlockId', boardId.value)
    }
  }
}

// 本地释放编辑锁并提交最新数据
const releaseLock = () => {
  if (isSelfEditing.value) {
    isSelfEditing.value = false
    const awareness = getAwareness()
    if (awareness) {
      const localState = awareness.getLocalState()
      if (localState?.activeBlockId === boardId.value) {
        awareness.setLocalStateField('activeBlockId', null)
      }
    }
    // 退出编辑时立即刷出最新数据存盘
    flushSaveBoardData()
  }
}

// 监听 TipTap 选区变化：当光标离开当前画板块时，自动释放编辑锁
const handleSelectionUpdate = () => {
  if (!props.selected && isSelfEditing.value && !isFullscreen.value) {
    releaseLock()
  }
}

// 捕获阶段感知点击卡片：第一时间标记自编辑态与获取锁
const onCardPointerDown = () => {
  if (isLocked.value) return
  acquireLock()
}

// --- 画板配置：仅在初次创建时提供初始数据快照，绝不在交互中通过 options.value 反复灌入深拷贝 ---
const initialData = Array.isArray(props.node?.attrs?.data)
  ? JSON.parse(JSON.stringify(props.node.attrs.data))
  : []

const boardOptions = {
  readonly: !isEditable.value,
  value: initialData,
}

// 防自噬标志位：区分是否为画板自身触发的变动
let isSelfUpdating = false
let saveTimer: any = null

// 立即提交保存数据（核心：显式标记 addToHistory: false，绝不污染 TipTap 正文的撤销历史栈！）
const flushSaveBoardData = () => {
  if (!boardInstance.value || !isEditable.value || isLocked.value) return
  clearTimeout(saveTimer)
  try {
    const children = boardInstance.value.children || []
    const cleanData = JSON.parse(JSON.stringify(children))
    isSelfUpdating = true

    if (typeof props.getPos === 'function' && props.editor) {
      const pos = props.getPos()
      if (typeof pos === 'number') {
        const tr = props.editor.state.tr
        tr.setNodeAttribute(pos, 'data', cleanData)
        tr.setMeta('addToHistory', false)
        props.editor.view.dispatch(tr)
      } else {
        props.updateAttributes({ data: cleanData })
      }
    } else {
      props.updateAttributes({ data: cleanData })
    }

    Promise.resolve().then(() => {
      setTimeout(() => {
        isSelfUpdating = false
      }, 100)
    })
  } catch (e) {
    console.error('[BoardWrapper] Failed to save board data:', e)
    isSelfUpdating = false
  }
}

// 防抖保存画板数据（持续保活，防刷新丢失）
const debounceSaveBoardData = () => {
  if (!boardInstance.value || !isEditable.value || isLocked.value) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    flushSaveBoardData()
  }, 350)
}

// 监听外层 TipTap / Y.Doc 数据更新
watch(
  () => props.node?.attrs?.data,
  (newData) => {
     console.log("快照更新进入");
    // 1. 如果自己正在编辑中，画布内存引用就是唯一真理，绝不接受外部数据洗刷重置！
    if (isSelfEditing.value || isSelfUpdating) {
      return
    }
    console.log("快照更新进入1");
    if (!boardInstance.value || !newData) return

    // 2. 检查数据内容是否与当前画布实际内容相同（防止自身保存后的无谓回流）
    try {
      const currentChildren = boardInstance.value.children || []
      if (JSON.stringify(currentChildren) === JSON.stringify(newData)) {
        return
      }
    } catch {
      // ignore
    }

    // 3. 确属协作者新数据同步（当前处于查看/锁定态）：清空旧选区指针后应用新数据
    try {
      boardInstance.value.clearSelection?.()
      boardInstance.value.setChildren?.(newData)
    } catch (e) {
      console.warn('[BoardWrapper] sync remote data failed:', e)
    }
  },
  { deep: true },
)

// 画板创建成功
const onBoardCreated = (board: any) => {
  boardInstance.value = board
  const emitter = board.boardWrapper || board
  emitter.on('change', () => {
    // 只有在已进入自编辑态时，change 才是用户的有效修改，才触发防抖保存
    // 严禁在此处将 isSelfEditing 设为 true（防止初始化渲染图形时误将所有画板激活为编辑态）
    if (isSelfEditing.value) {
      debounceSaveBoardData()
    }
  })
  if (board.children && board.children.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        board.centerContent?.()
      }, 200)
    })
  }
}

// 全屏切换
const toggleFullscreen = () => {
  if (isLocked.value) return
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    acquireLock()
  }
  nextTick(() => {
    setTimeout(() => {
      boardInstance.value?.centerContent?.()
    }, 150)
  })
}

// --- 键盘事件：当画板处于编辑态或被选中态时，接管内部撤销重做与栈底穿透 ---
const handleKeyDown = (e: KeyboardEvent) => {
  // ESC 退出全屏
  if (e.key === 'Escape' && isFullscreen.value) {
    e.preventDefault()
    e.stopPropagation()
    toggleFullscreen()
    return
  }

  // ★ 核心接棒：只有当画板被选中（props.selected 亮绿框）或处于自编辑态（isSelfEditing）时才处理
  const isBoardActive = isSelfEditing.value || Boolean(props.selected)
  if (!isBoardActive || isLocked.value) {
    return // 焦点在纯正文打字且未选画板时，100% 放行给外部 TipTap / Yjs！
  }

  const isUndo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey
  const isRedo =
    (e.metaKey || e.ctrlKey) &&
    (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))

  if (isUndo) {
    // 若画板内部还有历史步骤：拦截事件，在画板内部细粒度退图形！
    if (boardInstance.value?.canUndo?.()) {
      e.preventDefault()
      e.stopPropagation()
      boardInstance.value?.undo?.()
      return
    }
    // 栈底穿透：画板内部已退完，接棒通知 TipTap 宿主撤销更早的正文！
    if (props.editor) {
      e.preventDefault()
      e.stopPropagation()
      props.editor.commands.undo()
      return
    }
    return
  }

  if (isRedo) {
    if (boardInstance.value?.canRedo?.()) {
      e.preventDefault()
      e.stopPropagation()
      boardInstance.value?.redo?.()
      return
    }
    // 栈底穿透：画板内部已无重做步骤，接棒通知 TipTap 重做正文！
    if (props.editor) {
      e.preventDefault()
      e.stopPropagation()
      props.editor.commands.redo()
      return
    }
    return
  }
}

// 底部 Resize 拖拽
let startY = 0
let startH = 0
const startResize = (e: MouseEvent) => {
  if (isLocked.value) return
  acquireLock()
  startY = e.clientY
  startH = localHeight.value

  const onMouseMove = (moveEvt: MouseEvent) => {
    const deltaY = moveEvt.clientY - startY
    const newH = Math.max(260, Math.min(1600, startH + deltaY))
    localHeight.value = newH
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    props.updateAttributes({
      height: localHeight.value,
    })
    nextTick(() => {
      boardInstance.value?.centerContent?.()
    })
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

let awarenessCleanup: (() => void) | null = null

onMounted(() => {
  isMounted.value = true
  // 确保卡片节点具有唯一 ID，用于 Awareness 识别
  if (!props.node.attrs.id) {
    props.updateAttributes({
      id: 'board_' + Math.random().toString(36).slice(2, 10),
    })
  }

  window.addEventListener('keydown', handleKeyDown, true)
  props.editor?.on('selectionUpdate', handleSelectionUpdate)

  // 绑定 Awareness 监听
  const awareness = getAwareness()
  if (awareness) {
    const handler = () => {
      updateAwarenessLockState()
    }
    awareness.on('change', handler)
    handler()
    awarenessCleanup = () => {
      awareness.off('change', handler)
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown, true)
  props.editor?.off('selectionUpdate', handleSelectionUpdate)
  clearTimeout(saveTimer)
  releaseLock()
  awarenessCleanup?.()
})
</script>

<style scoped>
.speed-board-node-wrapper {
  margin: 16px 0;
  position: relative;
  user-select: none;
}

.speed-board-node-wrapper.is-selected .speed-board-card {
  border-color: var(--ant-color-primary, #1677ff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
}

.speed-board-card {
  width: 100%;
  position: relative;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.speed-board-card.is-editing {
  border-color: var(--ant-color-primary, #1677ff);
  box-shadow: 0 0 0 1px rgba(22, 119, 255, 0.2);
}

/* 语雀同款锁定状态：红色外边框与浅红背景遮罩 */
.speed-board-card.is-locked {
  border-color: #ff4d4f !important;
  box-shadow: 0 0 0 1px #ff4d4f !important;
}

.speed-board-locked-mask {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 77, 79, 0.14);
  z-index: 90;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  pointer-events: all;
  cursor: not-allowed;
}

.speed-board-locked-tag {
  margin: 0;
  padding: 2px 10px;
  border-bottom-left-radius: 4px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.5px;
  user-select: none;
}

/* 全屏样式：铺满整个浏览器窗口 */
.speed-board-node-wrapper.is-fullscreen .speed-board-card {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border: none !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

.speed-board-body {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.speed-board-body.is-disabled-events {
  pointer-events: none;
}

/* 右上角悬浮操作按钮 */
.speed-board-fullscreen-btn-wrap {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 80;
  display: flex;
  align-items: center;
}

.speed-board-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  font-size: 14px;
  transition: all 0.2s;
}

.speed-board-action-btn:hover {
  background: #f8fafc;
  color: #1e293b;
  border-color: #cbd5e1;
}

/* 底部拖拽把手 */
.speed-board-resize-handle {
  width: 100%;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: row-resize;
  background: transparent;
  transition: background 0.2s;
}

.speed-board-resize-handle:hover {
  background: #f1f5f9;
}

.speed-board-resize-bar {
  width: 48px;
  height: 4px;
  background: #cbd5e1;
  border-radius: 2px;
  transition: background 0.2s;
}

.speed-board-resize-handle:hover .speed-board-resize-bar {
  background: #94a3b8;
}
</style>
