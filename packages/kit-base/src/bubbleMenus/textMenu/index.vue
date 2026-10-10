<!--
 * @Author: ykx
 * @Date: 2022-11-16 18:21:23
 * @LastEditTime: 2022-12-30 16:06:51
 * @LastEditors: your name
 * @Description: 气泡工具-文字
 * @FilePath: \we-knowledge-base\src\tiptap\editor\collaboration\bubbleMenus\textMenu.vue
-->
<template>
    <BubbleContainer :editor="editor" :bubble-class-name="aiBubbleMenuVisible ? 'ai-bubble-out-container' : ''"
        :should-show="shouldShow" plugin-key="text-bubble-menu">
        <Space :size="5" v-if="!aiBubbleMenuVisible">
            <template v-for="item in bubbleMenuItems" :key="item">
                <template v-if="typeof item === 'string'">
                    <Divider v-if="item === '|'" type="vertical" class="menu-divider" />
                    <component :is="bubbleMenuMap[item as keyof typeof bubbleMenuMap]" trigger-type="bubble" v-else
                        :editor="editor" @show-ai-bubble="showAiBubble" />
                </template>
                <!-- 先不要选中样式 -->
                <template v-else>
                    <Tooltip :title="item.title">
                        <Button type="text" class="shadow-btn-wrapper" :class="[isTitleActive && 'disabled']"
                            @click="() => item.action?.(editor)" :disabled="isTitleActive">
                            <s-icon-font :type="item.icon" />
                        </Button>
                    </Tooltip>
                </template>
            </template>
        </Space>
        <!-- ai 二级气泡 -->
        <AiBubbleMenu v-else :editor="editor" @closeMenuBubble="handleCloseMenuBubble" />
    </BubbleContainer>
</template>

<script setup lang="ts">
import { Button, Divider, Space, Tooltip } from 'ant-design-vue'
import { computed, inject, ref, onMounted, onUnmounted, nextTick } from 'vue'
import BubbleContainer from '../BubbleContainer.vue'
import Bold from '@kb/menus/bold.vue'
import Italic from '@kb/menus/italic.vue'
import Underline from '@kb/menus/underline.vue'
import Strike from '@kb/menus/strike.vue'
import FontSize from '@kb/menus/fontSize.vue'
import TextColor from '@kb/menus/textColor.vue'
import BackgroundColor from '@kb/menus/backgroundColor.vue'
import { type CollaborationEditorProps } from '@speed-editor/shared'
import Ai from '@kb/menus/ai/index.vue'
import AiBubbleMenu from '@kb/menus/ai/ai-bubble-menu.vue'
import { useActive } from '@speed-editor/composables'
const OTHER_BUBBLE_MENU_TYPES = ['title', 'callout', 'codeBlock', 'link', 'tag', 'attachment', 'image']
const props = withDefaults(defineProps<{
    editor: any,
    textBubbleMenu?: CollaborationEditorProps['textBubbleMenu'],
}>(), {
    editor: () => ({}),
})
const globalTiptapStorage = inject('globalTiptapStorage', ref<Record<string, any>>({}));
const aiBubbleMenuVisible = ref(false)


// 监听编辑器选区变化，管理 AI 气泡状态
const handleSelectionUpdate = () => {
    aiBubbleMenuVisible.value = false;
}

onMounted(() => {
    // 监听编辑器的选区更新事件
    props.editor.on('selectionUpdate', handleSelectionUpdate)
})

onUnmounted(() => {
    // 清理事件监听
    props.editor.off('selectionUpdate', handleSelectionUpdate)
})

const bubbleMenuMap = {
    bold: Bold,
    italic: Italic,
    underline: Underline,
    strike: Strike,
    fontSize: FontSize,
    textColor: TextColor,
    backgroundColor: BackgroundColor,
    ai: Ai,
}
const isTitleActive = useActive(props.editor, 'title')
// editor.state 与  editor.view.state??
const shouldShow = ({ editor, state }: { editor: any; state: any }) => {
    // 确保编辑器可编辑
    if (!editor.isEditable) {
        return false
    }

    // 新增：拖拽场景下不显示气泡
    if (globalTiptapStorage.value.__dragging) return false

    // 确保有选择内容
    if (state.selection.empty) {
        return false
    }

    // 如果是单元格选择，不显示文本气泡菜单
    if ((state.selection as any).$anchorCell && (state.selection as any).$headCell) {
        return false
    }

    // 检查是否在其他特殊节点中
    if (OTHER_BUBBLE_MENU_TYPES.some(type => editor.isActive(type))) {
        return false
    }

    // 其他情况都显示文本气泡菜单
    return true
}
const defaultBubbleMenuItems = [
    'ai',
    '|',
    'bold',
    'italic',
    'underline',
    'strike',
    'fontSize',
    'textColor',
    'backgroundColor',
]
const bubbleMenuItems = computed(() => {
    return props.textBubbleMenu?.items ?? defaultBubbleMenuItems
})
const handleCloseMenuBubble = () => {
    // 取消选区：将光标折叠到选区末尾
    const { to } = props.editor.state.selection
    props.editor.chain().focus().setTextSelection(to).run()
}
// 显示ai二级气泡
const showAiBubble = async () => {
    aiBubbleMenuVisible.value = true;
    // 等待 DOM 更新后再触发位置更新
    await nextTick()
    props.editor.commands.setMeta('bubbleMenu', 'updatePosition')
}
</script>
<style scoped lang="less"></style>