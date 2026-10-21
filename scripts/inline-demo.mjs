// 把 demo 打包产物内联成一个单文件，双击就能打开（file:// 下 module 脚本会被拦，内联就不受影响）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const demoDir = path.join(root, 'demo')
const htmlPath = path.join(demoDir, 'demo.html')

if (!fs.existsSync(htmlPath)) {
  console.error('找不到 demo/demo.html，先跑 npm run demo')
  process.exit(1)
}

let html = fs.readFileSync(htmlPath, 'utf8')

html = html.replace(
  /<script[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/g,
  (_, rel) => {
    const code = fs.readFileSync(path.join(demoDir, rel), 'utf8')
    return `<script type="module">\n${code}\n</script>`
  }
)

html = html.replace(
  /<link[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g,
  (_, rel) => {
    const css = fs.readFileSync(path.join(demoDir, rel), 'utf8')
    return `<style>\n${css}\n</style>`
  }
)

const outPath = path.join(demoDir, 'preview.html')
fs.writeFileSync(outPath, html, 'utf8')
console.log('已生成单文件预览：demo/preview.html')
