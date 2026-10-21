import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 前端代码放在 client/ 目录，打包结果输出到根目录的 dist/
export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: 5173,
    // 开发时把 /api 的请求转给后端（3000 端口），避免跨域
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
