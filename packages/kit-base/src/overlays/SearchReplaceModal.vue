<template>
    <div class="search-replace-modal" v-if="searchReplaceVisible && isEnabled" :style="modalStyle">
        <Card ref="modalRef" style="box-shadow: 0 8px 16px 4px rgba(0,0,0,.04)">
            <template #title>
                <FileSearchOutlined class="mr-2" />
                <span>查找替换</span>
            </template>
            <template #extra><close-outlined @click="updateSearchReplaceVisible(false)" /></template>
            <Flex vertical :gap="15">
                <Flex>
                    <Input allow-clear @press-enter="goToResult('next')" v-model:value="search" @change="handleSearch"
                        placeholder="需要查找的字符">
                        <template #suffix>
                            <Space :size="5">
                                {{ resultLength > 0 ? resultIndex + 1 : 0 }}<span>/</span>{{ resultLength }}
                            </Space>
                        </template>
                    </Input>
                    <!-- <Space>
                        <Button :disabled="resultLength === 0" @click="goToResult('next')" type="text"
                            class="shadow-btn-wrapper">
                            <DownOutlined/>
                        </Button>
                        <Button :disabled="resultLength === 0"
                            @click="goToResult('previous')" type="text" class="shadow-btn-wrapper">
                            <UpOutlined/>
                        </Button>
                    </Space> -->
                </Flex>
                <Flex>
                    <!-- 改变时调用一次doSearch -->
                    <Input v-model:value="replace" @change="() => doSearch()" placeholder="要替换的字符" />
                </Flex>
                <Space>
                    <Checkbox v-model:checked="caseSensitive">区分大小写</Checkbox>
                </Space>
                <Flex justify="end" size="small" :gap="10">
                    <Button :disabled="resultLength === 0" @click="handleReplace">替换</Button>
                    <Button :disabled="resultLength === 0" @click="handleReplaceAll">替换全部</Button>
                    <Button :disabled="resultLength === 0" @click="goToResult('previous')">上一个</Button>
                    <Button :disabled="resultLength === 0" @click="goToResult('next')">下一个</Button>
                </Flex>
            </Flex>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { Button, Card, Checkbox, Flex, Input, Space } from 'ant-design-vue'
import { ref, inject, computed } from 'vue'
import { CloseOutlined } from '@ant-design/icons-vue'
import { Editor } from '@tiptap/core'
import { useSpeedEditor } from '@speed-editor/composables'
import { FileSearchOutlined } from '@ant-design/icons-vue'
const props = withDefaults(defineProps<{
    editor: Editor
}>(), {
    editor: () => ({}) as Editor
})
const { searchReplaceVisible, updateSearchReplaceVisible, speedTiptapConfig } = useSpeedEditor();
const modalRef = ref<HTMLDivElement>()
const search = ref('')
const replace = ref('')
const caseSensitive = ref(false)

const isEnabled = computed(() => speedTiptapConfig?.value?.searchReplace?.enabled !== false)
const modalStyle = computed(() => {
    return speedTiptapConfig?.value?.searchReplace?.style || {}
})

// 当前结果显示索引
const resultIndex = computed(() => props.editor.storage.searchAndReplace?.resultIndex || 0)
// 搜索结果项总数
const resultLength = computed(() => props.editor.storage.searchAndReplace?.results.length || 0)


const doSearch = (isReset = false) => {

    if (isReset) {
        props.editor.commands.resetIndex() // 重置搜索结果索引
    }
    props.editor.commands.setSearchTerm(search.value)
    props.editor.commands.setReplaceTerm(replace.value)
    props.editor.commands.setCaseSensitive(caseSensitive.value)
}

const handleSearch = () => {
    doSearch(true)
}

const goToResult = (type: 'previous' | 'next') => {
    if (type === 'previous') {
        props.editor.commands.previousSearchResult()
    } else {
        props.editor.commands.nextSearchResult();
    }
    // 这里不要使用computed获取
    const { results, resultIndex } = props.editor.storage.searchAndReplace
    const position = results[resultIndex];
    if (!position) {
        return
    }
    props.editor.commands.setTextSelection(position.from);
    const { node } = props.editor.view.domAtPos(
        props.editor.state.selection.anchor,
    )
        ; (node as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })

}

const handleReplace = () => {
    props.editor.commands.replace(replace.value)
}

const handleReplaceAll = () => {
    props.editor.commands.replaceAll()
}

</script>

<style lang="less">
.search-replace-modal {
    position: fixed;
    z-index: 1000;
    width: 450px;
    top: 60px;
    right: 24px;
}
</style>