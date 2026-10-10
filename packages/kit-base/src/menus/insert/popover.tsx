/*
 * @Author: ykx
 * @Date: 2022-11-10 19:15:40
 * @LastEditTime: 2022-12-29 11:37:00
 * @LastEditors: your name
 * @Description: 插入菜单
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\insert\popover.vue
 */

import {
  PropType,
  ref,
  inject,
  type Ref,
  defineComponent,
  computed,
} from "vue";
import { Editor } from "@tiptap/core";
import BaseList from "./baseList.tsx";
import { useActive } from "@speed-editor/composables";
import styles from "./popover.module.less";
import { PlusCircleFilled } from "@ant-design/icons-vue";
import { Popover, Tooltip, Button } from "ant-design-vue";
import { useSpeedEditor } from "@speed-editor/composables";
export default defineComponent({
  name: "InsertPopover",
  components: {
    BaseList,
    Popover,
    Tooltip,
    Button,
  },
  props: {
    editor: {
      type: Object as PropType<Editor>,
      default: () => ({}),
    },
    insertMenuConfig: {
      type: Object as PropType<Record<string, any>>,
      default: undefined,
    },
  },
  setup(props) {
    const open = ref(false);
    const isTitleActive = useActive(props.editor, 'title');
    const { editableCpt } = useSpeedEditor();
    const disableMenu = computed(() => {
      return isTitleActive.value || !editableCpt.value;
    });
    const handleTriggerVisible = (val: boolean) => {
      open.value = val;
    };

    return () => (
      <>
        {!disableMenu.value ? (
          <Popover
            v-model:open={open.value}
            overlayClassName="menu-popover-wrapper"
            trigger="click"
            placement="bottomLeft"
            content={
              <BaseList
                editor={props.editor}
                insertMenuConfig={props.insertMenuConfig}
                triggerType="menu"
                onTriggerVisible={handleTriggerVisible}
              />
            }
          >
            <Tooltip title="插入">
              <Button type="text" class="shadow-btn-wrapper">
                <PlusCircleFilled class={[styles["tip-icon"]]} />
              </Button>
            </Tooltip>
          </Popover>
        ) : (
          <Button type="text" class="shadow-btn-wrapper" disabled>
            <PlusCircleFilled
              class={[styles["tip-icon"], styles["disabled"]]}
            />
          </Button>
        )}
      </>
    );
  },
});
