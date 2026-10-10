import { defineComponent, computed, type PropType } from 'vue'
import type { Editor } from '@tiptap/core'
import type { BubbleMenuKey } from '@speed-editor/shared'
import TextMenu from './textMenu/index.vue'
import ImageMenu from './imageMenu/index.vue'
import TableMenu from './tableMenu/index.vue'
import TableBubbleMenu from './tableMenu/Bubble.vue'
import AttachmentMenu from './attachmentMenu/index.vue'
import TagMenu from './tagMenu/index.vue'
import CalloutMenu from './calloutMenu/index.vue'
import DragNodeMenu from './dragNodeMenu/index.vue'

const bubbleMenuComponents: Record<
  BubbleMenuKey,
  Array<{ name: string; component: any }>
> = {
  text: [{ name: 'TextMenu', component: TextMenu }],
  tag: [{ name: 'TagMenu', component: TagMenu }],
  image: [{ name: 'ImageMenu', component: ImageMenu }],
  attachment: [{ name: 'AttachmentMenu', component: AttachmentMenu }],
  table: [
    { name: 'TableMenu', component: TableMenu },
    { name: 'TableBubbleMenu', component: TableBubbleMenu },
  ],
  callout: [{ name: 'CalloutMenu', component: CalloutMenu }],
  drag: [{ name: 'DragNodeMenu', component: DragNodeMenu }],
}

export default defineComponent({
  name: 'BubbleMenuBar',
  props: {
    editor: {
      type: Object as PropType<Editor>,
      required: true,
    },
    bubbleMenus: {
      type: Array as PropType<BubbleMenuKey[]>,
      default: () => [],
    },
    textBubbleMenu: {
      type: Object as PropType<{
        enabled?: boolean
        items?: Array<string | { icon: string; title: string; action?: (editor: unknown) => void }>
      }>,
      default: () => ({ enabled: true }),
    },
  },
  setup(props) {
    const activeBubbleMenus = computed(() => {
      return props.bubbleMenus.filter((key) => {
        if (key === 'text') {
          return props.textBubbleMenu?.enabled !== false
        }
        return true
      })
    })

    return () => (
      <>
        {activeBubbleMenus.value.flatMap((key) => {
          const items = bubbleMenuComponents[key] || []
          return items.map(({ name, component: Component }) => (
            <Component
              key={name}
              editor={props.editor}
              {...(key === 'text' ? { textBubbleMenu: props.textBubbleMenu } : {})}
            />
          ))
        })}
      </>
    )
  },
})
