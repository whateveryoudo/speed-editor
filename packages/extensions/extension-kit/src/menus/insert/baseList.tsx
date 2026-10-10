/*
 * @Author: ykx
 * @Date: 2022-12-28 16:12:25
 * @LastEditTime: 2022-12-29 14:53:23
 * @LastEditors: your name
 * @Description: 基础插入菜单示例（用于顶部左上角和输入/快捷插入）
 * @FilePath: \we-knowledge-base\src\tiptap\core\menus\insert\baseList.tsx
 */
import { type Editor } from '@tiptap/core'
import { ref, watch, computed, onMounted, defineComponent, inject, type Ref } from 'vue'
import { Input, Space, Button, Popover, Empty } from 'ant-design-vue'
import { RightOutlined } from '@ant-design/icons-vue'
import { type SubMenuGroup, type MenuGroup, useCommand } from './useCommand'
import { createKeysLocalStorageLRUCache } from '@ek/helpers/lru-cache'
import AutoExpandTableSelect from './autoExpandTableSelect.vue'
import styles from './baseList.module.less'
import { useSpeedEditor } from '@speed-editor/composables';

export default defineComponent({
  name: 'BaseList',
  props: {
    editor: {
      type: Object as () => Editor,
      required: true
    },
    query: {
      type: String,
      default: ''
    },
    command: {
      type: Function,
      default: undefined
    },
    items: {
      type: Array as () => MenuGroup[],
      default: () => []
    },
    triggerType: {
      type: String as () => 'bubble' | 'menu',
      default: 'menu'
    },
    // 插入菜单的配置
    insertMenuConfig: {
      type: Object as () => Record<string, any>,
      default: undefined
    }
  },
  emits: ['triggerVisible'],
  setup(props, { emit, expose }) {
    const { speedTiptapConfig } = useSpeedEditor();
    const effectiveInsertConfig = computed(() => {
      const base = props.insertMenuConfig || {}
      const excludeKeys = props.insertMenuConfig?.excludeKeys ?? speedTiptapConfig.value?.quickInsertExcludeKeys
      return {
        ...base,
        ...(excludeKeys ? { excludeKeys } : {}),
      }
    })
    const { menuGroup, flatLeafMenu } = useCommand(effectiveInsertConfig)
    const { image, file } = speedTiptapConfig.value;
    const cacheKey = 'RECENT_MENU_LIST'
    // 创建最近使用菜单的LRU缓存，最多存储20条
    const recentMenuListCache = createKeysLocalStorageLRUCache(cacheKey, 20)
    const recentMenuList = ref<SubMenuGroup[]>([])

    // 从扁平菜单中查找对应的菜单项
    function findMenuItem(key: string): SubMenuGroup | undefined {
      return flatLeafMenu.value.find(item => item.key === key)
    }

    // 初始化加载最近使用的菜单
    onMounted(() => {
      const cachedKeys = recentMenuListCache.get() as string[]
      if (Array.isArray(cachedKeys)) {
        recentMenuList.value = cachedKeys
          .map(key => findMenuItem(key))
          .filter((item): item is SubMenuGroup => item !== undefined)
      }
    })

    const inputRefs = ref<Record<string, HTMLInputElement>>({})
    const selectedKey = ref('')
    const innerQuery = ref('')
    const selectedIndex = ref(0)
    

    // 当前显示的菜单项
    const currentMenuItems = computed(() => {
      return innerQuery.value ? searchItems.value : flatLeafMenu.value
    })

    // 表格选择插入
    const handleTableSelect = (item: SubMenuGroup, payload: { rows: number, cols: number }) => {
      // 将附加参数追加到payload中(用于气泡菜单)
      item.payload = payload
      handleEditorOpt(item, payload)
    }

    // 区分不同类型点击
    const handleEditorOpt = (item?: SubMenuGroup, payload?: any) => {
      if (!item) {
        return
      }
      // 更新最近使用菜单缓存，只存储 key
      recentMenuListCache.put(item.key)
      const cachedKeys = recentMenuListCache.get() as string[]
      if (Array.isArray(cachedKeys)) {
        recentMenuList.value = cachedKeys
          .map(key => findMenuItem(key))
          .filter((item): item is SubMenuGroup => item !== undefined)
      }
      if (item.key === 'image' || item.key === 'file') {
        // 查找下方的input，并触发点击
        const inputRef = inputRefs.value[item.key]
        if (inputRef) {
          inputRef.click()
        }
        return
      }

      if (props.triggerType === 'bubble') {
        props.command && props.command(item)
      } else {
        item.action && item.action(props.editor, payload)
        emit('triggerVisible', false)
      }
    }

    // 文件/图片 选择
    const handleFileChange = (item: SubMenuGroup, event: any) => {
      if (props.triggerType === 'bubble') {
        item.payload = event?.target?.files
        props.command && props.command(item)
      } else {
        item.action && item.action(props.editor, event?.target?.files)
        emit('triggerVisible', false)
      }
    }

    const selectItem = (index: number) => {
      const item = currentMenuItems.value[index]
      if (item) {
        handleEditorOpt(item)
      }
    }

    // 搜索结果
    const searchItems = computed(() => {
      return flatLeafMenu.value.filter((item) => item.name.includes(innerQuery.value))
    })

    const upHandler = () => {
      selectedIndex.value = (selectedIndex.value + currentMenuItems.value.length - 1) % currentMenuItems.value.length
    }

    const downHandler = () => {
      selectedIndex.value = (selectedIndex.value + 1) % currentMenuItems.value.length
    }

    const menuItems = computed(() => {
      // 只有存在最近使用记录时才显示"最近搜索"分组
      const items: (MenuGroup | null)[] = [
        recentMenuList.value.length > 0 ? {
          key: 'recent',
          name: '最近搜索',
          layout: 'horizontal' as const,
          children: recentMenuList.value,
        } : null,
        ...menuGroup.value,
      ]

      return items.filter((item): item is MenuGroup => item !== null)
    })

    watch(
      () => flatLeafMenu.value,
      () => {
        selectedIndex.value = 0
      },
    )

    watch(
      () => props.query,
      () => {
        innerQuery.value = props.query
      },
    )

    watch(selectedIndex, (val: number) => {
      console.log(val)
      selectedKey.value = currentMenuItems.value[val]?.key
    })

    const enterHandler = () => {
      selectItem(selectedIndex.value)
    }

    const onKeyDown = ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    }

    // 对外暴露键盘处理方法，供 Suggestion 渲染器调用
    expose({ onKeyDown })

    return () => (
      <div class={[styles.bubbleWrapper, props.triggerType === 'bubble' && 'bubble']}>
        {props.triggerType === 'menu' && (
          <Input.Search 
            v-model:value={innerQuery.value} 
            placeholder="请输入功能名称" 
            allowClear 
          />
        )}
        
        {!innerQuery.value && (
          <ul class={styles.menuWrapper}>
            {menuItems.value.map(menu => (
              <li key={menu.key} class={styles.groupMenuItem}>
                <div class={styles.subTitle}>
                  {menu.name}
                </div>
                {/* 最近搜索 */}
                {menu.key === 'recent' ? (
                  <Space wrap class={styles.recentMenuItems}>
                    {menu.children.map(item => (
                      <Button 
                        key={item.key} 
                        type="text" 
                        size="small"
                        onClick={() => handleEditorOpt(item)}
                      >
                        {item.name}
                      </Button>
                    ))}
                  </Space>
                ) : (
                  <ul class={menu.layout === 'horizontal' ? 'flex flex-wrap gap-[2%]' : ''}>
                    {menu.children.map(subItem => (
                      subItem.hasMore ? (
                        <Popover 
                          key={subItem.key} 
                          placement="right"
                          content={subItem.key === 'table' ? (
                            <AutoExpandTableSelect 
                              onSelect={(payload: any) => handleTableSelect(subItem, payload)} 
                            />
                          ) : null}
                        >
                            <li 
                              class={[styles.menuItem, 'shadow-bg-wrapper relative', selectedKey.value === subItem.key && 'selected']}
                              onClick={() => handleEditorOpt(subItem)}
                              style={menu.layout === 'horizontal' ? { flexBasis: ((menu.span || 12) / 24 * 100 - 1) + '%' } : {}}
                            >
                              <span class={styles.leftIcon}>
                                {subItem.iconRender ? (
                                  <s-icon-font icon-render={subItem.iconRender} />
                                ) : subItem.iconType ? (
                                  <s-icon-font size={subItem.size} imgModule={subItem.imgModule} type={subItem.iconType} />
                                ) : subItem.imgModule ? (
                                  <img src={subItem.imgModule} alt="" />
                                ) : null}
                              </span>
                              {subItem.name}
                              <RightOutlined class="absolute right-[10px] top-[50%] translate-y-[-50%] text-[var(--ant-color-text-tertiary)]" />
                            </li>
                        </Popover>
                      ) : (
                        <li 
                          key={subItem.key}
                            class={[styles.menuItem, 'shadow-bg-wrapper', selectedKey.value === subItem.key && 'selected']}
                            onClick={() => handleEditorOpt(subItem)}
                            style={menu.layout === 'horizontal' ? { flexBasis: ((menu.span || 12) / 24 * 100 - 1) + '%' } : {}}
                        >
                          <span class={styles.leftIcon}>
                            {subItem.iconRender ? (
                              <s-icon-font icon-render={subItem.iconRender} />
                            ) : subItem.iconType ? (
                              <s-icon-font size={subItem.size} type={subItem.iconType} />
                            ) : subItem.imgModule ? (
                              <img src={subItem.imgModule} alt="" />
                            ) : null}
                          </span>
                          {subItem.name}
                          {/* file,img隐藏一个input，点击后选择文件 */}
                          {['file', 'image'].includes(subItem.key) && (
                            <input 
                              ref={(el) => { if (el) inputRefs.value[subItem.key] = el as HTMLInputElement }}
                              onChange={(event: any) => handleFileChange(subItem, event)}
                              multiple={subItem.key === 'image' ? image?.multiple ?? true : (file?.multiple ?? true)}
                              type="file"
                              accept={subItem.key === 'image' 
                                ? image?.accept ?? ".svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic"
                                : subItem.key === 'file' 
                                ? file?.accept ?? ".docx,.doc,.txt,.lake,.lakebook,.lakesheet,.pdf,.xls,.xlsx,.xlsm,.csv,.pptx,.ppt,.pages,.numbers,.key,.keynote,.md,.mark,.markdown,.xmind,.mindnode,.mmap,.mm,.rp,.psd,.sketch,.svg,.png,.bmp,.jpg,.jpeg,.gif,.webp,.heic,.heif,.ts,.mp3,.mpga,.wav,.bat,.c,.cpp,.css,.go,.h,.java,.js,.json,.jsonl,.log,.m,.mkd,.php,.py,.r,.sh,.sql,.xml,.jmx,.yaml,.yml,.ipynb,.mp4"
                                : ""
                              }
                              hidden
                            />
                          )}
                        </li>
                      )
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        
        {innerQuery.value && searchItems.value.length > 0 && (
          <ul class={styles.menuWrapper}>
            <li class={styles.groupMenuItem}>
              {/* 这里是一维的 */}
              <div class={styles.subTitle}>搜索结果：</div>
              <ul>
                {searchItems.value.map(subItem => (
                  <li 
                    key={subItem.key}
                    class={[styles.menuItem, 'shadow-bg-wrapper', selectedKey.value === subItem.key && 'selected']}
                    onClick={() => handleEditorOpt(subItem)}
                  >
                    <span class={styles.leftIcon}>
                      {subItem.iconRender ? (
                        <s-icon-font icon-render={subItem.iconRender} />
                      ) : subItem.iconType ? (
                        <s-icon-font size={subItem.size} type={subItem.iconType} />
                      ) : null}
                    </span>
                    {subItem.name}
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        )}
        
        {innerQuery.value && searchItems.value.length === 0 && (
          <Empty description="暂无搜索结果" />
        )}
      </div>
    )
  },
})
