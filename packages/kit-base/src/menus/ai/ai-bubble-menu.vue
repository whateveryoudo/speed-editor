<template>
    <div @click="emit('closeMenuBubble')" class="w-[600px] flex flex-col gap-2">
        <div @click.stop v-if="session.status !== 'idle' && session.result"
            class="ai-result-wrapper hljs-theme-github-light">
            <div class="ai-markdown-preview" v-html="resultHtml" />
        </div>
        <!-- 顶部提示词输入 -->
        <div @click.stop :class="['ai-input']">
            <img :src="AiPromptIcon" alt="ai-prompt-icon"
                :class="['w-[18px] h-[auto] prompt-icon', isProcessing ? 'loading-rotate' : '']" />
            <div class="input-wrapper">
                <div class="textarea-wrapper">
                    <span v-if="isProcessing" class="pending-text">{{ pendingText }}
                        <span class="dot">.</span>
                        <span class="dot">.</span>
                        <span class="dot">.</span>
                    </span>
                    <Textarea v-else ref="textAreaRef" auto-size v-model:value="inputValue" placeholder="向智能助手提问..."
                        :maxlength="1000" @press-enter="inputSendSession" />

                </div>
            </div>
            <Button v-if="inputValue && !isProcessing" type="text"
                class="self-end text-[var(--ant-color-text-secondary)] px-[6px] py-[5px]" @click="handleSendClick">
                <template #icon>
                    <span
                        class="mr-2 border border-solid border-gray-300 w-[18px] h-[18px] leading-[18px] flex rounded-[4px]">
                        <EnterOutlined :style="{ color: 'rgba(0, 0, 0, 0.65)' }" />
                    </span>
                </template>
                发送
            </Button>
            <Button v-if="isProcessing" type="text"
                class="self-end text-[var(--ant-color-text-secondary)] px-[6px] py-[5px]" @click="cancelProcess">
                <template #icon>
                    <span
                        class="mr-2 border border-solid border-gray-300 w-[40px] h-[18px] leading-[18px] flex rounded-[4px]">
                        <span class="text-[var(--ant-color-text-secondary)]">ESC</span>
                    </span>
                </template>
                停止
            </Button>
            <Tooltip title="关闭" @click="emit('closeMenuBubble')">
                <CloseOutlined />
            </Tooltip>
        </div>
        <!-- 这里追加一个div,阻止冒泡 -->
        <div @click.stop class="w-[200px]">
            <!-- 生成结果,或者取消后的操作菜单 -->

            <Menu v-if="['cancelled', 'success'].includes(session.status)"
                @click="({ key }: any) => handleResultAction(key)" :selectable="false" class="ai-commands-menu"
                :items="finishedItems" />
            <!-- 快捷指令菜单 -->
            <Menu v-else @click="({ key }: any) => handleAICommand(key as AIAction)" :selectable="false"
                class="ai-commands-menu" :disabled="isProcessing">
                <template v-for="item in aiCommandsItems" :key="item.key">
                    <MenuDivider v-if="item.type === 'divider'"></MenuDivider>
                    <MenuItem :key="item.key" v-else :disabled="isProcessing">
                        <s-icon-font :size="16" :type="item.icon" class="mr-2" />
                        {{ item.label }}
                    </MenuItem>
                </template>
            </Menu>
        </div>

    </div>
</template>

<script setup lang="tsx">
import { ref, computed } from 'vue'
import { Button, Menu, MenuDivider, MenuItem, Textarea, Tooltip, message } from 'ant-design-vue'
import type { Editor } from '@tiptap/core'
import { useAiAssistant, type AIAction, type AIProcessOptions } from '@kb/hooks/useAiAssistant'
import AiPromptIcon from '@kb/assets/image/ai-prompt-icon.svg'
import { getSelectedText } from '@kb/prose-utils/text'
import { CheckOutlined, SyncOutlined, CloseOutlined, EnterOutlined } from '@ant-design/icons-vue';
import { markdownToHTML, markdownToJSON } from '@kb/helpers/markdown'
import { importKit } from '@speed-editor/schema'
// Props 定义
const props = defineProps<{
    editor: Editor
}>()

// 使用 AI 助手 Hook
const {
    processTextStream,
    cancelProcess,
    session,
    resetSession,
    pendingText
} = useAiAssistant()
const resultHtml = computed(() => {
    if (!session.value.result) return ''
    return markdownToHTML(session.value.result)
})
const isProcessing = computed(() => session.value.status === 'pending')

