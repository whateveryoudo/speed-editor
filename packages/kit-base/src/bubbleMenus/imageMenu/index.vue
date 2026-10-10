<!--
 * @Author: ykx
 * @Date: 2022-11-16 18:21:23
 * @LastEditTime: 2023-01-09 11:12:21
 * @LastEditors: your name
 * @Description: 气泡工具-图片
 * @FilePath: \we-knowledge-base\src\tiptap\editor\collaboration\bubbleMenus\ImageMenu\index.vue
-->
<template>
  <BubbleContainer :editor="editor" plugin-key="image-bubble-menu" :should-show="shouldShow">
    <Space :size="5">

      <!-- 尺寸设置 -->
      <SizeSetting v-if="isActiveImage" :editor="editor" />
      <Tooltip title="锁定比例">
        <div :class="['shadow-bg-wrapper', equalProportion ? 'is-active' : '']" @click="handleLockProportion">
          <s-icon-font type="icon-kl-lock-size"></s-icon-font>
        </div>
      </Tooltip>
      <!-- 直接调用通用的居中配置 -->
      <align v-if="isActiveImage" :editor="editor" placement="top"></align>
      <Tooltip v-if="isActiveImage" title="预览">
        <div :class="['shadow-bg-wrapper']" @click="handlePreivew">
          <eye-outlined />
        </div>
      </Tooltip>
      <Tooltip title="复制">
        <div :class="['shadow-bg-wrapper']" @click="handleCopyNode('image')">
          <copy-outlined />
        </div>
      </Tooltip>
      <speed-tooltip title="删除">
        <div :class="['shadow-bg-wrapper']" @click="handleDelNode('image')">
          <delete-outlined />
        </div>
      </speed-tooltip>
    </Space>
  </BubbleContainer>
</template>

<script setup lang="ts">
import { Space, Tooltip } from 'ant-design-vue'
import { PropType, computed } from "vue";
import BubbleContainer from "../BubbleContainer.vue";
import align from "@kb/menus/align";
import SizeSetting from "./SizeSetting.vue";
import { useBubble } from "@kb/hooks/useBubble";
import { useAttributes } from "@speed-editor/composables";
import { useSpeedEditor } from "@speed-editor/composables";
import {
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
} from "@ant-design/icons-vue";
import { type Editor } from "@tiptap/core";
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
});
const isActiveImage = computed(() => {
  return (
    props?.editor.isActive('image') &&
    !!props?.editor.getAttributes('image').src
  );
});

const { handleDelNode, handleCopyNode } = useBubble(props?.editor, {});
const shouldShow = () => {
  return (
    props?.editor?.isEditable &&
    !props?.editor.view.state.selection.empty &&
    isActiveImage.value
  );
};
// 图片专有
const src = useAttributes(
  props.editor,
  'image',
  { src: "" },
  (attrs) => attrs.src
);
const equalProportion = useAttributes(
  props.editor,
  'image',
  { equalProportion: true },
  (attrs) => attrs.equalProportion
);

const { previewInstance } = useSpeedEditor();
const handlePreivew = () => {
  if (previewInstance.value) {
    // token 由 EditorPreviewImage 内部拼接
    previewInstance.value.previewImage(src.value);
  }
};
const handleLockProportion = () => {
  props.editor?.chain()
    .focus()
    .updateAttributes('image', { equalProportion: !equalProportion.value })
    .setNodeSelection(props.editor.state.selection.from)
    .run()
};
</script>

<style scoped lang="less"></style>
