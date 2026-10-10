<!--
 * @Author: ykx
 * @Date: 2022-11-23 09:42:32
 * @LastEditTime: 2022-11-24 17:59:53
 * @LastEditors: your name
 * @Description: CodeBlock Wrapper - Tiptap 3.0 版本
 * @FilePath: \we-knowledge-base\src\tiptap\core\extensions\codeBlock\wrapper.vue
-->
<template>
  <NodeViewWrapper :class="['code-block', nodeAttrs.theme, isHover && 'is-hover']" @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">
    <Flex vertical class="rounded-md code-block-wrapper relative">
      <!-- 工具条:收起的时候添加圆角 -->
      <!-- 为什么收起时候非NodeViewContent还能输入呢？？？ -->
      <div :contenteditable="false">
        <Flex justify="space-between" :contenteditable="false"
          :class="['p-2 code-block-toolbar border-rounded-lt-md border-rounded-rt-md border-b border-b-solid border-b-[var(--speed-color-border-gray)] bg-[var(--speed-color-bg-gray-1)]', !nodeAttrs.isExpanded && 'rounded-md']"
          :style="[!nodeAttrs.isExpanded && { border: 'none' }]">
          <Space>
            <s-question-tip placement="top" :tip="nodeAttrs.isExpanded ? '收起' : '展开'">
              <Button type="text" :class="['shadow-btn-wrapper', nodeAttrs.theme === 'atom-one-dark' && 'dark']"
                @click="updateAttributes({ isExpanded: !nodeAttrs.isExpanded })">
                <CaretDownOutlined :style="{ color: nodeAttrs.theme === 'atom-one-dark' ? '#e2e2e2' : '#000' }"
                  v-if="nodeAttrs.isExpanded" />
                <CaretRightOutlined :style="{ color: nodeAttrs.theme === 'atom-one-dark' ? '#e2e2e2' : '#000' }"
                  v-else />
              </Button>
            </s-question-tip>
            <Input v-if="editableCpt" :value="nodeAttrs.title"
              @change="(e: any) => updateAttributes({ title: e.target.value })" placeholder="请输入代码块名称(选填)" />
            <span v-else>{{ nodeAttrs.title }}</span>
          </Space>
          <Space :size="5">
            <!-- 注意这里存入的是个对象 -->
            <Select :dropdownMatchSelectWidth="false" :bordered="false" :disabled="!editableCpt"
              :class="['auto-width shadow-ant-select', nodeAttrs.theme]" show-search :value="nodeAttrs.languageAlias"
              @change="(lan: string, option: any) => updateAttributes({ languageAlias: option.value, language: option.lang, languageManual: true })"
              optionFilterProp="label" :options="extendedLanguages">
            </Select>
            <Divider type="vertical" :class="['divider-small', nodeAttrs.theme === 'atom-one-dark' && 'dark']" />
            <Select :dropdownMatchSelectWidth="false" :bordered="false" :disabled="!editableCpt"
              :class="['auto-width shadow-ant-select', nodeAttrs.theme]" :value="nodeAttrs.theme"
              @change="(theme: string) => updateAttributes({ theme: theme })">
              <SelectOption value="atom-one-light">atom-one-light</SelectOption>
              <SelectOption value="atom-one-dark">atom-one-dark</SelectOption>
              <!-- 暂不提供太多 -->
              <!-- <SelectOption value="github-light">github-light</SelectOption> -->
              <!-- <SelectOption value="github-dark">github-dark</SelectOption> -->
            </Select>
            <Divider type="vertical" :class="['divider-small', nodeAttrs.theme]" />
            <s-question-tip v-if="editableCpt" placement="top" :tip="nodeAttrs.wrap ? '取消自动换行' : '自动换行'">
              <Button type="text" :class="['shadow-btn-wrapper', nodeAttrs.theme, nodeAttrs.wrap && 'is-active']"
                @click="updateAttributes({ wrap: !nodeAttrs.wrap })">
                <s-icon-font type="icon-kl-multilinetext" />
              </Button>
            </s-question-tip>
            <Divider type="vertical" :class="['divider-small', nodeAttrs.theme]" />
            <s-question-tip placement="top" tip="复制代码">
              <Button type="text" :class="['shadow-btn-wrapper', nodeAttrs.theme]" @click="copyCode">
                <CopyOutlined />
              </Button>
            </s-question-tip>
            <Button v-if="editableCpt" type="text" :class="['shadow-btn-wrapper', nodeAttrs.theme]"
              @click="handleDelNode('codeBlock')">
              <DeleteOutlined />
            </Button>
          </Space>
        </Flex>
      </div>
      <!-- 内容区：勿用 v-if，否则会卸载 NodeViewContent 导致展开后光标/内容异常 -->
      <div v-show="nodeAttrs.isExpanded" :class="[`hljs-theme-${nodeAttrs.theme}`]" class="content-wrap" ref="wrapRef"
        :style="contentWrapStyle">
        <pre class="border-rounded-bl-md border-rounded-br-md box-border code-block-content"><NodeViewContent
          :class="['hljs']"
          as="code"
          :style="{ whiteSpace: nodeAttrs.wrap ? 'pre-wrap' : 'pre' }"
        /></pre>
      </div>
      <!-- 放在滚动容器外，避免 bottom 负偏移撑出滚动条/遮挡内容；居中用 transform 不用负 margin -->
      <div v-if="editableCpt && nodeAttrs.isExpanded" class="resize-bottom"
        @pointerdown="handleStartResize('bottom', $event)" />
    </Flex>
  </NodeViewWrapper>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { Button, Divider, Flex, Input, Select, SelectOption, Space } from 'ant-design-vue'
