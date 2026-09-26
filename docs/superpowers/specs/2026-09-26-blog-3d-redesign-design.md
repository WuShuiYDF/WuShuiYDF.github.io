# 「WSYDF World」博客重构设计文档

- 日期：2026-09-26
- 状态：已通过用户评审（口头确认「通过，开工」）
- 说明：本文档当前位于暂存区 `~/wsydf-world/`（E: 盘写入被环境拒绝），环境恢复后整体迁往 `E:/Blog/wsydf-world/`
- 旧站：Hexo 7 + Butterfly，位于 `E:/Blog`，部署于 GitHub Pages（wushuiydf.github.io），**原样保留作备份，不再更新**

## 1. 背景与目标

用户痛点：发文章麻烦（要手动 hexo deploy）、想要后台管理、想要 AI 功能、想要与笔记软件（Notion）联动、嫌现在两版（Hexo 默认主题版 / Butterfly 版）都丑。

用户决策（2026-09-26 确认）：
1. 技术路线：**迁移 Astro 全重构**
2. 笔记软件：**Notion**（云端联动）
3. 发布方式：**Notion 直发 + 网页后台两个都要**
4. AI：**免费为主**（构建时摘要 + 现有 Coze 机器人 + 语义搜索）
5. 视觉：**C 档——全站 3D 沉浸**（参考 mimo.mi.com 的科技感、bruno-simon.com 的玩法）
6. 重点诉求：**前端炫酷是第一位**

## 2. 总体架构

```
Notion「博客」数据库 ──(GitHub Action 定时拉取, 状态=Published)──┐
Sveltia CMS 网页后台 ──(浏览器直接写仓库 markdown)─────────────┤
本地 markdown ──(git push)────────────────────────────────┴→ GitHub 仓库
                                                              │ markdown = 唯一数据源
                                              GitHub Actions: AI摘要生成 + Astro 构建
                                                              ↓
                                              GitHub Pages 上线（域名不变）
```

核心原则：**3D 世界做外壳，HTML 层做内容**。3D 是门面与入口，文章阅读走精排 HTML；任何情况下内容都可被无 JS 环境读取（SEO 兜底）。

## 3. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Astro 5（static 输出）+ TypeScript | 静态优先、islands、View Transitions 原生支持 |
| 样式 | Tailwind CSS 4 + 少量手写 CSS（辉光/噪点/玻璃） | 快速统一视觉语言 |
| 3D | three.js 原生（vanilla，无 React 运行时） | 包体最小、完全控制渲染循环 |
| 动效 | GSAP + ScrollTrigger、Lenis 平滑滚动、View Transitions API | 2025-26 博客圈主流组合 |
| 评论 | Giscus（GitHub Discussions） | 免费、主流、替代已失效的 Gitalk |
| 代码高亮 | Shiki（Astro 内置） | 构建时高亮，零运行时 |
| CMS | Sveltia CMS + sveltia-cms-auth（Cloudflare Worker 免费版） | 现代化 Decap 替代 |
| CI | GitHub Actions（sync-notion.yml + deploy.yml） | 免费额度足够 |
| AI | 构建时摘要（免费额度 LLM API，如智谱/DeepSeek）；Coze Web SDK；构建时 embeddings + 浏览器端检索 | 访客端零成本 |

## 4. 3D 世界设计（首页 `/`）

- **场景**：悬浮低多边形夜色岛城，深色科技底 + 辉光渐变 + 粒子萤火；昼夜随主题切换。
- **建筑 ↔ 板块映射**：
  - 文章馆（主建筑）：门口立牌展示最新 3 篇文章标题，进入 → `/posts`
  - 归档塔 → `/archives`；相册屋 → `/gallery`；友链亭 → `/links`；AI 小屋 → 打开 Coze 客服浮窗
- **交互**：桌面端 WASD/方向键移动 + 鼠标视角，走近建筑弹出玻璃拟态信息面板，点击进入；支持直接点击建筑传送。移动端：虚拟摇杆/点地移动，场景降级（减少粒子、降低 pixelRatio）。
- **角色**：低多边形小机器人（程序化建模，纯代码几何体，**不加载任何模型文件**——零版权风险、包体可控）。
- **加载策略**：先渲染静态渐变封面帧（秒开），three.js chunk 懒加载完成后交叉淡入；资源全部程序化生成，无网络模型请求。
- **经典模式**：右上角开关，一键切回纯 HTML 首页（存 localStorage；检测到弱设备/低电量/`prefers-reduced-motion` 时建议开启）。

## 5. 内容层页面

| 路由 | 内容 |
|---|---|
| `/` | 3D 世界（外壳）+ noscript 文字版导航 |
| `/posts`、`/posts/[slug]` | 文章列表 / 详情（排版、TOC、阅读进度、Shiki、图片 blur-up、AI 摘要卡、Giscus、View Transition） |
| `/archives` | 时间轴归档 |
| `/tags/[tag]` | 标签 |
| `/gallery` | 相册（沿用现有图片素材） |
| `/links` | 友链 |
| `/about` | 关于 |
| `/ai` | 「一凡AI」页（介绍 + Coze 入口，替代原 `/gpt`） |
| `/music` | 音乐页（APlayer/Meting JS 引入） |
| 旧链接 | 原 `/:year/:month/:day/:title/` 3 篇文章做 meta refresh 重定向页 |

