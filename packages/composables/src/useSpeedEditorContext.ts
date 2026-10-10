import { createInjectionState } from '@vueuse/core'
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { SpeedEditorShellProps } from '@speed-editor/shared'

export interface SpeedEditorContext {
  speedTiptapConfig: ComputedRef<SpeedEditorShellProps>
  editableCpt: ComputedRef<boolean>
  previewInstance: Ref<unknown>
  searchReplaceVisible: Ref<boolean>
  updateSearchReplaceVisible: (visible: boolean) => void
  globalTiptapStorage: Ref<Record<string, unknown>>
  updateGlobalTiptapStorageFunc: (key: string, value: unknown) => void
}

function initStateFunc(props: SpeedEditorShellProps): SpeedEditorContext {
  const speedTiptapConfig = computed(() => props)
  const editableCpt = computed(() => props.editable ?? true)
  const previewInstance = ref<unknown>(null)
  const searchReplaceVisible = ref(false)
  const updateSearchReplaceVisible = (visible: boolean) => {
    searchReplaceVisible.value = visible
  }
  const globalTiptapStorage = ref<Record<string, unknown>>({})
  const updateGlobalTiptapStorageFunc = (key: string, value: unknown) => {
    globalTiptapStorage.value[key] = value
  }

  return {
    speedTiptapConfig,
    editableCpt,
    previewInstance,
    searchReplaceVisible,
    updateSearchReplaceVisible,
    globalTiptapStorage,
    updateGlobalTiptapStorageFunc,
  }
}

const [useSpeedEditorProviderInternal, useSpeedEditorOriginal] = createInjectionState(initStateFunc)

export function useSpeedEditorProvider(props: SpeedEditorShellProps): SpeedEditorContext {
  return useSpeedEditorProviderInternal(props)!
}

export function useSpeedEditor(): SpeedEditorContext {
  const context = useSpeedEditorOriginal()
  if (!context) {
    throw new Error('useSpeedEditor must be used within SpeedEditorProvider')
  }
  return context
}
