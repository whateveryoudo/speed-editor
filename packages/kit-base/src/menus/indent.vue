<!--
 * @Author: Claude
 * @Description: 缩进菜单组件
-->
<template>
    <Popover v-if="!disableMenu" overlay-class-name="toolbar-popover-wrapper indent-popover-wrapper" trigger="click"
        placement="bottom">
        <template #content>
            <ul class="text-list-wrapper">
                <li v-for="item in indentButtons" :key="item.key" class="list-item">
                    <Button type="text" class="shadow-btn-wrapper" @click="item.action"
                        style="width: 100%; text-align: left;">
                        <s-icon-font :icon-render="item.iconRender" />
                        {{ item.tip }}
                    </Button>
                </li>
            </ul>
        </template>
        <Tooltip placement="bottom">
            <template #title>
                缩进
            </template>
            <Button type="text" class="shadow-btn-wrapper">
                <MenuUnfoldOutlined />
                <caret-down-outlined class="dropdown-trigger" />
            </Button>
        </Tooltip>
    </Popover>
    <Tooltip v-else :title="false" class="menu-disabled">
        <Button type="text" class="shadow-btn-wrapper" disabled>
            <MenuUnfoldOutlined />
            <caret-down-outlined class="dropdown-trigger" />
        </Button>
    </Tooltip>
</template>

<script setup lang="tsx">
import { Button, Popover, Tooltip } from 'ant-design-vue'
import { type Editor } from '@tiptap/core'
import { CaretDownOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons-vue'
import { useActive } from '@speed-editor/composables'
import { ref, type VNode, PropType, computed } from 'vue'
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps({
    editor: {
        type: Object as PropType<Editor>,
        default: () => ({}),
    },
})

type IndentType = 'outdent' | 'indent'

const isTitleActive = useActive(props.editor, 'title')
const { editableCpt } = useSpeedEditor();
const disableMenu = computed(() => {
    return isTitleActive.value || !editableCpt.value
})
// 当前选中的按钮
const selectButton = computed(() => {
    return indentButtons.value[0]
})

interface IndentButton {
    key: IndentType
    tip: string
    iconRender?: (opt?: any) => VNode
    action?: () => void
}

const indentButtons = ref<IndentButton[]>([
    {
        key: 'indent',
        tip: '增加缩进',
        iconRender: () => <MenuUnfoldOutlined />,
        action: () => {
            props.editor.commands.indent()
        },
    },
    {
        key: 'outdent',
        tip: '减少缩进',
        iconRender: () => <MenuFoldOutlined />,
        action: () => {
            props.editor.commands.outdent()
        },
    },

])
</script>

<style lang="less">
.indent-popover-wrapper {


    .text-list-wrapper {
        padding: 4px 0;
        margin: 0;
        width: 120px;

        .list-item {
            position: relative;
            padding: 0 10px;
            display: flex;
            align-items: center;
            height: 35px;
            justify-content: flex-start;
        }
    }
}
</style>