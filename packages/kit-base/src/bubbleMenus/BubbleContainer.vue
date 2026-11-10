<!--
 * @Author: ykx
 * @Date: 2022-11-16 18:21:23
 * @LastEditTime: 2023-01-09 16:23:18
 * @LastEditors: your name
 * @Description: 气泡容器
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\link\bubble.vue
-->
<template>
  <BaseBubbleMenu
    :editor="editor"
    :options="options"
    :should-show="shouldShow"
    :plugin-key="pluginKey"
  >
    <div :class="['bubble-menu-wrapper', bubbleClassName || '']" style="position: relative; z-index: 1000;">
      <slot />
    </div>
  </BaseBubbleMenu>
</template>

<script setup lang="ts">
import { type Editor } from "@tiptap/core";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/vue-3/menus";

type BubbleMenuOptions = {
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end"
    | "left-start"
    | "left-end"
    | "right-start"
    | "right-end";
  offset?: number;
  strategy?: "absolute" | "fixed";
};

const props = withDefaults(
  defineProps<{
    bubbleClassName?: string
    editor: Editor;
    shouldShow: ({ editor, state }: { editor: any; state: any }) => boolean;
    options?: BubbleMenuOptions;
    pluginKey: string;
  }>(),
  {
    options: () => ({
      placement: "top",
      offset: 8,
      strategy: "absolute",
    }),
    pluginKey: "bubble-menu",
  }
);
</script>

<style scoped lang="less"></style>
