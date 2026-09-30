<!--
 * @Author: ykx
 * @Date: 2022-11-15 16:17:06
 * @LastEditTime: 2022-12-15 15:18:59
 * @LastEditors: your name
 * @Description: 附件插入
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\bold.vue
-->
<template>
  <Tooltip placement="bottom"  :title="disableMenu ? null : '附件'">
    <Button type="text" @click="handleClickImg" class="shadow-btn-wrapper"
      :class="[isFileActive ? 'is-active' : '', isTitleActive && 'disabled']" :disabled="disableMenu">
      <PaperClipOutlined />
      </Button>
      <input ref="FileInput" @change="handleFileChange" :multiple="fileConfig?.multiple ?? true" type="file"
        :accept="fileConfig?.accept ?? '.docx,.doc,.txt,.lake,.lakebook,.lakesheet,.pdf,.xls,.xlsx,.xlsm,.csv,.pptx,.ppt,.pages,.numbers,.key,.keynote,.md,.mark,.markdown,.xmind,.mindnode,.mmap,.mm,.rp,.psd,.sketch,.svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic,.heif,.ts,.mp3,.mpga,.wav,.bat,.c,.cpp,.css,.go,.h,.java,.js,.json,.jsonl,.log,.m,.mkd,.php,.py,.r,.sh,.sql,.xml,.jmx,.yaml,.yml,.ipynb,.mp4'" hidden />
  </Tooltip>
</template>

<script setup lang="ts">
import { Button, Tooltip } from 'ant-design-vue'
import { inject, ref, type Ref, computed } from 'vue'
import { Editor } from '@tiptap/core'
import { PaperClipOutlined } from '@ant-design/icons-vue'
import { useActive } from '@speed-tiptap-editor/composables'
import { useSpeedEditor } from '@speed-tiptap-editor/composables';
const props = withDefaults(defineProps<{
  editor: Editor,
  triggerType?: 'menu' | 'bubble'
}>(), {
  editor: () => ({}) as Editor,
  triggerType: 'menu'
})

const FileInput = ref<HTMLInputElement>()
const { speedTiptapConfig, editableCpt } = useSpeedEditor();
const { file: fileConfig } = speedTiptapConfig.value;
const isTitleActive = useActive(props.editor, 'title')
const disableMenu = computed(() => {
  return isTitleActive.value || !editableCpt.value
})
const isFileActive = useActive(props.editor, 'attachment')
const handleFileChange = (event: any) => {
  props.editor.chain().focus().uploadAttachment(event?.target?.files).run()
}
const handleClickImg = () => {
  FileInput.value?.click()
}
</script>

<style scoped lang="less"></style>
