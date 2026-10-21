import 'dotenv/config'
import app from './app.js'

const port = Number(process.env.PORT) || 3000

app.listen(port, () => {
  console.log('')
  console.log('  智能任务管理系统 已启动')
  console.log(`  本地地址：http://localhost:${port}`)
  console.log(`  健康检查：http://localhost:${port}/api/health`)
  console.log('')
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('  ⚠️  还没配置 SUPABASE_URL / SUPABASE_ANON_KEY')
    console.log('     把 .env.example 复制成 .env，填好你的项目地址和 key')
    console.log('')
  }
})