文章 frontmatter 规范：`title, slug, date, updated, tags[], category, summary(AI生成,可覆盖), cover?`

## 6. 发布链路

1. **Notion 直发**：Notion 建数据库「博客」，属性映射：`Name→title`、`Slug`、`Date`、`Tags(multi)`、`Category(select)`、`Status(No idea/Draft/Published)`。GitHub Action `sync-notion.yml`：每 30 分钟 + 手动触发，拉取 Status=Published（及 Draft）页面 → 转 markdown（notion-to-md）→ commit 仓库（图片下载到 `/public/images/` 并改写链接）。
2. **Sveltia CMS**：`/admin/index.html` + `config.yml`（collections: posts/pages）；鉴权走 sveltia-cms-auth Cloudflare Worker（用户需注册 CF，免费）。可直接编辑/新建/上传图片。
3. **构建部署** `deploy.yml`：push 到 main → `astro build`（内含 AI 摘要生成步骤）→ deploy-pages。构建失败时保留上一版线上站点（Pages 天然如此）。

三条通道产出同一份仓库 markdown，无冲突；文件头加 `source: notion|cms|local` 注释便于排查。

## 7. AI 层

- **构建时摘要**：deploy 时对无 `summary` 的文章调用免费 LLM API（key 存 GitHub Secret），生成中文 60-80 字摘要写回缓存（`.ai-cache/summary.json`，避免重复扣额度）。
- **Coze 客服**：现有 Coze 机器人（https://www.coze.cn/s/ijs5TwbS/）以 Web SDK 悬浮窗全站可唤起；3D 世界的 AI 小屋也触发它。
- **搜索**：Phase 1 关键词搜索（静态索引）；Phase 2 语义搜索——构建时对文章分块调 embedding API 存 `embeddings.json`，前端加载后本地余弦检索，查询向量同样走免费 API（仅查询时一次调用）。

## 8. 性能与降级

- 预算：LCP < 2.5s（3D 前有静态封面帧兜底）、3D chunk gzip < 200KB（three 按需引入 + tree-shaking）、动画一律 transform/opacity。
- `prefers-reduced-motion` → 关闭滚动动画与角色自动行走；后台标签页暂停渲染循环。
- SEO：文章页为完整静态 HTML；3D 首页带 noscript 文字版导航 + sitemap + OG 标签。

## 9. 错误处理

- 3D 初始化失败/WebGL 不可用 → 自动落经典模式并 toast 提示。
- Notion API 失败 → Action 重试 2 次 + 失败不阻塞 deploy（下次 cron 补齐）。
- AI 摘要 API 失败 → 跳过该篇（无摘要卡），不阻塞构建。
- Sveltia 鉴权 Worker 故障 → 本地写作/Notion 链路不受影响。

## 10. 测试策略

- 构建：`astro build` 必须零错误；链接检查（3 篇旧文重定向可达）。
- 冒烟（Playwright）：首页 3D canvas 出现、经典模式切换、文章页渲染、评论 iframe 出现、admin 页加载。
- 性能：Lighthouse 移动端 ≥ 85（3D 懒加载后）、文章页 ≥ 95。
- 视觉：渲染 PNG 后走 visual-judge 验收。

## 11. 目录结构（新项目）

```
E:/Blog/wsydf-world/          # 新项目（旧 Hexo 原样保留在 E:/Blog 根目录）
├── docs/superpowers/specs/   # 本文档与后续计划
├── src/
│   ├── pages/                # 上述路由
│   ├── components/           # glass-card / ai-summary / world(3D) ...
│   ├── worlds/               # three.js 场景模块（terrain/buildings/character/fx）
│   ├── content/posts/        # markdown 文章（唯一数据源）
│   └── styles/
├── public/admin/             # Sveltia CMS
├── scripts/                  # notion-sync.mjs / ai-summary.mjs / embeddings.mjs
└── .github/workflows/        # sync-notion.yml / deploy.yml
```

## 12. 里程碑（分阶段交付，每阶段独立可用）

- **M1 可上线的新博客**：Astro 脚手架 + 全部页面 + 内容迁移 + 视觉语言（深色/辉光/玻璃）+ 基础动效 → 先部署看效果
- **M2 3D 世界 MVP**：地形 + 5 建筑 + 机器人角色 + 面板交互 + 加载策略
- **M3 发布链路**：Notion 同步 + Sveltia CMS + Actions 自动部署 + 旧链重定向
- **M4 AI 层**：构建时摘要 + Coze 浮窗 + 语义搜索
- **M5 打磨**：昼夜切换、粒子氛围、音效彩蛋、性能调优、移动端摇杆

## 13. 前置条件（需要用户提供，M3/M4 前）

1. Notion Integration Token（并把「博客」数据库分享给集成）
2. Cloudflare 账号（部署 CMS 鉴权 Worker，免费）
3. 一个免费 LLM API Key（智谱/DeepSeek/百炼任一，存 GitHub Secret）
4. 确认 GitHub 仓库策略：沿用 WuShuiYDF.github.io（推荐，域名不变）

## 14. 范围外（YAGNI）

- 不做：账号系统、多语言、自建图床、付费 AI、数据统计自建（可后续挂 umami/51la）
- 不做：全站 3D 内读长文（可读性差，已用 HTML 层替代）
