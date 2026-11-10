<template>

    <Space>
        <template :key="item.key" v-for="item in tableItems" :title="item.title">
            <!-- 使用自定义组件 -->
            <template v-if="item.useComponnent">
                <component :is="item.iconRender" :action="item.action" :editor="editor" />
            </template>
            <!-- 使用配置式 -->
            <template v-else>
                <!-- 普通按钮：支持 Tooltip 提示 -->
                <Tooltip v-if="!item.children" :title="item.title">
                    <Button type="text" class="shadow-btn-wrapper" :disabled="item.disabled?.(editor)"
                        @click="handleItemClick(item, $event)">
                        <component :is="item.iconRender" />
                    </Button>
                </Tooltip>
                <!-- 带有下拉项：直接使用 Dropdown，杜绝 Tooltip 与 Dropdown 双浮层冲突抖动 -->
                <Dropdown v-else :trigger="['hover', 'click']">
                    <Button type="text" class="shadow-btn-wrapper" :disabled="item.disabled">
                        <component :is="item.iconRender" />
                    </Button>
                    <template #overlay>
                        <Menu>
                            <MenuItem v-for="child in item.children" :key="child.key"
                                @click="handleItemClick(child, $event)">
                                <component :is="child.iconRender" />
                                {{ child.title }}
                            </MenuItem>
                        </Menu>
                    </template>
                </Dropdown>
            </template>
        </template>

    </Space>
</template>
<script setup lang="ts">
import { Button, Dropdown, Menu, MenuItem, Space, Tooltip } from 'ant-design-vue'
import type { Editor } from '@tiptap/vue-3'
import type { TableBubbleMenuItem } from './useTableBubbleMenu'
const props = defineProps<{
    editor: Editor
    tableItems: TableBubbleMenuItem[]
}>()
// 处理菜单项点击事件
const handleItemClick = (item: any, event: MouseEvent) => {

    if (item.action) {
        item.action(props.editor)
    }
}
</script>