import {
  CaretDownOutlined,
  CaretRightOutlined,
  CopyOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { useEdgeResize, type Edge } from '@ek/hooks/useEdgeResize'
import { lowlightInstance } from './index'
import { copy } from '@ek/helpers/copy-to-clipboard'
import { useBubble } from '@ek/hooks/useBubble'
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps(nodeViewProps)
const nodeAttrs = computed(() => props.node.attrs)
const isHover = ref(false)
const onMouseEnter = () => (isHover.value = true)
const onMouseLeave = () => (isHover.value = false)
// 常用的编程语言列表
const { handleDelNode } = useBubble(props.editor, {})
const languages = lowlightInstance.listLanguages().map((language: string) => ({
  value: language,
  lang: language,
  label: language
}))
const { editableCpt } = useSpeedEditor();
const extendedLanguages = computed(() => {
  return [...languages, {
    value: 'vue',
    lang: 'xml',
    label: 'vue'
  }, {
    value: 'html',
    lang: 'xml',
    label: 'html'
  }, {
    value: 'jsx',
    lang: 'javascript',
    label: 'jsx'
  }, {
    value: 'tsx',
    lang: 'typescript',
    label: 'tsx'
  },]
})

/** 贴内容时的上限，超出后内容区滚动 */
const MAX_AUTO_HEIGHT = 480

const resolveFixedHeight = (raw: unknown): number | null => {
  if (raw == null || raw === '' || raw === 'auto') return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

const wrapRef = ref<HTMLElement | null>(null)
const isResizing = ref(false)
const initialFixed = resolveFixedHeight(nodeAttrs.value.height)

const { height, startResize } = useEdgeResize(
  wrapRef,
  { height: initialFixed ?? 0 },
  {
    minHeight: 100,
    onResizeEnd: ({ height: h }, { didMove }) => {
      isResizing.value = false
      if (didMove) {
        props.updateAttributes({ height: String(h) })
        return
      }
      // 未拖拽：若仍是贴内容模式，清掉临时测量高度
      if (resolveFixedHeight(nodeAttrs.value.height) == null) {
        height.value = 0
      }
    },
  },
)

watch(
  () => nodeAttrs.value.height,
  (h) => {
    const next = resolveFixedHeight(h)
    if (next != null) {
      if (next !== height.value) height.value = next
    } else if (!isResizing.value) {
      height.value = 0
    }
  },
)

const contentWrapStyle = computed(() => {
  const fixed = resolveFixedHeight(nodeAttrs.value.height)
  const live = isResizing.value && height.value > 0 ? height.value : fixed
  if (live != null) {
    return { height: `${live}px` }
  }
  return {
    height: 'auto',
    maxHeight: `${MAX_AUTO_HEIGHT}px`,
  }
})

const handleStartResize = (edge: Edge, e: PointerEvent) => {
  isResizing.value = true
  startResize(edge, e)
}

const copyCode = () => {
  copy(props.node.textContent)
}

</script>

<style lang="less" scoped>
.code-block {
  position: relative;
  margin-bottom: 10px;

  .code-block-wrapper {
    position: relative;
    border: 1px solid var(--speed-color-border-gray);
  }

  &.is-hover,
  &.has-focus {
    .code-block-wrapper {
      border-color: var(--ant-color-primary);
    }
  }

  // 追加暗黑主题样式部分样式
  &.atom-one-dark {
    .code-block-wrapper {
      border-color: transparent;
    }

    .code-block-toolbar,
    .content-wrap {
      background: var(--speed-color-bg-dark-1);
      color: var(--speed-color-text-white-1);
    }
  }


}

.content-wrap {
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  background-color: #fafafa;
}

.code-block-content {
  margin: 0;
}

.resize-bottom {
  width: 56px;
  height: 8px;
  background-color: var(--speed-color-bg-gray-2);
  border-radius: 4px;
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  cursor: ns-resize;
}
</style>
