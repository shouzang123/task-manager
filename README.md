# 智能任务管理系统

作者：liguangyu

Node.js 后端 + React 前端 + Supabase 数据库，可以直接部署到 Vercel。

---

## 一、目录结构

```
task-manager/
├── api/index.js         Vercel 的入口（把 Express 交给 Serverless）
├── server/
│   ├── app.js           后端接口：增删改查
│   ├── supabase.js      连接 Supabase、把英文报错翻成中文
│   └── index.js         本地启动
├── client/
│   ├── index.html
│   ├── demo.html        界面预览的入口
│   └── src/             前端页面（React）
├── scripts/             打包时把预览压成单文件的脚本
├── supabase/schema.sql  建表 + 权限脚本
├── .env.example         环境变量模板
└── vercel.json          部署配置
```

---

## 二、第一步：Supabase 建库（5 分钟）

1. 打开 https://supabase.com ，登录，点 **New Project**
2. Name 填 `task-manager`，Region 选 **Southeast Asia (Singapore)**，点 Create，等 1～2 分钟
3. 左边点 **SQL Editor**（闪电图标）→ **New query**
4. 把 `supabase/schema.sql` 整个文件的内容粘进去，点 **Run**
5. 看到 `Success. No rows returned` 就成了

这个脚本干了四件事：建 `tasks` 表、开 RLS、建四条读写策略、建索引。**可以重复跑**，不会报 already exists。

> ⚠️ 千万不要跳过脚本里第 3 步那几条 `create policy`。少这一步，读能读、写一定报错：
> `new row violates row-level security policy`

### 拿两个凭据

左边齿轮图标 **Project Settings** → **API Keys**，复制两样：

| 要复制的 | 长什么样 |
|---|---|
| Project URL | `https://xxxx.supabase.co` |
| Publishable key | `sb_publishable_xxxx` |

认准 `sb_publishable_` 开头。旁边 `sb_secret_` 开头的是保密密钥，**不要用、不要传 GitHub**（代码里检测到会直接报错拦住你）。

---

## 三、第二步：本地配置

1. 把 `.env.example` 复制一份，改名成 `.env`（前面有个点）
2. 填进去：

```bash
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=sb_publishable_你的key
PORT=3000
```

`.gitignore` 里已经写了 `.env`，传不上去。

---

## 四、第三步：本地跑起来

### 先看效果（不用配数据库）

```bash
npm install
npm run demo
```

会生成 `demo/preview.html`，双击就能打开。界面、增删改查、筛选、删除线全都能点，数据是内存里的假数据，刷新就还原。

### 真正连上数据库

```bash
npm run dev
```

- 前端：http://localhost:5173 （改代码自动刷新）
- 后端：http://localhost:3000
- 探活：http://localhost:3000/api/health

想模拟线上效果（一个端口同时跑前后端）：

```bash
npm run build
npm start
```

然后开 http://localhost:3000 。

---

## 五、第四步：传 GitHub

### 5.1 建仓库

GitHub → 右上角 **+** → **New repository**
- Repository name：`task-manager`
- 选 **Public** 或 **Private** 都行（Vercel 免费版两种都能部署）
- **不要**勾 "Add a README file"
- Create

### 5.2 生成 PAT（个人访问令牌）——这一步很多人卡住

GitHub 从 2021 年起就不让用账号密码 push 了。要么配 SSH，要么用 PAT。PAT 更简单：

1. GitHub 右上角头像 → **Settings**
2. 左侧拉到最下面 → **Developer settings**
3. 点 **Personal access tokens** → **Tokens (classic)**
4. 右上 **Generate new token** → **Generate new token (classic)**
5. 填三项：
   - **Note**：写 `task-manager`（只是备注）
   - **Expiration**：选 30 days（够用，别选 No expiration）
   - **Scopes**：**只勾 `repo` 这一个**。别的都不要勾
6. 拉到最下 **Generate token**
7. 页面出现 `ghp_xxxxxxxx`，**马上复制存好**——离开这个页面就再也看不到了

### 5.3 推送

```bash
cd task-manager
git init
git add .
git commit -m "init: 智能任务管理系统"
git branch -M main
git remote add origin https://github.com/你的用户名/task-manager.git
git push -u origin main
```

弹出用户名密码时：

- 用户名：你的 GitHub 用户名
- 密码：**粘贴那个 `ghp_...` 的 PAT**，不是账号密码

> Windows 上第一次输完会被凭据管理器记住，后面就不用再输了。
> 如果之前输错被记住了，到「控制面板 → 凭据管理器 → Windows 凭据」里删掉 `git:https://github.com` 再重试。

### 5.4 推完检查一遍

打开仓库页面，确认**没有** `.env` 这个文件。有的话立刻按文末「key 泄露了怎么办」处理。

---

## 六、第五步：Vercel 部署

1. https://vercel.com 用 GitHub 账号登录
2. **Add New** → **Project**
3. 找到 `task-manager`，点 **Import**
4. Framework Preset 会自动识别成 **Vite**，Build Command `npm run build`，Output Directory `dist`——一般不用改（`vercel.json` 里也写死了）
5. 展开 **Environment Variables**，加两条，一条一条加：

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://你的项目ID.supabase.co` |
| `SUPABASE_ANON_KEY` | `sb_publishable_你的key` |

