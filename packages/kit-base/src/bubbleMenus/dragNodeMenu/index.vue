<template>
    <DragHandle :editor="editor" pluginKey="speed-tiptap-draghandle" @node-change="onNodeChange"
        @drag-state-change="onDragStateChange">
        <div class="speed-drag-handle" title="拖拽或点击">
            <Dropdown trigger="click" placement="bottom" v-model:open="isOpen">
                <HolderOutlined />
                <template #overlay>
                    <Menu class="w-[150px]" @click="handleMenuClick">
                        <template v-for="item in dropdownMenuItems" :key="item.key">
                            <Popover v-model:open="changePopoverOpen" :title="false"
                                :getPopupContainer="(trigger: any) => trigger.parentElement"
                                v-if="'change' === item.key && item.children && item.children.length" placement="right">
                                <template #content>
                                    <Flex vertical :gap="5">
                                        <Space>
                                            <Tooltip v-for="child in (item.children || []).slice(0, 6)"
                                                :key="child.key" :title="child.label">
                                                <Button type="text"
                                                    :class="[nodeChangeActivedMap[child.key as keyof typeof nodeChangeActivedMap] ? 'is-active' : '', 'shadow-btn-wrapper']"
                                                    :key="child.key" @click="handleChangeNode(child)">
                                                    <s-icon-font :size="16" :type="child.icon"
                                                        v-if="typeof child.icon === 'string'" />
                                                    <s-icon-font v-else :icon-render="child.icon" />
                                                </Button>
                                            </Tooltip>
                                        </Space>
                                        <Space>
                                            <Tooltip v-for="child in (item.children || []).slice(6)" :key="child.key"
                                                :title="child.label">
                                                <Button type="text"
                                                    :class="[nodeChangeActivedMap[child.key as keyof typeof nodeChangeActivedMap] ? 'is-active' : '', 'shadow-btn-wrapper']"
                                                    :key="child.key" @click="handleChangeNode(child)">
                                                    <s-icon-font :size="16" :type="child.icon"
                                                        v-if="typeof child.icon === 'string'" />
                                                    <s-icon-font v-else :icon-render="child.icon" />
                                                </Button>
                                            </Tooltip>
                                        </Space>
                                    </Flex>
                                </template>
                                <MenuItem :key="item.key">
                                    <div class="flex justify-between items-center">
                                        <span>
                                            <component :is="item.icon" class="mr-2" />
                                            {{ item.label }}
                                        </span>
                                        <RightOutlined />
                                    </div>
                                </MenuItem>
                            </Popover>
                            <template v-else>
                                <MenuItem v-if="item.type !== 'divider'" :key="item.key"
                                    :danger="item.key === 'delete'">
                                    <component :is="item.icon" class="mr-2" />
                                    {{ item.label }}
                                </MenuItem>
                                <MenuDivider v-else />
                            </template>
                        </template>
                    </Menu>
                </template>
            </Dropdown>
        </div>
    </DragHandle>
</template>

<script setup lang="tsx">
import { Button, Dropdown, Flex, Menu, MenuDivider, MenuItem, Popover, Space, Tooltip } from 'ant-design-vue'
import { ref, type PropType, computed } from "vue";
import type { Editor } from "@tiptap/core";
import { DragHandle } from "@kb/components/dragHandle";
import { useActive } from '@speed-editor/composables'
import { TextSelection } from '@tiptap/pm/state'
import { useBubble } from "@kb/hooks/useBubble";
import {
    HolderOutlined,
    CopyOutlined,
    DeleteOutlined,
    ScissorOutlined,
    SyncOutlined,
    UnorderedListOutlined,
    OrderedListOutlined,
    CodeOutlined,
    FileTextOutlined,
    RightOutlined,
} from "@ant-design/icons-vue";
import { useSpeedEditor } from '@speed-editor/composables';
const props = defineProps({
    editor: {
        type: Object as PropType<Editor>,
        required: true,
    },
});
// 当前悬停节点
let hoverNode: any = ref(null);
const hoverNodeTypeName = computed(() => {
    return hoverNode.value?.type?.name ?? '';
})
let lastHoverDom: Element | null = null;
const isOpen = ref(false);
const changePopoverOpen = ref(false);
const { handleDelNode, handleCopyNode, handleCutNode } = useBubble(props.editor, {});

