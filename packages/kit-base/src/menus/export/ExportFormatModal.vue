<template>
    占位
    <!-- <s-full-modal :width="600" :footer="false" :visible="visible" @cancel="emit('update:visible', false)" height="auto"
        title="文件导出">
        <Flex v-if="currentView === 'progress'">
            <Space class="cursor-pointer text-[var(--ant-color-text-secondary)]" @click="currentView = 'select'">
                <ArrowLeftOutlined />
                重新选择
            </Space>
        </Flex>

        <div v-show="currentView === 'select'" class="p-4 flex gap-4 justify-around">
            <div @click="handleExport(item.value)" v-for="item in exportItems" :key="item.value"
                class="w-[140px] py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                <Flex vertical :key="item.value" align="center" justify="center">
                    <img class="w-[70px] h-[70px]" :src="item.icon" />
                    <span class="text-sm truncate">{{ item.label }}</span>
                    <span class="text-xs text-gray-500">{{ item.desc }}</span>
                </Flex>
            </div>

        </div>

        <div v-show="currentView === 'progress' && exportTasks.length > 0">
            <div v-for="task in exportTasks" :key="task.id"
                class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex items-center gap-3">
                    <img class="w-8 h-8" :src="task.icon" />
                    <div>
                        <div class="text-sm font-medium">{{ task.fileName }}</div>
                        <div class="text-xs text-gray-500">{{ task.type }}</div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <Tooltip v-if="task.status === 'success'" title="点击下载">
                        <DownloadOutlined class="cursor-pointer text-xl text-[var(--ant-color-primary)]"
                            @click="handleDownloadFile(task.result)" />
                    </Tooltip>
    <Progress v-if="task.status === 'processing'" type="circle" trail-color="#e6f4ff" :percent="task.progress"
        :stroke-width="20" :size="20" />

    <CloseCircleOutlined v-if="task.status === 'error'" class="text-red-500 text-xl" />

    <CheckCircleOutlined v-if="task.status === 'success'" class="text-green-500 text-xl" />
    </div>


    </div>
    </div>

    <div v-if="exportingLen > 0 && currentView === 'select'" class="mt-4 p-2 bg-blue-50 rounded-lg">
        <Button type="link" @click="currentView = 'progress'" class="p-0 h-auto">
            当前 {{ exportingLen }} 个导出任务
        </Button>
    </div>
    </s-full-modal> -->
</template>