const emit = defineEmits<{
    (e: 'closeMenuBubble'): void,
}>()
/**
 * 保存最后一次的 AI 操作参数，用于重新生成
 */
const lastAIOptions = ref<AIProcessOptions | null>(null)

// 状态管理
const inputValue = ref('')

// AI 指令菜单配置
const aiCommandsItems = [
    {
        label: '改进写作',
        key: 'refactor',
        icon: 'icon-kl-refactor'
    },
    {
        label: '检查拼写和语法',
        key: 'check',
        icon: 'icon-kl-check-write'
    },
    {
        label: '简化内容',
        key: 'simple',
        icon: 'icon-kl-simple-text'
    },
    {
        label: '丰富内容',
        key: 'rich',
        icon: 'icon-kl-rich-text'
    },
    { type: 'divider' as const },
    {
        label: '翻译',
        key: 'translate',
        icon: 'icon-kl-zh-en'
    },
    {
        label: '总结',
        key: 'summary',
        icon: 'icon-kl-summary'
    }
]

const finishedItems = [
    {
        label: '替换选中内容',
        key: 'replace',
        icon: () => <CheckOutlined />,
    },
    {
        label: '插入到选区下方',
        key: 'insert-below',
        icon: () => <CheckOutlined />,
    },
    { type: 'divider' as const },
    {
        label: '重新生成',
        key: 'regenerate',
        icon: () => <SyncOutlined />,
    },
]


/**
 * 处理 AI 指令
 */
const handleAICommand = async (action: AIAction) => {
    const options = { action, content: getSelectedText(props.editor) }
    lastAIOptions.value = options
    await processTextStream(options)
}

/**
 * 处理自定义提示词输入
 */
const inputSendSession = async (event: KeyboardEvent) => {
    // 如果按住 Shift + Enter，允许换行
    if (event.shiftKey) {
        return
    }

    // 阻止默认的换行行为
    event.preventDefault()
    if (!inputValue.value.trim()) {
        message.warning('请输入提示词')
        return
    }
    const options = {
        action: 'custom' as AIAction,
        content: getSelectedText(props.editor),
        customPrompt: inputValue.value
    }
    lastAIOptions.value = options
    const success = await processTextStream(options)

    if (success) {
        inputValue.value = '' // 清空输入框
    }
}

/**
 * 发送按钮点击处理
 */
const handleSendClick = () => {
    // 创建一个模拟的 Enter 事件
    inputSendSession(new KeyboardEvent('keydown', { key: 'Enter' }) as any)
}

/**
 * 替换选中的文本
 * 将 Markdown 转为 Tiptap JSON 格式后插入（原生格式，最佳实践）
 */
const replaceSelectedText = (markdownText: string) => {
    try {
        const { from, to } = props.editor.state.selection
        const jsonDoc = markdownToJSON(markdownText, importKit)

        // generateJSON 返回：{ type: 'doc', content: [...] } — 插入时只要 content
        const content = jsonDoc.content || []

        props.editor.chain().focus().deleteRange({ from, to }).insertContent(content).run()
        message.success('已替换选中内容')
    } catch (error) {
        console.error('转换 Markdown 失败:', error)
        message.error('内容转换失败，请重试')
    }
}

/**
 * 插入内容到选区下方
 * 将 Markdown 转为 Tiptap JSON 格式后插入（原生格式，最佳实践）
 */
const insertBelowSelection = (markdownText: string) => {
    let jsonDoc: any = null
    try {
        jsonDoc = markdownToJSON(markdownText, importKit)
    } catch (error) {
        console.error('转换 Markdown 失败:', error)
        message.error('内容转换失败，请重试')
        return
    }
    const content = jsonDoc.content || []
    const { to } = props.editor.state.selection
    props.editor.chain().focus().insertContentAt(to, content).run()
    message.success('已插入到选区下方')
}

/**
 * 处理结果操作（替换、插入、重新生成）
 */