const dropdownMenuItems = computed(() => {

    return [
        hoverNodeTypeName.value === 'table' ? null : {
            key: "change",
            label: "转化为",
            icon: () => <SyncOutlined />,
            children: [
                {
                    key: "h1",
                    icon: "icon-kl-h1",
                    label: "标题1",
                },
                {
                    key: "h2",
                    icon: "icon-kl-h2",
                    label: "标题2",
                },
                {
                    key: "h3",
                    icon: "icon-kl-h3",
                    label: "标题3",
                },
                {
                    key: "h4",
                    icon: "icon-kl-h4",
                    label: "标题4",
                },
                {
                    key: "h5",
                    icon: "icon-kl-h5",
                    label: "标题5",
                },
                {
                    key: "h6",
                    icon: "icon-kl-h6",
                    label: "标题6",
                },
                {
                    key: "text",
                    icon: "icon-kl-text",
                    label: "文本",
                },
                {
                    key: "bulletList",
                    icon: () => <UnorderedListOutlined />,
                    label: "无序列表",
                },
                {
                    key: "orderedList",
                    icon: () => <OrderedListOutlined />,
                    label: "有序列表",
                },
                {
                    key: "taskList",
                    icon: "icon-kl-task",
                    label: "任务列表",
                },

                {
                    key: "codeBlock",
                    icon: () => <CodeOutlined />,
                    label: "代码块",
                },
                {
                    key: "callout",
                    icon: () => <FileTextOutlined />,
                    label: "高亮块",
                }
            ],
        },
        hoverNodeTypeName.value === 'table' ? null : {
            type: "divider",
        },
        {
            key: "copy",
            label: "复制",
            icon: () => <CopyOutlined />,
        },

        {
            key: "cut",
            label: "剪切",
            icon: () => <ScissorOutlined />,
        },
        {
            key: "delete",
            danger: true,
            label: "删除",
            icon: () => <DeleteOutlined />,
        },
    ].filter(item => !!item)
});
const { updateGlobalTiptapStorageFunc } = useSpeedEditor();
const isH1Active = useActive(props.editor, 'heading', { level: 1 })
const isH2Active = useActive(props.editor, 'heading', { level: 2 })
const isH3Active = useActive(props.editor, 'heading', { level: 3 })
const isH4Active = useActive(props.editor, 'heading', { level: 4 })
const isH5Active = useActive(props.editor, 'heading', { level: 5 })
const isH6Active = useActive(props.editor, 'heading', { level: 6 })

const isTextActive = useActive(props.editor, 'paragraph')
const isCalloutActive = useActive(props.editor, 'callout')
const isCodeBlockActive = useActive(props.editor, 'codeBlock')
const isBulletListActive = useActive(props.editor, 'bulletList')
const isOrderedListActive = useActive(props.editor, 'orderedList')
const isTaskListActive = useActive(props.editor, 'taskList')

const nodeChangeActivedMap = computed(() => {
    return {
        h1: isH1Active.value,
        h2: isH2Active.value,
        h3: isH3Active.value,
        h4: isH4Active.value,
        h5: isH5Active.value,
        h6: isH6Active.value,
        text: isTextActive.value && !isCalloutActive.value && !isCodeBlockActive.value && !isBulletListActive.value && !isOrderedListActive.value && !isTaskListActive.value,
        callout: isCalloutActive.value,
        codeBlock: isCodeBlockActive.value,
        bulletList: isBulletListActive.value,
        orderedList: isOrderedListActive.value,
        taskList: isTaskListActive.value,
    }
});


function onNodeChange(
    payload: { node: any; editor: Editor; pos: number } | null
) {
    // 清除上一个高亮
    if (lastHoverDom) {
        lastHoverDom.classList.remove("speed-tiptap-drag-node-hover");
        lastHoverDom = null;
    }
    if (!payload || !payload.node) {
        // hoverNode.value = null; 这里不要置空（可能会有个情况，我hover到了一个空的p，然后移动到另外一个有值的拖拽句柄上就会出现问题）
        return;
    }
    // p 不生效？
    hoverNode.value = payload.node || null;
    // const node = payload.editor.view.nodeDOM(payload.pos) as any;
    // lastHoverDom = node;
    // requestAnimationFrame(() => {
    //     node.classList.add('speed-tiptap-drag-node-hover')
    // })
}

