// Vercel 的入口文件：把 Express 应用交给 Vercel 的 Serverless 托管
// vercel.json 里把 /api/* 全部重写到这里
import app from '../server/app.js'

export default app
