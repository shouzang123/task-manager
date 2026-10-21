import { createClient } from '@supabase/supabase-js'

let client = null

/**
 * 拿到 Supabase 客户端（懒加载，第一次用的时候才创建）
 * 没有配置环境变量时抛中文错误，方便排查
 */
export function getSupabase() {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      '缺少环境变量 SUPABASE_URL 或 SUPABASE_ANON_KEY。' +
        '本地开发：复制 .env.example 为 .env 并填好；部署到 Vercel：在 Settings → Environment Variables 里配好再 Redeploy。'
    )
  }
  if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url.trim())) {
    throw new Error('SUPABASE_URL 格式不对，应该是 https://你的项目ID.supabase.co（结尾不要带 /rest/v1）')
  }
  if (key.startsWith('sb_secret_')) {
    throw new Error('你填的是 sb_secret_ 开头的保密密钥，不能用。要用 sb_publishable_ 开头的 Publishable key。')
  }

  client = createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

/**
 * 把 Supabase / 网络的英文报错翻译成学生看得懂的中文
 */
export function friendlyError(err) {
  const raw = err?.message || String(err || '未知错误')

  if (/row-level security/i.test(raw)) {
    return '数据库拒绝了这次写入：RLS 策略没开全。去 Supabase → SQL Editor，把 supabase/schema.sql 整段重跑一遍。'
  }
  if (err?.code === '42P01' || /relation .* does not exist/i.test(raw)) {
    return 'tasks 表不存在。先去 Supabase → SQL Editor 跑 supabase/schema.sql 建表。'
  }
  if (/invalid api key|Invalid JWT|Unauthorized|401/i.test(raw)) {
    return 'SUPABASE_URL 或 SUPABASE_ANON_KEY 不对。检查 .env（或 Vercel 环境变量）有没有填错、有没有多余空格。'
  }
  if (/fetch failed|ENOTFOUND|getaddrinfo|ECONNREFUSED|network/i.test(raw)) {
    return '连不上 Supabase。检查 SUPABASE_URL 是否写错，以及当前网络能不能访问 supabase.co。'
  }
  if (/duplicate key|23505/i.test(raw)) {
    return '数据重复，检查一下字段有没有唯一约束冲突。'
  }
  return raw
}
