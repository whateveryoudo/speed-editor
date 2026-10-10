<!--
 * @Author: ykx
 * @Date: 2022-11-16 18:21:23
 * @LastEditTime: 2023-01-09 11:12:21
 * @LastEditors: your name
 * @Description: 气泡工具-标签
 * @FilePath: \we-knowledge-base\src\tiptap\editor\collaboration\bubbleMenus\ImageMenu\index.vue
-->
<template>
  <BubbleContainer :editor="editor" plugin-key="tag-bubble-menu" :should-show="shouldShow">
    <Space :size="5">
      <Input placeholder="请输入标签" :value="attributes.text" @change="handleTextChange">
      </Input>
      <Divider type="vertical" class="menu-divider" />
      <template v-for="(item, index) in fixedOptions" :key="item.color">
        <span :style="{ backgroundColor: item.bgColor }"
          class="shadow-btn-wrapper cursor-pointer w-[25px] h-[25px] rounded-[2px] flex items-center justify-center"
          @click="handleSelectOption(index)">
          <CheckOutlined v-if="index === selectedOptionIndex" :style="{ color: item.color }" />
          <span v-else :style="{ color: item.color }">A</span>
        </span>
      </template>
      <Popover trigger="click" placement="right">
        <template #content>
          <Flex vertical :gap="20" class="w-[150px]">
            <Flex :gap="5" align="center">
              <span class="flex-shrink-0">文字颜色:</span>
              <ColorPicker placement="right" class="flex-1  h-[15px]" :cur-color="attributes.color"
                @triggerColor="(color: string) => handleUpdateAttributes({ color })">
                <span :style="{ backgroundColor: attributes.color }"
                  class="cursor-pointer border border-solid border-gray-200"></span>
              </ColorPicker>
            </Flex>
            <Flex :gap="5" align="center">
              <span class="flex-shrink-0">背景颜色:</span>
              <ColorPicker class="flex-1 h-[15px]" placement="right" :cur-color="attributes.bgColor"
                @triggerColor="(color: string) => handleUpdateAttributes({ bgColor: color })">
                <span :style="{ backgroundColor: attributes.bgColor }"
                  class="cursor-pointer border border-solid border-gray-200"></span>
              </ColorPicker>
            </Flex>
          </Flex>
        </template>
        <Button type="primary" size="small"> 自定义 </Button>
      </Popover>
    </Space>
  </BubbleContainer>
</template>

<script setup lang="ts">
import { Button, Divider, Flex, Input, Popover, Space } from 'ant-design-vue'
import { PropType, computed, ref, watch } from "vue";
import BubbleContainer from "../BubbleContainer.vue";
import { useAttributes } from "@speed-editor/composables";
import { type Editor } from "@tiptap/core";
import ColorPicker from "@kb/components/colorPicker/index.vue";
import { CheckOutlined } from '@ant-design/icons-vue'
import { debounce } from "lodash-es";
const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    default: () => ({}),
  },
});

const fixedOptions = [
  { color: "rgb(153, 153, 153)", bgColor: "rgba(0, 0, 0, 0.05)" },
  { color: "rgb(200, 78, 67)", bgColor: "rgb(252, 223, 220)" },
  { color: "rgb(63, 133, 255)", bgColor: "rgb(217, 231, 255)" },
  { color: "rgb(240, 196, 23)", bgColor: "rgb(255, 245, 210)" },
  { color: "rgb(5, 205, 153)", bgColor: "rgb(205, 245, 235)" },
];
const attributes = useAttributes<{
  text: string;
  color: string;
  bgColor: string;
}>(props.editor, 'tag', {
  text: "",
  color: "",
  bgColor: "",
});

// 这里通过color和bgColor来判断选中的选项
const selectedOptionIndex = computed(() => {
  const tagetIndex = fixedOptions.findIndex(item => item.color === attributes.value.color && item.bgColor === attributes.value.bgColor);
  if (tagetIndex === -1) {
    return 0;
  }
  return tagetIndex;
});
const isActiveTag = computed(() => {
  return props?.editor.isActive('tag');
});

const shouldShow = () => {
  return (
    props?.editor?.isEditable &&
    !props?.editor.view.state.selection.empty &&
    isActiveTag.value
  );
};
// 标签文本改变(追加防抖，连续更新会导致气泡关闭)
const handleTextChange = debounce((e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  handleUpdateAttributes({ text: value });
}, 500)

// 直接调用属性更新(这里追加setNodeSelection，保证更新属性后节点依然选中气泡不消失）
const handleUpdateAttributes = (attrs: any) => {
  props.editor?.chain().focus().updateAttributes('tag', attrs).setNodeSelection(props.editor.state.selection.from).run();
};
const handleSelectOption = (index: number) => {
  handleUpdateAttributes(fixedOptions[index]);
};




</script>

<style scoped lang="less"></style>
