import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: mode === 'production' ? '/speed-editor/demo/' : '/',
  server: { port: 5175 },
  optimizeDeps: {
    exclude: ['@speed-editor/core'],
  },
}))
