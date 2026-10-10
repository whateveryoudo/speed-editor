import type { UserInfo } from "@speed-editor/shared";
import { useFloatingPopup } from "@ek/hooks/useFloatingPopup";
import { VueRenderer } from "@tiptap/vue-3";
import MentionList from "./MentionList.vue";
export const getMentionSuggestion = (option: {
  mentionUserFetch: (query: string) => Promise<UserInfo[]>;
}) => {
  return {
    items: async ({ query }: any) => {
      if (option.mentionUserFetch) {
        return await option.mentionUserFetch(query);
      }
      // const route = Vrouter.currentRoute.value
      // // 这里传入一个较大的参数
      // const res = await getOrgUser(route?.params?.org as string, {
      //   page: 1,
      //   size: 1000
      // });
      // const data = (res.data.records || []).map(item => item.userDTO.name)
      // return data.filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
      console.warn("请传入mentionUserFetch函数，用于获取用户列表");
      return [];
    },

    render: () => {
      let component: any;
      const { showPopup, updatePopupPosition, hidePopup } = useFloatingPopup({
        placement: "bottom-start",
        offset: 4,
        padding: 8,
      });

      return {
        onStart: (props: any) => {
          const isEditable = props.editor.isEditable;
          if (!isEditable) return;
          component = new VueRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          showPopup(component, props.clientRect);
        },

        onUpdate: (props: any) => {
          const isEditable = props.editor.isEditable;
          if (!isEditable) return;

          component.updateProps(props);
          updatePopupPosition(props.clientRect);
        },

        onKeyDown: (props: any) => {
          if (props.event.key === "Escape") {
            hidePopup();
            return true;
          }

          return component.ref?.onKeyDown(props);
        },

        onExit: () => {
          hidePopup();
          component.destroy();
        },
      };
    },
  };
};
