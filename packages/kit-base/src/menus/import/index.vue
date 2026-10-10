<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:17:06
 * @LastEditTime: 2022-12-15 15:18:59
 * @LastEditors: your name
 * @Description: 粗体
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\bold.vue
-->
<template>
    <Tooltip placement="bottom" :title="editableCpt ? '文件导入' : null">
        <Button type="text" class="shadow-btn-wrapper" v-on="buttonEvents" :disabled="!editableCpt">
            <ImportOutlined />
        </Button>
    </Tooltip>
    <ImportFormatModal :editor="editor" v-model:visible="modalVisible" />
</template>

<script setup lang="ts">
import { Button, Tooltip } from 'ant-design-vue'
import { Editor } from '@tiptap/core'
import { ImportOutlined } from '@ant-design/icons-vue'
import { useMenuButtonEvents } from '@speed-editor/composables'
import ImportFormatModal from './ImportFormatModal.vue'
import { ref } from 'vue'
import { useSpeedEditor } from '@speed-editor/composables';
const props = withDefaults(defineProps<{
    editor: Editor,
    triggerType?: 'menu' | 'bubble'
}>(), {
    editor: () => ({}) as Editor,
    triggerType: 'menu'
})
const modalVisible = ref(false)
const { editableCpt } = useSpeedEditor();
const buttonEvents = useMenuButtonEvents(() => {
    modalVisible.value = true
}, props.triggerType)
</script>

<style scoped lang="less"></style>