import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/code_miner_ui/', // 根目錄部署
  plugins: [vue()],
})
