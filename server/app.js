import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase, friendlyError } from './supabase.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')

const PRIORITIES = ['高', '中', '低']
const MAX_TITLE = 200

// ---------------- 接口 ----------------

const router = express.Router()

// 健康检查：浏览器打开 /api/health 看看后端活着没
router.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// 查列表：按创建时间倒序（最新在最上面）
router.get('/tasks', async (req, res) => {
  try {
    const supabase = getSupabase()
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

    // 支持 ?priority=高 服务端筛选（前端也做了本地筛选，这里留着备用）
    const { priority } = req.query
    if (priority && PRIORITIES.includes(priority)) {
      query = query.eq('priority', priority)
    }

    const { data, error } = await query
    if (error) throw error
    res.json(data ?? [])
  } catch (err) {
    res.status(500).json({ error: friendlyError(err) })
  }
})

// 新增一条
router.post('/tasks', async (req, res) => {
  try {
    const { title, priority } = req.body ?? {}

    const cleanTitle = typeof title === 'string' ? title.trim() : ''
    if (!cleanTitle) {
      return res.status(400).json({ error: '任务标题不能为空' })
    }
    if (cleanTitle.length > MAX_TITLE) {
      return res.status(400).json({ error: `任务标题不能超过 ${MAX_TITLE} 个字` })
    }
    const cleanPriority = PRIORITIES.includes(priority) ? priority : '中'

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: cleanTitle, priority: cleanPriority })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: friendlyError(err) })
  }
})

// 改一条：可以改 completed，也可以改 title / priority
router.patch('/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'id 不合法' })
    }

    const { title, priority, completed } = req.body ?? {}
    const patch = {}

    if (typeof title === 'string') {
      const cleanTitle = title.trim()
      if (!cleanTitle) return res.status(400).json({ error: '任务标题不能为空' })
      if (cleanTitle.length > MAX_TITLE) {
        return res.status(400).json({ error: `任务标题不能超过 ${MAX_TITLE} 个字` })
      }
      patch.title = cleanTitle
    }
    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: '优先级只能是 高 / 中 / 低' })
      }
      patch.priority = priority
    }
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'completed 必须是 true 或 false' })
      }
      patch.completed = completed
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return res.status(404).json({ error: '这条任务不存在，可能已经被删了' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: friendlyError(err) })
  }
})

// 删一条
router.delete('/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'id 不合法' })
    }

    const supabase = getSupabase()
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    res.json({ ok: true, id })
  } catch (err) {
    res.status(500).json({ error: friendlyError(err) })
  }
})

// ---------------- 组装应用 ----------------

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

// 正式挂载：/api/tasks
app.use('/api', router)
// 兜底挂载：万一某个平台的转发把 /api 前缀吃掉了，/tasks 也能用
app.use('/', router)

// 不存在的接口，返回 JSON 而不是 HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: `接口不存在：${req.method} ${req.originalUrl}` })
})

// 本地跑的时候由后端直接托管打包好的前端页面
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: false, maxAge: '1h' }))
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

// 统一错误兜底（比如 JSON 格式写错）
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: '请求体不是合法的 JSON' })
  }
  console.error('[server error]', err)
  res.status(500).json({ error: friendlyError(err) })
})

export default app
