<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { Button, Divider, Popover, Tooltip } from 'ant-design-vue'
import { EllipsisOutlined } from '@ant-design/icons-vue'
import type { Component } from 'vue'
import type { InsertMenuItem, ToolBarConfig } from '@speed-editor/shared'
import { resolveToolbarLayout } from '@speed-editor/shared'
import InsertMenuShell from './InsertMenuShell.vue'

const props = defineProps<{
  toolbarKeys: ToolBarConfig[]
  buttons: Record<string, Component>
  insertItems?: InsertMenuItem[]
  editor: unknown
}>()

/** 与 .ste-menu-bar__items / __measure 的 gap 保持一致 */
const GAP = 8
const MORE_BTN_FALLBACK = 36

/**
 * 过滤无效 key：
 * - insert：insertItems 或 buttons.insert（InsertPopover）任一存在即保留
 * - 其它：必须在 buttons 里注册过
 */
const layout = computed(() =>
  resolveToolbarLayout(props.toolbarKeys).filter((item) => {
    if (item.key === 'insert') {
      return !!(props.insertItems?.length || props.buttons.insert)
    }
    return !!props.buttons[item.key]
  }),
)

const barRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const moreMeasureRef = ref<HTMLElement | null>(null)
/** 编辑器根：fixed + left/right 时 header 会拉满侧栏右侧，应用编辑区宽度 */
const editorRootRef = ref<HTMLElement | null>(null)

const visibleCount = ref(Number.MAX_SAFE_INTEGER)
const moreOpen = ref(false)
const tooltipOpen = ref(false)

const visibleItems = computed(() => layout.value.slice(0, visibleCount.value))
const overflowItems = computed(() => layout.value.slice(visibleCount.value))
const isOverflowing = computed(() => overflowItems.value.length > 0)

const popupContainer = () => document.body

let resizeObserver: ResizeObserver | null = null
let rafId = 0
let delayTimer = 0

/**
 * 可用宽度取 .speed-editor，再扣 header padding。
 * （width:auto 后 header 自身宽仍可能是 left~right 整段，含大纲区）
 */
function getAvailableWidth(bar: HTMLElement) {
  const editorRoot =
    editorRootRef.value ??
    (bar.closest('.speed-editor') as HTMLElement | null)
  if (editorRoot) editorRootRef.value = editorRoot
  const widthSource = editorRoot ?? bar
  const style = getComputedStyle(bar)
  const padding =
    (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
  return widthSource.clientWidth - padding
}

/**
 * 屏外逐项量宽 + gap；放不下时预留「更多」再从左累加
 */
function measureAndUpdate() {
  const bar = barRef.value
  const measure = measureRef.value
  if (!bar || !measure) return

  const available = getAvailableWidth(bar)
  if (available <= 0) return

  const itemEls = Array.from(
    measure.querySelectorAll<HTMLElement>('[data-toolbar-measure-item]'),
  )
  if (!itemEls.length) {
    visibleCount.value = 0
    return
  }

  const widths = itemEls.map((el) => el.getBoundingClientRect().width)
  if (widths.some((w) => w <= 0)) {
    scheduleMeasure(true)
    return
  }

  const moreWidth =
    moreMeasureRef.value?.getBoundingClientRect().width || MORE_BTN_FALLBACK

  const fullWidth =
    widths.reduce((sum, w) => sum + w, 0) + GAP * Math.max(0, widths.length - 1)

  if (fullWidth <= available) {
    visibleCount.value = widths.length
    return
  }

  const budget = Math.max(0, available - moreWidth - GAP)
  let used = 0
  let count = 0
  for (let i = 0; i < widths.length; i++) {
    const next = used + (count > 0 ? GAP : 0) + widths[i]
    if (next > budget + 0.5) break
    used = next
    count++
  }
  visibleCount.value = count
}

function scheduleMeasure(fromRetry = false) {
  cancelAnimationFrame(rafId)
  if (!fromRetry) window.clearTimeout(delayTimer)
  rafId = requestAnimationFrame(() => {
    void nextTick(() => {
      measureAndUpdate()
      if (!fromRetry) {
        delayTimer = window.setTimeout(() => measureAndUpdate(), 100)
      }
    })
  })
}

function bindResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (typeof ResizeObserver === 'undefined' || !barRef.value) return

  const bar = barRef.value
  const editorRoot =
    (bar.closest('.speed-editor') as HTMLElement | null) ?? bar
  editorRootRef.value = editorRoot === bar ? null : editorRoot

  resizeObserver = new ResizeObserver(() => scheduleMeasure())
  resizeObserver.observe(editorRoot)
}

