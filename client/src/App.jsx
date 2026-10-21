import { useEffect, useMemo, useRef, useState } from 'react'

const PRIORITIES = ['高', '中', '低']
const FILTERS = ['全部', '高', '中', '低']

/** 统一处理请求：非 2xx 就把后端给的中文错误抛出去 */
async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `请求失败（HTTP ${res.status}）`)
  }
  return data
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('中')
  const [filter, setFilter] = useState('全部')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const list = await request('/api/tasks')
      setTasks(Array.isArray(list) ? list : [])
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    const value = title.trim()
    if (!value) {
      setError('任务标题不能为空')
      inputRef.current?.focus()
      return
    }
    setAdding(true)
    try {
      const created = await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: value, priority }),
      })
      setTasks((prev) => [created, ...prev])
      setTitle('')
      setError('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(task) {
    try {
      const updated = await request(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !task.completed }),
      })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`确定删除「${task.title}」吗？`)) return
    try {
      await request(`/api/tasks/${task.id}`, { method: 'DELETE' })
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const visible = useMemo(
    () => (filter === '全部' ? tasks : tasks.filter((t) => t.priority === filter)),
    [tasks, filter]
  )
  const doneCount = tasks.filter((t) => t.completed).length

  return (
    <div className="page">
      <main className="card">
        <header className="head">
          <div>
            <h1>智能任务管理</h1>
            <p className="sub">数据存在 Supabase 云端，关掉浏览器也不会丢</p>
          </div>
          <div className="stat">
            <strong>{tasks.length - doneCount}</strong>
            <span>待完成 / 共 {tasks.length} 条</span>
          </div>
        </header>

        <form className="addbar" onSubmit={handleAdd}>
          <input
            ref={inputRef}
            type="text"
            placeholder="要做什么？按回车或点「添加」"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            disabled={adding}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={adding}
            aria-label="优先级"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}优先级
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary" disabled={adding}>
            {adding ? '添加中…' : '添加'}
          </button>
        </form>

        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${filter === f ? 'on' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== '全部' && (
                <em>{tasks.filter((t) => t.priority === f).length}</em>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="关闭提示">
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="skeleton">
            <i />
            <i />
            <i />
          </div>
        ) : visible.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">✓</div>
            <p>{tasks.length === 0 ? '还没有任务，先加一条吧' : '这个优先级下没有任务'}</p>
          </div>
        ) : (
          <ul className="list">
            {visible.map((task) => (
              <li key={task.id} className={`item ${task.completed ? 'done' : ''}`}>
                <button
                  type="button"
                  className="check"
                  onClick={() => handleToggle(task)}
                  title={task.completed ? '标记为未完成' : '标记为已完成'}
                  aria-label={task.completed ? '标记为未完成' : '标记为已完成'}
                >
                  {task.completed ? '✓' : ''}
                </button>

                <div className="body">
                  <p className="title">{task.title}</p>
                  <div className="meta">
                    <span className={`pill p-${task.priority === '高' ? 'high' : task.priority === '中' ? 'mid' : 'low'}`}>
                      {task.priority}
                    </span>
                    <span className="state">{task.completed ? '已完成' : '待完成'}</span>
                    <span className="time">{formatTime(task.created_at)}</span>
                  </div>
                </div>

                <div className="actions">
                  <button type="button" className="btn-ghost" onClick={() => handleToggle(task)}>
                    {task.completed ? '未完成' : '完成'}
                  </button>
                  <button type="button" className="btn-danger" onClick={() => handleDelete(task)}>
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <footer className="foot">
          <span>已有 {doneCount} 条完成</span>
          <button type="button" className="btn-link" onClick={refresh}>
            刷新
          </button>
        </footer>
      </main>
      <p className="brand">Node.js + React + Supabase</p>
    </div>
  )
}

function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const pad = (n) => String(n).padStart(2, '0')
  return sameDay
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${d.getMonth() + 1}月${d.getDate()}日`
}
