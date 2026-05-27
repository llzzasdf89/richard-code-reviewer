# Code Reviewer AI

> 基于 AI 的代码 Review 助手，自动分析 GitHub PR diff，生成结构化 review 意见，并支持一键发布到 GitHub PR 评论。

---

## 功能特性

- **PR 链接输入**：粘贴任意 GitHub PR 链接，一键触发分析
- **AI 代码审查**：基于 Anthropic Claude 模型，生成结构化 review 意见
- **Streaming 输出**：实时流式展示 review 结果，无需等待
- **一键发布**：将 review 意见直接发布到 GitHub PR 评论
- **Webhook 支持**：接入 GitHub Webhook，PR 创建时自动触发（计划中）

---

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端框架 | Next.js 16 + React + Tailwind CSS |
| AI 模型 | Anthropic Claude（via DashScope 中转） |
| GitHub 集成 | Octokit REST SDK |
| 数据库 | PostgreSQL + pgvector（Drizzle ORM） |
| 部署 | Vercel + Railway |

---

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14

### 安装依赖

```bash
git clone https://github.com/your-username/code-reviewer.git
cd code-reviewer
pnpm install
```

### 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

填写以下配置：

```env
# AI 模型（DashScope 中转）
DASHSCOPE_API_KEY=your_dashscope_api_key

# GitHub
GITHUB_TOKEN=your_github_personal_access_token

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/code_reviewer
```

**GitHub Token 权限要求：**
- `repo` — 读取私有仓库 PR
- `public_repo` — 读取公开仓库 PR（只审查公开仓库时勾这个就够）

在 [github.com/settings/tokens](https://github.com/settings/tokens) 生成。

### 初始化数据库

```bash
pnpm db:migrate
```

### 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

---

## 使用方式

### 手动触发

1. 打开网页，粘贴 GitHub PR 链接
2. 点击「开始 Review」
3. 等待 AI 实时生成 review 意见
4. 点击「发布到 GitHub」将意见发布到 PR 评论

### Webhook 自动触发（计划中）

1. 在 GitHub 仓库设置中添加 Webhook
2. Payload URL 填写：`https://your-domain.com/api/webhook/github`
3. 勾选事件：`Pull requests`
4. PR 创建或更新时自动触发 review

---

## 项目结构

```
src/
├── app/
│   ├── page.tsx                    # 首页：PR 链接输入
│   └── api/
│       ├── review/
│       │   └── route.ts            # 核心：拉 diff + AI 分析
│       ├── github/
│       │   └── comment/route.ts    # 发评论到 GitHub PR
│       └── webhook/
│           └── github/route.ts     # GitHub Webhook 接收（计划中）
├── lib/
│   ├── github.ts                   # GitHub API 封装
│   ├── ai.ts                       # AI 调用封装
│   └── diff.ts                     # diff 处理工具函数
└── components/
    ├── ReviewForm.tsx               # PR 链接输入框
    └── ReviewResult.tsx             # Review 结果展示
```

---

## 核心链路

```
用户输入 PR 链接
  ↓
解析 owner / repo / PR number
  ↓
GitHub API 拉取 PR diff
  ↓
diff 按文件分块（避免超出 context window）
  ↓
逐块调用 Claude 生成 review 意见（streaming）
  ↓
网页实时展示结果
  ↓
用户确认后发布到 GitHub PR 评论
```

---

## 开发计划

### MVP（当前）
- [x] PR 链接解析
- [x] GitHub API 拉取 diff
- [x] AI 生成 review 意见（streaming）
- [x] 网页展示结果
- [x] 一键发布到 GitHub PR 评论

### v1.1
- [ ] GitHub Webhook 自动触发
- [ ] 用户登录（GitHub OAuth）
- [ ] Review 历史记录
- [ ] 点赞/踩反馈机制

### v1.2
- [ ] RAG：存储代码规范，review 时自动检索
- [ ] 自定义 review 规则
- [ ] 多语言支持
- [ ] 成本监控面板

---

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DASHSCOPE_API_KEY` | ✅ | 阿里云 DashScope API Key |
| `GITHUB_TOKEN` | ✅ | GitHub Personal Access Token |
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |

---

## 本地开发

```bash
# 启动开发服务器
pnpm dev

# 数据库迁移
pnpm db:migrate

# 生成数据库 schema
pnpm db:generate

# 打开 Drizzle Studio
pnpm db:studio

# 构建
pnpm build

# 代码检查
pnpm lint
```

---

## 部署

### Vercel（推荐）

```bash
pnpm add -g vercel
vercel
```

在 Vercel 控制台配置环境变量后自动部署。

### Docker

```bash
docker build -t code-reviewer .
docker run -p 3000:3000 --env-file .env.local code-reviewer
```

---

## License

MIT

---

*最后更新：2026 年 5 月*