6. 点 **Deploy**，等 1～3 分钟
7. 拿到 `https://task-manager-xxx.vercel.app`，打开就能用

> **变量名一个字母都不能改**。Supabase 官方现在把 key 叫 "Publishable key"，但变量名还是 `SUPABASE_ANON_KEY`，值换成 `sb_publishable_...` 就行。
>
> ⚠️ 只配这两个。别把 `NODE_ENV` 之类的往里塞——Vercel 自己会设，手动覆盖反而可能让 build 失败。

### 更新代码后

`git push` 之后 Vercel 会自动重新部署。如果只改了环境变量，记得去 **Deployments** → 最新那条 → 右边 `...` → **Redeploy**，不然新变量不生效。

---

## 七、第六步：绑定自己的域名

假设你要绑 `zhangsan01.rangzijigenghao.online`。

### 7.1 Vercel 这边加域名

1. 进 Vercel 项目 → **Settings** → **Domains**
2. 输入 `zhangsan01.rangzijigenghao.online`，点 **Add**
3. Vercel 会给你列出「需要去 DNS 服务商配置的记录」，通常是两条：

### 7.2 去域名服务商那边加记录

在域名管理后台找 **DNS 解析 / 解析记录 / DNS Records**，添加两条：

| 记录类型 | 主机记录（Host） | 记录值（Value） | 说明 |
|---|---|---|---|
| **CNAME** | `zhangsan01` | `cname.vercel-dns.com` | 让域名指向 Vercel |
| **TXT** | `_vercel` | `vc-domain-verify=xxxxx`（Vercel 给你的那串） | 证明域名是你的 |

- 主机记录只填**前缀**，不要填整个域名
- 记录值以 Vercel 页面上显示的为准。它显示什么就填什么，不同账号给的值可能不一样
- TTL 用默认（一般是 600 秒 / 10 分钟）

### 7.3 等生效

DNS 生效一般 10 分钟到 2 小时。回到 Vercel 的 Domains 页面：

- 两条记录都变绿勾 = 成功
- 红了就点旁边的 **Refresh**，或者用 https://dnschecker.org 查一下解析有没有生效

生效后 HTTPS 证书 Vercel 会自动配，不用管。

---

## 八、常见报错对照

| 你看到的报错 | 原因 | 怎么修 |
|---|---|---|
| `new row violates row-level security policy` | RLS 策略没建全 | 重跑 `supabase/schema.sql` 第 3 段 |
| `relation "tasks" does not exist` | 表没建 | 重跑 `supabase/schema.sql` 第 1 段 |
| `缺少环境变量 SUPABASE_URL 或 SUPABASE_ANON_KEY` | `.env` 没建或变量名打错 | 检查 `.env`；Vercel 上检查 Environment Variables 后 Redeploy |
| `你填的是 sb_secret_ 开头的保密密钥` | 复制错 key 了 | 换 `sb_publishable_` 那个 |
| 页面上数据是空的，Supabase 里却有 | 两边连的不是同一个项目 | 核对 Vercel 的 `SUPABASE_URL` 项目 ID |
| Vercel 部署失败 | 看 Build Logs 红色那行 | 最常见：环境变量没配、key 多了空格 |
| `git push` 报 `Permission denied` | 用了账号密码 | 用 PAT 当密码，见 5.2 |

---

## 九、接口说明

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/api/tasks` | 查全部，按创建时间倒序。可加 `?priority=高` 筛选 |
| POST | `/api/tasks` | 新增，body：`{ "title": "写作业", "priority": "高" }` |
| PATCH | `/api/tasks/:id` | 改，body 可传 `completed` / `title` / `priority` |
| DELETE | `/api/tasks/:id` | 删 |
| GET | `/api/health` | 探活 |

出错时统一返回 `{ "error": "中文说明" }`，前端直接把这句话弹出来。

---

## 十、安全提醒

现在这套是**公开读写**（谁拿到网址都能增删改），适合教学演示。要上线正经用，把这步补上：

1. 表里加一列 `user_id uuid not null default auth.uid()`
2. 四条策略的 `using (true)` 换成 `using (auth.uid() = user_id)`
3. 前端接上 Supabase Auth 登录

### key 泄露了怎么办

1. **立刻**去 Supabase → Project Settings → API Keys，把那个 publishable key **Rotate** 掉
2. 本地删掉 `.env`，重新 commit、push
3. 去 Vercel 更新环境变量，Redeploy
4. 如果泄露的是 `sb_secret_` 开头的密钥，风险大得多——它绕过 RLS，能直接读全库，必须马上轮换

---

## 十一、可以接着做的练习

- 加「截止日期」字段，逾期标红
- 加搜索框，按标题模糊查
- 加统计：总共多少条、高优先级还剩几条
- 任务拖动排序
- 接入 Supabase Auth，每人只能看自己的任务
