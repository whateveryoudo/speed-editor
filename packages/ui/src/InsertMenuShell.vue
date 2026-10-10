<script setup lang="ts">
import { Popover } from 'ant-design-vue'
import type { InsertMenuItem } from '@speed-editor/shared'

defineProps<{
  editor: unknown
  items: InsertMenuItem[]
}>()
</script>

<template>
  <Popover trigger="click" placement="bottomLeft">
    <template #content>
      <div class="ste-insert-menu">
        <template v-for="item in items" :key="item.key">
          <component
            v-if="item.component"
            :is="item.component"
            :editor="editor"
          />
          <div v-else class="ste-insert-menu__label">{{ item.label }}</div>
        </template>
      </div>
    </template>
    <button type="button" class="ste-insert-trigger">插入</button>
  </Popover>
</template>

<style scoped>
.ste-insert-trigger {
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.ste-insert-menu {
  min-width: 160px;
}
.ste-insert-menu__label {
  padding: 6px 8px;
  color: #666;
}
</style>