const handleResultAction = async (action: string) => {
    if (action === 'replace') {
        if (!session.value.result) {
            message.warning('没有可应用的结果')
            return
        }
        replaceSelectedText(session.value.result)
        resetSession()
    } else if (action === 'insert-below') {
        if (!session.value.result) {
            message.warning('没有可插入的结果')
            return
        }
        insertBelowSelection(session.value.result)
        resetSession()
    } else if (action === 'regenerate') {
        if (!lastAIOptions.value) {
            message.warning('没有可重新生成的操作')
            return
        }
        resetSession()
        await processTextStream(lastAIOptions.value as AIProcessOptions)
    }
}
</script>
<style lang="less">
/* ✅ 平滑的逆时针圆形轨迹动画（小幅度） */
@keyframes orbit {
    0% {
        transform: translate(0, -2px);
        /* 正上方 12点 */
    }

    12.5% {
        transform: translate(-1.4px, -1.4px);
        /* 左上 10点半 */
    }

    25% {
        transform: translate(-2px, 0);
        /* 正左 9点 */
    }

    37.5% {
        transform: translate(-1.4px, 1.4px);
        /* 左下 7点半 */
    }

    50% {
        transform: translate(0, 2px);
        /* 正下 6点 */
    }

    62.5% {
        transform: translate(1.4px, 1.4px);
        /* 右下 4点半 */
    }

    75% {
        transform: translate(2px, 0);
        /* 正右 3点 */
    }

    87.5% {
        transform: translate(1.4px, -1.4px);
        /* 右上 1点半 */
    }

    100% {
        transform: translate(0, -2px);
        /* 回到正上方 12点 */
    }
}
</style>
<style lang="less" scoped>
.ai-input {
    border: 1px solid rgba(126, 134, 142, 0.16);
    background: #fff;
    border-radius: 6px;
    padding: 8px;
    display: flex;
    gap: 5px;
    align-items: flex-start;

    .input-wrapper {
        flex: 1;

        textarea {
            display: flex;
            box-sizing: border-box;
            border-radius: 6px;
            outline: none;
            border: none;
            height: 100%;
            padding: 0 5px;
            width: 100%;
            resize: none;
            background-color: transparent;
        }

        // 去掉focus样式

        :deep(.ant-input:focus),
        :deep(.ant-input-focused) {
            box-shadow: none;
            border: none;
        }
    }



}

.ai-commands-menu,
.ai-actions-menu,
.ai-result-wrapper {
    border: 1px solid rgba(126, 134, 142, 0.16);
    background: #fff;
    border-radius: 6px;
}

.ai-result-wrapper {
    max-height: 300px;
    overflow-y: auto;
    padding: 12px;

    .result-tip {
        padding: 6px 8px;
        background: rgba(24, 144, 255, 0.06);
        border-left: 2px solid #1890ff;
        border-radius: 4px;
        margin-bottom: 12px;
    }

    :deep(.ai-markdown-preview) {
        font-size: 14px;

        p {
            margin: 10px 0;
        }

        pre {
            margin: 10px 0;
            border-radius: 6px;
            overflow-x: auto;
        }

        code {
            font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
        }

        ul,
        ol {
            padding-left: 1.5em;
            margin: 10px 0;
        }

        blockquote {
            margin: 10px 0;
            padding-left: 12px;
            border-left: 3px solid rgba(126, 134, 142, 0.4);
            color: rgba(0, 0, 0, 0.65);
        }
    }

}

.prompt-icon {
    &.loading-rotate {
        animation: orbit 1.2s linear infinite;
        /* 逆时针绕圈 */
    }
}

/* 循环省略号动画：三个点依次出现并循环 */
.pending-text {
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    margin-left: 5px;
}

.pending-text .dot {
    display: inline-block;
    width: 4px;
    margin-left: 2px;
    opacity: 0;
}

// 显示循环点位动画
/* 需求：开始三点都隐藏 → 1 出现 → 2 出现 → 3 出现 → 都隐藏 → 循环 */
.pending-text .dot:nth-of-type(1) {
    animation: dot1Cycle 1.5s infinite both;
}

.pending-text .dot:nth-of-type(2) {
    animation: dot2Cycle 1.5s infinite both;
}

.pending-text .dot:nth-of-type(3) {
    animation: dot3Cycle 1.5s infinite both;
}

@keyframes dot1Cycle {

    /* 开始隐藏 */
    0%,
    9% {
        opacity: 0;
    }

    /* dot1 出现并保持，直到统一隐藏阶段 */
    10%,
    90% {
        opacity: 1;
    }

    /* 统一隐藏 */
    91%,
    100% {
        opacity: 0;
    }
}

@keyframes dot2Cycle {

    0%,
    39% {
        opacity: 0;
    }

    40%,
    90% {
        opacity: 1;
    }

    91%,
    100% {
        opacity: 0;
    }
}

@keyframes dot3Cycle {

    0%,
    69% {
        opacity: 0;
    }

    70%,
    90% {
        opacity: 1;
    }

    91%,
    100% {
        opacity: 0;
    }
}
</style>