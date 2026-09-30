<!--
 * @Author: ykx
 * @Date: 2022-11-18 17:07:13
 * @LastEditTime: 2022-11-18 20:14:54
 * @LastEditors: your name
 * @Description: 自定义部分颜色选择(pop的内部动态控制无效，disabled无效，一直会触发)
 * @FilePath: \we-knowledge-base\src\components\colorPicker\index.vue
-->

<template>
  <Popover :placement="placement" v-if="!disabled" overlay-class-name="speed-tiptap-editor color-board-popover-wrapper"
    trigger="click" placement="bottomLeft">
    <template #content>
      <div class="color-board-wrapper">
        <div class="top-choosed-wrapper transition-bg"
          @mousedown.prevent="chooseColor(showDefault ? defaultColor : null)">
          <div v-if="showDefault" class="top-choosed-item">
            <span class="color-board-item"><span class="color-inner"
                :style="{ backgroundColor: defaultColor }" /></span>
            默认
          </div>
          <div v-else class="top-choosed-item">
            <span class="color-board-item no-color"><span class="color-inner" /></span>
            无填充色
          </div>
        </div>
        <ul class="color-board-list-wrapper">
          <li v-for="(color, index) in colors" :key="index" class="color-board-item"
            @mousedown.prevent="chooseColor(color)">
            <span class="color-inner" :style="{ backgroundColor: color }" />
            <check-outlined v-if="color === curColor" class="checked-icon" />
          </li>
        </ul>
        <div class="px-2 mb-2">
          最近使用的自定义颜色
        </div>
        <ul class="color-board-list-wrapper">
          <li v-for="(color, index) in customColors" :key="'custom-' + index" class="color-board-item"
            @mousedown.prevent="chooseColor(color)">
            <span class="color-inner" :style="`background-color: ${color}`" />
            <check-outlined v-if="color === curColor" class="checked-icon" />
          </li>
        </ul>
        <!-- 自定义颜色选择：这里没法设置vue-color的mouseDown事件,会造成bubbleMenu闪烁 -->
        <s-color-picker placement="right" :color="curColor" @update:color="chooseColor">
          <!-- 这里需要包一个div?? -->
          <div>
            <Flex align="center" justify="space-between"
              class="px-2 py-2 cursor-pointer hover:bg-gray-100 rounded-b-[4px] border-t border-solid border-l-0 border-r-0 border-b-0 border-gray-200">
              <Flex align="center" :gap="6">
                <img :src="CustomColor" alt="自定义颜色" class="w-[17px] h-[auto]">
                更多颜色
              </Flex>
              <CaretRightOutlined />
            </Flex>
          </div>
        </s-color-picker>
      </div>
    </template>
    <slot />
  </Popover>
  <slot v-else />
</template>

<script setup lang="tsx">
import { Flex, Popover } from 'ant-design-vue'
import { CaretRightOutlined, CheckOutlined } from '@ant-design/icons-vue'
import { ref, PropType, onMounted } from 'vue'
import { colors, type ColorType } from './data'
import CustomColor from '@kb/assets/image/custom-color.png'
import { createKeysLocalStorageLRUCache } from '@kb/helpers/lru-cache';

const defaultColor: ColorType = '#000000'
const LOCAL_KEY = 'RECENT_CUSTOM_COLORS'
const MAX_CUSTOM_COLORS = 9
const colorCache = createKeysLocalStorageLRUCache(LOCAL_KEY, MAX_CUSTOM_COLORS);

const props = defineProps({
  curColor: {
    type: String as PropType<ColorType>,
    default: '',
  },
  showDefault: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placement: {
    type: String as PropType<string>,
    default: 'bottomLeft',
  },
})
const emit = defineEmits(['triggerColor'])
const visible = ref(false)

// 自定义颜色收集逻辑
const customColors = ref<ColorType[]>([])

const loadCustomColors = () => {
  const cachedColors = colorCache.get();
  if (Array.isArray(cachedColors)) {
    customColors.value = cachedColors;
  }
}

const chooseColor = (color: ColorType) => {
  emit('triggerColor', color)
  visible.value = false
  // 只对自定义颜色进行收集
  if (color && !colors.includes(color)) {
    colorCache.put(color);
    loadCustomColors(); // 重新加载以获取最新顺序
  }
}

const handleOpen = () => {
  visible.value = !props.disabled
}

onMounted(() => {
  loadCustomColors()
})
</script>
<style lang="less">
// 增加命名空间，防止sheet影响
.speed-tiptap-editor.color-board-popover-wrapper {
  width: 240px;

  .ant-popover-inner {
    padding: 0;
  }

  .color-board-wrapper {
    padding-top: 5px;

    .top-choosed-item {
      display: flex;
      padding: 8px;
      cursor: pointer;
      align-items: center;

      .color-board-item {
        margin-right: 5px;
      }

      .no-color {
        background-color: transparent;

        &>span {
          border: 1px solid #f4f5f5;

          &::after {
            position: absolute;
            top: 8px;
            left: 0;
            display: block;
            width: 17px;
            height: 0;
            content: '';
            transform: rotate(45deg);
            border-bottom: 2px solid #ff5151;
          }
        }
      }
    }

    .color-board-list-wrapper {
      margin: 0;
      padding: 8px;
      font-size: 0;
    }
  }

  .color-board-item {
    width: 24px;
    height: 24px;
    padding: 2px 2px;
    display: inline-block;
    border-radius: 3px 3px;
    border: 1px solid transparent;
    flex: 0 0 auto;
    cursor: pointer;
    position: relative;

    &:hover {
      border: 1px solid #d8dad9;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    }

    &>span.color-inner {
      position: relative;
      width: 18px;
      height: 18px;
      display: block;
      border-radius: 2px 2px;
    }

    .checked-icon {
      font-size: 12px;
      color: #fff;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}
</style>
