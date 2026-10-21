/**
 * 演示模式（不需要 Supabase 也能看界面）
 *   npm run demo   → 打开 demo/demo.html
 *
 * 原理：把浏览器的 fetch 换成一个假的，数据存在内存里，
 * 这样不用配数据库就能把增删改查、筛选、删除线全部点一遍。
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const now = Date.now()
let seq = 5
const store = [
  { id: 5, title: '整理数据库表结构，补上 tasks 表说明', priority: '高', completed: false, created_at: new Date(now - 1000 * 60 * 8).toISOString() },
  { id: 4, title: '把项目代码推到 GitHub，检查 .env 没有上传', priority: '高', completed: false, created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString() },
  { id: 3, title: '在 Vercel 配置 SUPABASE_URL 和 SUPABASE_ANON_KEY', priority: '中', completed: false, created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString() },
  { id: 2, title: '写 SQL 建表并开启行级安全策略', priority: '中', completed: true, created_at: new Date(now - 1000 * 60 * 60 * 30).toISOString() },
  { id: 1, title: '注册 Supabase / GitHub / Vercel 三个账号', priority: '低', completed: true, created_at: new Date(now - 1000 * 60 * 60 * 50).toISOString() },
]

const json = (body, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  })

window.fetch = async (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase()
  const path = String(url)
  const body = options.body ? JSON.parse(options.body) : {}
  const idMatch = path.match(/\/api\/tasks\/(\d+)\s*$/)

  if (path.startsWith('/api/tasks') && idMatch) {
    const id = Number(idMatch[1])
    const idx = store.findIndex((t) => t.id === id)
    if (idx === -1) return json({ error: '这条任务不存在，可能已经被删了' }, 404)

    if (method === 'DELETE') {
      store.splice(idx, 1)
      return json({ ok: true, id })
    }
    if (method === 'PATCH') {
      store[idx] = { ...store[idx], ...body }
      return json(store[idx])
    }
  }

  if (path.startsWith('/api/tasks')) {
    if (method === 'GET') {
      return json([...store].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    }
    if (method === 'POST') {
      if (!body.title || !String(body.title).trim()) return json({ error: '任务标题不能为空' }, 400)
      const row = {
        id: ++seq,
        title: String(body.title).trim(),
        priority: body.priority || '中',
        completed: false,
        created_at: new Date().toISOString(),
      }
      store.push(row)
      return json(row, 201)
    }
  }

  return json({ error: '演示模式只模拟了 /api/tasks' }, 404)
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
