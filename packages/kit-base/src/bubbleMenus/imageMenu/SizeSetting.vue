<!--
 * @Author: ykx
 * @Date: 2024-01-01 00:00:00
 * @LastEditTime: 2024-01-01 00:00:00
 * @LastEditors: ykx
 * @Description: 图片尺寸设置组件
 * @FilePath: src/bubbleMenus/ImageMenu/SizeSetting.vue
-->
<template>
    <Popover v-model:open="visible" overlay-class-name="size-popover-wrapper" trigger="click" placement="bottom"
        :destroy-tooltip-on-hide="true">
        <template #content>
            <div class="size-setting-content">
                <!-- 手动输入尺寸 -->
                <div class="size-inputs">
                    <div class="input-group">
                        <label>宽度:</label>
                        <Input v-model:value="tempWidth" placeholder="宽度" @blur="handleWidthBlur"
                            @input="handleWidthInput" :disabled="!hasOriginalSize" />
                    </div>
                    <div class="input-group">
                        <label>高度:</label>
                        <Input v-model:value="tempHeight" placeholder="高度" @blur="handleHeightBlur"
                            @input="handleHeightInput" :disabled="!hasOriginalSize" />
                    </div>
                </div>

                <!-- 百分比选择 -->
                <div class="percentage-buttons" v-if="hasOriginalSize">
                    <div class="percentage-label">快速设置:</div>
                    <Segmented block :value="attributes.percent" @change="handlePercentChange"
                        :options="percentageOptions" />
                </div>

                <!-- 原始尺寸信息 -->
                <div class="original-size" v-if="hasOriginalSize">
                    <span class="original-info">原始尺寸: {{ originalWidth }} × {{ originalHeight }}px</span>
                </div>
            </div>
        </template>

        <Tooltip title="尺寸设置">
            <div class="shadow-bg-wrapper">
                <s-icon-font type="icon-kl-measurement-1" :size="16" />
            </div>
        </Tooltip>
    </Popover>
</template>

<script setup lang="ts">
import { Input, Popover, Segmented, Tooltip } from 'ant-design-vue'
import { ref, computed, watch, PropType } from 'vue'
import { Editor } from '@tiptap/core'
import { useAttributes } from '@speed-editor/composables'

const props = defineProps({
    editor: {
        type: Object as PropType<Editor>,
        default: () => ({}),
    },
})

const visible = ref(false)
const tempWidth = ref('')
const tempHeight = ref('')

// 获取图片属性
const attributes = useAttributes<{
    width: number
    height: number
    percent: number
    originalWidth?: number
    originalHeight?: number
}>(props.editor, 'image', {
    width: 0,
    height: 0,
    percent: 100,
    originalWidth: 0,
    originalHeight: 0,
})

// 百分比选项
const percentageOptions = [{ value: 25, label: '25%' }, { value: 50, label: '50%' }, { value: 75, label: '75%' }, { value: 100, label: '100%' }]



const originalWidth = computed(() => attributes.value.originalWidth || 0)
const originalHeight = computed(() => attributes.value.originalHeight || 0)

// 计算属性
const hasOriginalSize = computed(() => {
    return originalWidth.value > 0 && originalHeight.value > 0
})


// 监听属性变化，更新临时值
watch(() => [attributes.value.width, attributes.value.height], ([width, height]) => {
    tempWidth.value = width ? width.toString() : ''
    tempHeight.value = height ? height.toString() : ''
}, { immediate: true })

// 处理宽度输入
const handleWidthInput = () => {
    if (!tempWidth.value || !hasOriginalSize.value) return

    const newWidth = parseFloat(tempWidth.value)
    if (isNaN(newWidth) || newWidth <= 0) return

    // 按比例计算高度
    const aspectRatio = originalHeight.value / originalWidth.value
    const newHeight = Math.round(newWidth * aspectRatio)

    tempHeight.value = newHeight.toString()
}

// 处理高度输入
const handleHeightInput = () => {
    if (!tempHeight.value || !hasOriginalSize.value) return

    const newHeight = parseFloat(tempHeight.value)
    if (isNaN(newHeight) || newHeight <= 0) return

    // 按比例计算宽度
    const aspectRatio = originalWidth.value / originalHeight.value
    const newWidth = Math.round(newHeight * aspectRatio)

    tempWidth.value = newWidth.toString()
}

// 处理宽度失焦
const handleWidthBlur = () => {
    const width = parseFloat(tempWidth.value)
    const height = parseFloat(tempHeight.value)

    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        updateImageSize(width, height)
    }
}

// 处理高度失焦
const handleHeightBlur = () => {
    const width = parseFloat(tempWidth.value)
    const height = parseFloat(tempHeight.value)

    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        updateImageSize(width, height)
    }
}

// 处理百分比改变
const handlePercentChange = (percent: number) => {
    if (!hasOriginalSize.value) return

    const newWidth = Math.round((originalWidth.value * percent) / 100)
    const newHeight = Math.round((originalHeight.value * percent) / 100)

    tempWidth.value = newWidth.toString()
    tempHeight.value = newHeight.toString()

    updateImageSize(newWidth, newHeight, percent)
}

console.log(props.editor.state.selection.from);
// 更新图片尺寸
const updateImageSize = (width: number, height: number, percent = 100) => {
    // 更新后保持节点选中，避免气泡消失
    console.log(props.editor.state.selection.from);
    props.editor?.chain()
        .focus()
        .updateAttributes('image', { width, height, percent })
        .setNodeSelection(props.editor.state.selection.from)
        .run()
}

// 监听弹窗显示状态
watch(visible, (newVisible) => {
    if (newVisible) {
        // 弹窗打开时，同步当前值
        tempWidth.value = attributes.value.width ? attributes.value.width.toString() : ''
        tempHeight.value = attributes.value.height ? attributes.value.height.toString() : ''
    }
})
</script>

<style lang="less" scoped>
.size-setting-content {
    width: 280px;

    .size-inputs {
        margin-bottom: 16px;
        display: flex;
        gap: 10px;

        .input-group {
            flex: 1;
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            gap: 5px;

            label {
                font-size: 12px;
                color: #666;
                flex-shrink: 0;
            }

            .ant-input {
                flex: 1;
            }
        }
    }

    .percentage-buttons {
        margin-bottom: 12px;

        .percentage-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
        }
    }

    .original-size {
        padding-top: 8px;
        border-top: 1px solid #f0f0f0;

        .original-info {
            font-size: 11px;
            color: #999;
        }
    }
}

:deep(.size-popover-wrapper) {
    .ant-popover-inner {
        border-radius: 6px;
    }

    .ant-popover-inner-content {
        padding: 12px;
    }
}
</style>