onMounted(() => {
  bindResizeObserver()
  scheduleMeasure()
  void document.fonts?.ready?.then(() => scheduleMeasure())
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.clearTimeout(delayTimer)
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(
  () => [props.toolbarKeys, props.buttons, props.insertItems],
  () => {
    visibleCount.value = layout.value.length
    scheduleMeasure()
  },
  { deep: true },
)

function onMoreOpenChange(open: boolean) {
  moreOpen.value = open
  if (open) tooltipOpen.value = false
}

function isLastVisibleWithOverflow(key: string) {
  if (!overflowItems.value.length || !visibleItems.value.length) return false
  return visibleItems.value[visibleItems.value.length - 1]?.key === key
}

function renderInsert(itemKey: string) {
  return itemKey === 'insert' && !!props.insertItems?.length
}
</script>

<template>
  <header ref="barRef" class="ste-menu-bar">
    <!-- 屏外测量：逐项量宽，不受 overflow / justify 影响 -->
    <div ref="measureRef" class="ste-menu-bar__measure" aria-hidden="true">
      <div
        v-for="item in layout"
        :key="`m-${item.key}`"
        class="ste-menu-bar__measure-item"
        data-toolbar-measure-item
      >
        <InsertMenuShell
          v-if="renderInsert(item.key)"
          :editor="editor"
          :items="insertItems!"
        />
        <component
          v-else-if="buttons[item.key]"
          :is="buttons[item.key]"
          :editor="editor"
        />
        <Divider
          v-if="item.showDivider"
          type="vertical"
          class="ste-menu-bar__divider"
        />
      </div>
      <div ref="moreMeasureRef" class="ste-menu-bar__measure-more">
        <Button type="text" class="shadow-btn-wrapper ste-menu-bar__more-btn">
          <EllipsisOutlined />
        </Button>
      </div>
    </div>

    <div
      class="ste-menu-bar__items"
      :class="{ 'is-overflow': isOverflowing }"
    >
      <div
        v-for="item in visibleItems"
        :key="item.key"
        class="ste-menu-bar__item"
      >
        <InsertMenuShell
          v-if="renderInsert(item.key)"
          :editor="editor"
          :items="insertItems!"
        />
        <component
          v-else-if="buttons[item.key]"
          :is="buttons[item.key]"
          :editor="editor"
        />
        <Divider
          v-if="item.showDivider && !isLastVisibleWithOverflow(item.key)"
          type="vertical"
          class="ste-menu-bar__divider"
        />
      </div>

      <Popover
        v-if="overflowItems.length"
        v-model:open="moreOpen"
        trigger="click"
        placement="bottomRight"
        overlay-class-name="toolbar-popover-wrapper ste-menu-bar-more-popover"
        :get-popup-container="popupContainer"
        @open-change="onMoreOpenChange"
      >
        <template #content>
          <div class="ste-menu-bar__more-content">
            <template v-for="item in overflowItems" :key="`o-${item.key}`">
              <InsertMenuShell
                v-if="renderInsert(item.key)"
                :editor="editor"
                :items="insertItems!"
              />
              <component
                v-else-if="buttons[item.key]"
                :is="buttons[item.key]"
                :editor="editor"
              />
            </template>
          </div>
        </template>
        <Tooltip
          v-model:open="tooltipOpen"
          title="更多"
          placement="bottom"
          :get-popup-container="popupContainer"
        >
          <Button
            type="text"
            class="shadow-btn-wrapper ste-menu-bar__more-btn"
            aria-label="更多"
          >
            <EllipsisOutlined />
          </Button>
        </Tooltip>
      </Popover>
    </div>
  </header>
</template>

<style scoped>
.ste-menu-bar {
  position: relative;
  display: flex;
  /* auto：配合业务 fixed 的 left/right，宽度由两边钉出；必须写这个，否则宽度不会自适应 */
  width: auto;
  min-width: 0;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ste-menu-bar__measure {
  position: fixed;
  left: -99999px;
  top: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  pointer-events: none;
  visibility: hidden;
}

.ste-menu-bar__measure-item,
.ste-menu-bar__item {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.ste-menu-bar__measure-more {
  flex-shrink: 0;
}

.ste-menu-bar__items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* .ste-menu-bar__items.is-overflow {
  justify-content: flex-start;
} */

.ste-menu-bar__divider {
  margin: 0;
  height: 1.2em;
  flex-shrink: 0;
}

.ste-menu-bar__more-btn {
  flex-shrink: 0;
}
</style>

<style>
.ste-menu-bar-more-popover .ste-menu-bar__more-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  max-width: min(420px, calc(100vw - 24px));
  padding: 4px;
}
</style>