// 提取：将 callout 转换为普通段落的通用逻辑
const convertCalloutToParagraph = () => {
    props.editor.chain().focus().command(({ state, tr, dispatch }) => {
        const { $from } = state.selection
        // 向上找到 callout 的深度
        let d = $from.depth
        while (d > 0 && $from.node(d).type.name !== 'callout') d--
        if (d === 0 && $from.node(0).type.name !== 'callout') return false

        const calloutPos = $from.before(d)
        const calloutNode = state.doc.nodeAt(calloutPos)
        if (!calloutNode) return false

        const paragraph = state.schema.nodes.paragraph
        const textContent = calloutNode.textContent || ''
        const textNode = textContent ? state.schema.text(textContent) : null
        const para = paragraph.create(null, textNode ?? undefined)

        // 替换为段落并将光标定位到新段落文本末尾
        tr.replaceWith(calloutPos, calloutPos + calloutNode.nodeSize, para)
        const insideParaPos = calloutPos + 1 + textContent.length
        tr.setSelection(TextSelection.create(tr.doc, insideParaPos))
        if (dispatch) dispatch(tr.scrollIntoView())
        return true
    }).run()
}

//  节点转换
const handleChangeNode = (node: any) => {
    const currentNodeType = hoverNode.value?.type?.name;

    // 如果当前是 callout，需要先转换为段落，再转换为目标节点
    // （除非目标就是 callout 或 text）
    if (currentNodeType === 'callout' && !['callout', 'text'].includes(node.key)) {
        // 先转换为段落
        convertCalloutToParagraph()
        // 等待下一帧再执行后续转换，确保 DOM 更新完成
        requestAnimationFrame(() => {
            handleNodeConversion(node)
            // 关闭所有弹窗
            closeAllMenus()
        })
        return;
    }

    // 处理 callout 相关的转换
    if (node.key === 'callout') {
        if (currentNodeType === 'callout') {
            // callout -> text: 将 callout 转换为普通段落
            convertCalloutToParagraph()
        } else {
            // 其他节点 -> callout
            const text = hoverNode.value?.textContent;
            props.editor.chain().focus().deleteNode(currentNodeType).setCallout(text).run()
        }
        closeAllMenus()
        return;
    }

    // 处理 text 转换
    if ('text' === node.key) {
        if (currentNodeType === 'callout') {
            // callout -> text
            convertCalloutToParagraph()
        } else {
            props.editor.chain().focus().setParagraph().run()
        }
        closeAllMenus()
        return;
    }

    // 其他节点转换
    handleNodeConversion(node)

    // 关闭所有弹窗
    closeAllMenus()
}
// 菜单点击

const handleMenuClick = (item: any) => {
    console.log(hoverNode.value);
    const hoverNodeName = hoverNode.value?.type?.name;
    if (hoverNodeName) {
        if (item.key === 'copy') {
            handleCopyNode(hoverNodeName)
        } else if (item.key === 'cut') {
            handleCutNode(hoverNodeName)
        } else if (item.key === 'delete') {
            handleDelNode(hoverNodeName)
        }
        // 关闭菜单
        closeAllMenus()
    }

}
// 关闭所有菜单和弹窗
const closeAllMenus = () => {
    changePopoverOpen.value = false;
    isOpen.value = false;
}

// 提取：处理具体的节点转换逻辑
const handleNodeConversion = (node: any) => {
    // 处理标题转换
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.key)) {
        const level = node.key.match(/\d+/)?.[0] ?? 3;
        props.editor.chain().focus().toggleHeading({ level: Number(level) as any }).run();
        return;
    }

    // 处理其他节点类型
    if (node.key === 'bulletList') {
        props.editor.chain().focus().toggleBulletList().run()
    } else if (node.key === 'orderedList') {
        props.editor.chain().focus().toggleOrderedList().run()
    } else if (node.key === 'taskList') {
        props.editor.chain().focus().toggleTaskList().run()
    } else if (node.key === 'codeBlock') {
        props.editor.chain().focus().setCodeBlock({ language: 'plaintext' }).run()
    } else if (node.key === 'blockquote') {
        props.editor.chain().focus().toggleBlockquote().run()
    }
}
// 拖拽状态变化回调
function onDragStateChange(isDragging: boolean) {
    updateGlobalTiptapStorageFunc("__dragging", isDragging);
}
</script>

<style scoped lang="less"></style>
