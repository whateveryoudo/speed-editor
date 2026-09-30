import type { App, Component } from 'vue'
import { computed, ref } from 'vue'
import SpeedEditor from './SpeedEditor.vue'
import SpeedTooltip from './components/SpeedTooltip.vue'
import { ensureSpeedComponents } from 'speed-components-ui/components'
import type { ResponseType } from 'speed-components-ui'
import { editorConfig, type IUploadConfig } from '@speed-tiptap-editor/shared'
import { warnSpeedComponentsPeerSetup } from './warnPeerSetup'

const components: Component[] = [SpeedEditor]

type AjaxMethod = (params?: unknown) => Promise<unknown>

export interface GlobalConfig {
  apis?: Record<string, AjaxMethod>
  registerGlobal?: boolean
  iconfontUrl?: string
  access_token?: string // 访问token（用于一些可能需要权限的资源访问）
  transformFileItem?: (item: unknown) => unknown
  transformRequestRes?: (res: unknown) => ResponseType
  upload?: IUploadConfig
  theme?: 'light' | 'dark'
  antdToken?: Record<string, unknown>
}

const defaultConfig: GlobalConfig = {
  registerGlobal: true,
  iconfontUrl: '',
}

const configRef = ref<GlobalConfig>({ ...defaultConfig })
const currentConfig = computed(() => configRef.value)

export const setConfig = (config: Partial<GlobalConfig>) => {
  configRef.value = { ...configRef.value, ...config }
}

export const install = (app: App, config?: Partial<GlobalConfig>) => {
  if (config) setConfig(config)
  if (currentConfig.value.registerGlobal) {
    components.forEach((component) => {
      app.component(component.name as string, component as Component)
      if (component.name === 'SpeedEditor') {
        app.component('SpeedTiptapEditor', component as Component)
      }
    })
  }
  app.component(SpeedTooltip.name as string, SpeedTooltip)
  app.provide('speedUseTiptapConfig', currentConfig)
  ensureSpeedComponents(app, { iconfontUrl: [editorConfig.iconfontUrl] })
  warnSpeedComponentsPeerSetup()
}

const plugin = {
  install,
  setConfig,
  version: '2.0.0-alpha.0',
}

export default plugin
