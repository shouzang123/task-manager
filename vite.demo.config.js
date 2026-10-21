import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const resolve = (p) => fileURLToPath(new URL(p, import.meta.url))

// 只用于生成「界面预览」：把 demo.html 打包成可直接双击打开的静态文件夹
export default defineConfig({
  root: 'client',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../demo',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve('./client/demo.html'),
    },
  },
})