<!-- <script setup lang="ts">
import { Button, Flex, Progress, Space, Tooltip } from 'ant-design-vue'
import { ref, computed, watch } from 'vue'
import { type Editor } from '@tiptap/core'
import { ArrowLeftOutlined, CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import WordIcon from '@kb/assets/image/menus/word.svg'
import MarkdownIcon from '@kb/assets/image/menus/markdown.svg'
import SpeedIcon from '@kb/assets/image/menus/speed.svg'
import ImageIcon from '@kb/assets/image/menus/image.svg'
import { handleWordExport } from '@speed-editor/document-io'
import { handleMarkdownExport } from '@speed-editor/document-io'
import { handleSpeedExport } from '@speed-editor/document-io'
import { handleImageExport } from '@speed-editor/document-io'
import { type ExportSuccessResult } from '@speed-editor/document-io'
import { downloadFile } from '@speed-editor/document-io'
const props = withDefaults(defineProps<{
    visible: boolean
    editor: Editor
}>(), {
    visible: false
})

const emit = defineEmits(['update:visible'])

// 界面状态
const currentView = ref<'select' | 'progress'>('select')

// 导出任务管理
interface ExportTask {
    id: string
    fileName: string
    type: string
    icon: string
    status: 'processing' | 'success' | 'error'
    progress: number
    result?: any // 存入处理后的结果
}

const exportTasks = ref<ExportTask[]>([])

/**
 * 计算正在进行的导出任务数量
 * 用于显示底部任务提示
 */
const exportingLen = computed(() => {
    return exportTasks.value.filter(task => task.status === 'processing').length
})

const exportItems = ref([
    {
        label: 'Word',
        value: 'word',
        icon: WordIcon,
        desc: '.docx 格式'
    },
    {
        label: 'Markdown',
        value: 'markdown',
        icon: MarkdownIcon,
        desc: '.md 格式'
    },
    {
        label: 'Speed Editor文档',
        value: 'speed',
        icon: SpeedIcon,
        desc: '.sd 格式'
    },
    {
        label: '图片',
        value: 'image',
        icon: ImageIcon,
        desc: '.jpg 格式'
    },
])

/**
 * 处理导出类型选择
 * 根据用户选择的文件类型调用相应的导出处理函数
 * @param value 导出类型值（'word' | 'markdown' | 'speed' | 'image'）
 */
const handleExport = (value: string) => {
    // 获取title节点
    const titleNode = props.editor.getJSON().content.find(node => node.type === 'title');
    const title = titleNode?.content?.[0]?.text ?? '';
    // 清空导出任务记录
    exportTasks.value = []
    switch (value) {
        case 'word':
            handleWordExportTask(title)
            break
        case 'markdown':
            handleMarkdownExportTask(title)
            break
        case 'speed':
            handleSpeedExportTask(title)
            break
        case 'image':
            handleImageExportTask(title)
            break
    }
}

/**
 * 创建导出任务对象
 * @param type 文件类型（如 'Word', 'Markdown', 'Speed'）
 * @param fileName 文件名
 * @param icon 图标组件
 * @returns 导出任务对象
 */
const createExportTask = (type: string, fileName: string, icon: string): ExportTask => {
    const taskId = `${type.toLowerCase()}_${Date.now()}`
    return {
        id: taskId,
        fileName,
        type,
        icon,
        status: 'processing',
        progress: 0
    }
}

/**
 * 更新当前正在进行的导出任务
 * @param updates 要更新的任务属性
 */
const updateCurrentTask = (updates: Partial<ExportTask>) => {
    const currentTask = exportTasks.value[exportTasks.value.length - 1] // 目前仅允许选择1个
    if (currentTask) {
        Object.assign(currentTask, updates)
    }
}

/**
 * 通用的导出处理逻辑
 * 处理文件导出、任务创建、进度更新、状态管理等通用流程
 * @param exportHandler 导出处理函数（如 handleWordExport）
 * @param type 文件类型名称
 * @param icon 文件类型图标
 * @param fileName 文件名
 */
const handleExportWithTask = (
    exportHandler: any,
    title: string,
    type: string,
    icon: string,
    fileName?: string
) => {
    if (!props.editor) {
        return
    }
    const defaultFileName = `${type.toLowerCase()}_${new Date().getTime()}`
    const finalFileName = fileName || defaultFileName

    const newTask = createExportTask(type, finalFileName, icon)
    exportTasks.value.push(newTask)
    currentView.value = 'progress'

    exportHandler(
        props.editor,
        title,
        finalFileName,
        (progress: number) => updateCurrentTask({ progress }),
        (result: ExportSuccessResult) => updateCurrentTask({ status: 'success', progress: 100, result }),
        (error: any) => updateCurrentTask({ status: 'error' })
    )
}

/**
 * 处理 Word 文档导出
 * 创建 Word 导出任务并启动导出流程
 */
const handleWordExportTask = (title: string) => {

    handleExportWithTask(handleWordExport, title, 'Word', WordIcon, `${title}.docx`)
}

/**
 * 处理 Markdown 文档导出
 * 创建 Markdown 导出任务并启动导出流程
 */
const handleMarkdownExportTask = (title: string) => {
    handleExportWithTask(handleMarkdownExport, title, 'Markdown', MarkdownIcon, `${title}.md`)
}

/**
 * 处理 Speed 文档导出
 * 创建 Speed 导出任务并启动导出流程
 */
const handleSpeedExportTask = (title: string) => {
    handleExportWithTask(handleSpeedExport, title, 'Speed', SpeedIcon, `${title}.sd`)
}

/**
 * 处理图片导出
 * 创建图片导出任务并启动导出流程
 */
const handleImageExportTask = (title: string) => {
    handleExportWithTask(handleImageExport, title, '图片', ImageIcon, `${title}.jpg`)
}
// 点击下载（直接使用解析结果）
const handleDownloadFile = (result: ExportSuccessResult) => {
    const blob = new Blob([result.value], { type: result.type })
    downloadFile(blob, result.fileName)
}

watch(() => props.visible, (newVal: boolean) => {
    if (newVal) {
        // 重置状态
        exportTasks.value = [];
        currentView.value = 'select';
    }
}, {
    immediate: true
})
</script> -->

<!-- <style scoped lang="less"></style> -->
