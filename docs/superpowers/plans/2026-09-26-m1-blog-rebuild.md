# M1「可上线的新博客」实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Astro 5 重建博客（视觉语言：深色科技 + 辉光玻璃），迁移全部内容并部署到 GitHub Pages，替代旧 Hexo 站。

**Architecture:** 静态优先。markdown（content collections）→ Astro 构建静态 HTML；全站统一设计系统（CSS tokens + glass/glow 组件）；View Transitions 做页面过渡；GitHub Actions 构建并发布到 `WuShuiYDF.github.io`。3D 世界（M2）将挂在首页外壳上，本阶段首页先交付静态 hero 版。

**Tech Stack:** Astro 5 + TypeScript、Tailwind CSS 4（@tailwindcss/vite）、GSAP 3 + Lenis（滚动动效）、astro:transitions（ClientRouter）、Shiki（内置高亮）、Giscus（评论）。

**Spec:** `docs/superpowers/specs/2026-09-26-blog-3d-redesign-design.md`（同仓库 docs/ 下，执行前先读）

## Global Constraints

- 站点 URL：`https://wushuiydf.github.io`，base path 为 `/`（用户主仓，无子路径）
- 深色优先（默认 dark，可切 light），设计 token 以 spec 第 4 节视觉语言为准：深底 `#070b14`、紫 `#7c6cff`、青 `#22d3ee`、玻璃卡、辉光渐变、噪点质感
- 动画只用 `transform` / `opacity`；所有动效尊重 `prefers-reduced-motion`
- 文章文件名即 slug（`src/content/posts/<slug>.md`），frontmatter 遵循 spec 第 5 节 schema
- 旧 Hexo 站（`E:/Blog` 根目录）只读不动
- **执行环境注意**：当前暂存目录为 `~/wsydf-world`（E: 盘写入被拒、bash 故障待恢复）。Task 0 在环境恢复后把暂存区迁到 `E:/Blog/wsydf-world` 再继续；若 E: 盘长期不可写，报错给用户，不得悄悄换盘
- 每个任务以 `git commit` 结尾（暂存区内 `git init` 于 Task 0）

---

### Task 0: 环境恢复与暂存区迁移

**Files:**
- Move: `~/wsydf-world/*` → `/run/media/wushuiydf/E/Blog/wsydf-world/`

- [ ] **Step 1: 确认 shell 与 E: 盘可写**

```bash
echo ok && touch /run/media/wushuiydf/E/Blog/.probe && rm /run/media/wushuiydf/E/Blog/.probe
```
Expected: 输出 `ok`，无报错。若失败 → 停止，向用户报告（不要在 /tmp 之类位置偷偷建站）。

- [ ] **Step 2: 迁移暂存区并 git init**

```bash
mv ~/wsydf-world /run/media/wushuiydf/E/Blog/wsydf-world
cd /run/media/wushuiydf/E/Blog/wsydf-world
git init -b main
git add docs && git commit -m "docs: spec for WSYDF World redesign"
```
Expected: `main` 分支上首个 commit 包含 spec 与本计划。

### Task 1: Astro 脚手架

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/env.d.ts`

**Interfaces:**
- Produces: 可运行的 `npm run dev/build/preview`；`site=https://wushuiydf.github.io`；Tailwind v4 经 `@tailwindcss/vite` 生效

- [ ] **Step 1: 写 package.json**

```json
{
  "name": "wsydf-world",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "astro": "^5.12.0",
    "gsap": "^3.13.0",
    "lenis": "^1.3.0",
    "tailwindcss": "^4.1.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "@astrojs/sitemap": "^3.4.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: 写 astro.config.mjs**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://wushuiydf.github.io',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    shikiConfig: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      wrap: true,
    },
  },
});
```

- [ ] **Step 3: 写 tsconfig.json 与 .gitignore**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

.gitignore：`node_modules/ dist/ .astro/ .ai-cache/ .DS_Store`

- [ ] **Step 4: 安装并验证**

```bash
npm install && npm run build
```
Expected: `dist/` 生成，无错误（此时无页面，构建产物可为空壳）。缺一个 `src/pages/index.astro` 会 404——先建最小首页占位 `src/pages/index.astro`（内容 `<h1>WSYDF World</h1>`）再构建。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: astro scaffold with tailwind4 + sitemap"`

### Task 2: 设计系统（tokens / global.css / 基础组件）

**Files:**
- Create: `src/styles/global.css`, `src/components/GlassCard.astro`, `src/components/SectionTitle.astro`, `src/config.ts`

**Interfaces:**
- Produces: 全局 class `glass` `glow-text` `noise` `reveal`（滚动淡入，由 Task 5 脚本激活）；`src/config.ts` 导出 `SITE`（name/subtitle/description/social）与 `NAV`（[{label,href}]，含 首页/ 文章/ 归档/ 相册/ 友链/ 一凡AI/ 关于）

- [ ] **Step 1: global.css**

```css
@import "tailwindcss";

@theme {
  --color-bg: #070b14;
  --color-surface: #0d1322;
  --color-ink: #e6eaf2;
  --color-muted: #8b93a7;
  --color-primary: #7c6cff;
  --color-accent: #22d3ee;
  --font-display: "Space Grotesk", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --font-body: system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
}

:root[data-theme="light"] {
  --color-bg: #f4f6fb;
  --color-surface: #ffffff;
  --color-ink: #10141f;
  --color-muted: #5b6474;
}

html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

/* 玻璃卡 */
.glass {
  background: color-mix(in oklab, var(--color-surface) 72%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 1rem;
}
:root[data-theme="light"] .glass { border-color: rgb(15 23 42 / 0.08); }

/* 辉光渐变字 */
.glow-text {
  background: linear-gradient(92deg, var(--color-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 辉光阴影 */
.glow-ring { box-shadow: 0 0 24px color-mix(in oklab, var(--color-primary) 35%, transparent); }

/* 噪点质感（叠加层，勿挡交互） */
.noise { position: relative; }
.noise::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* 滚动淡入：默认隐藏，JS 加 .is-in 后过渡进入 */
.reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s cubic-bezier(.22,1,.36,1); }
.reveal.is-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }

::selection { background: color-mix(in oklab, var(--color-primary) 45%, transparent); }
```

- [ ] **Step 2: src/config.ts**

```ts
export const SITE = {
  name: 'WuShui YDF',
  subtitle: '无水有点烦的博客',
  description: '一个分享日常生活和记录自我学习之路的博客。期待热爱生活，热爱计算机，热爱经济学的你与我相遇',
  motto: 'Another Day, Another Opportunity!',
  github: 'https://github.com/WuShuiYDF',
  coze: 'https://www.coze.cn/s/ijs5TwbS/',
};

export const NAV = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/posts' },
  { label: '归档', href: '/archives' },
  { label: '相册', href: '/gallery' },
  { label: '友链', href: '/links' },
  { label: '一凡AI', href: '/ai' },
  { label: '关于', href: '/about' },
];
```

- [ ] **Step 3: GlassCard.astro / SectionTitle.astro**

```astro
--- // GlassCard.astro
interface Props { class?: string }
const { class: cls = '' } = Astro.props;
---
<div class:list={['glass noise p-6', cls]}><slot /></div>
```

```astro
--- // SectionTitle.astro
interface Props { title: string; sub?: string }
const { title, sub } = Astro.props;
---
<h2 class="font-[var(--font-display)] text-2xl font-bold md:text-3xl">
  <span class="glow-text">{title}</span>
  {sub && <span class="ml-3 text-sm text-[var(--color-muted)] font-normal">{sub}</span>}
</h2>
```

- [ ] **Step 4: 验证** — `npm run build` 通过；Commit `feat: design system tokens and base components`

### Task 3: 内容管道 + 文章迁移

**Files:**
- Create: `src/content.config.ts`, `src/content/posts/<slug>.md`（3 篇 + 3 草稿）
- Read: 旧站 `/run/media/wushuiydf/E/Blog/source/_posts/*.md`、`source/_drafts/*.md`（只读）

**Interfaces:**
- Produces: `getCollection('posts')`，entry.data 字段：`title,date?,updated?,tags[],category?,summary?,cover?,draft`；entry.id = 文件名（即 slug）

- [ ] **Step 1: content.config.ts**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    source: z.enum(['local', 'notion', 'cms']).default('local'),
  }),
});

export const collections = { posts };
```

- [ ] **Step 2: 迁移文章** — 逐篇读旧 frontmatter（hexo 的 `categories:` 是嵌套结构需摊平为 `category: 一级名`；`tags` 保持数组），重写为新 schema 写入 `src/content/posts/`。文件名用旧文件名（空格改 `-`，如 `ORP-Hearthstone.md`）。草稿加 `draft: true`。图片引用 `../img/...` 或相对路径改为 `/img/...` 并把旧站 `source/img/` 对应素材拷到 `public/img/`。

- [ ] **Step 3: 验证** — `npm run build`；`npx astro check` 无类型错误。Commit `feat: content pipeline and migrated posts`

### Task 4: 布局与主题切换（Header / Footer / BaseLayout）

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/ThemeToggle.astro`

**Interfaces:**
- Produces: `BaseLayout` props `{ title, description, width?: 'narrow'|'wide' }`；全站 `<html data-theme>`；Header 高亮当前项；`ThemeToggle` 读写 `localStorage['wsydf-theme']`

- [ ] **Step 1: BaseLayout.astro**

```astro
---
import { ClientRouter } from 'astro:transitions';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { SITE } from '../config';
import '../styles/global.css';

interface Props { title?: string; description?: string; width?: 'narrow' | 'wide' }
const { title, description = SITE.description, width = 'narrow' } = Astro.props;
const fullTitle = title ? `${title} · ${SITE.name}` : `${SITE.name} · ${SITE.subtitle}`;
---
<!doctype html>
<html lang="zh-CN" data-theme="dark" transition:animate="none">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <script is:inline>
      const t = localStorage.getItem('wsydf-theme');
      if (t) document.documentElement.dataset.theme = t;
    </script>
    <ClientRouter />
  </head>
  <body class="min-h-screen flex flex-col">
    <Header />
    <main class:list={['flex-1 w-full mx-auto px-4 md:px-6', width === 'narrow' ? 'max-w-3xl' : 'max-w-6xl']}>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Header.astro** — 顶部 sticky 玻璃条：左站点名（`glow-text`），中/右 NAV 链接（`aria-currented` 高亮当前路径，移动端收纳为 `<details>` 下拉），最右 ThemeToggle。移动端断点 `md:`。

- [ ] **Step 3: ThemeToggle.astro**

```astro
<button id="theme-toggle" class="rounded-full border border-white/10 p-2" aria-label="切换主题">
  <svg class="h-5 w-5 dark-icon" ...>🌙路径</svg>
  <svg class="h-5 w-5 light-icon hidden" ...>☀️路径</svg>
</button>
<script>
  function syncIcons() {
    const dark = document.documentElement.dataset.theme !== 'light';
    document.querySelector('.dark-icon')?.classList.toggle('hidden', !dark);
    document.querySelector('.light-icon')?.classList.toggle('hidden', dark);
  }
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('wsydf-theme', next);
    syncIcons();
  });
  document.addEventListener('astro:after-swap', syncIcons);
  syncIcons();
</script>
```

- [ ] **Step 4: Footer.astro** — motto、GitHub 链接、© 年份、RSS 占位留 M3。

- [ ] **Step 5: 验证** — dev server 手查：默认深色、切换后刷新保持、导航高亮正确。Commit `feat: base layout with header/footer/theme toggle`

### Task 5: 滚动动效指令 + 文章列表页

**Files:**
- Create: `src/scripts/reveal.ts`（IntersectionObserver 给 `.reveal` 加 `.is-in`；监听 `astro:page-load` 重挂）、`src/pages/posts/index.astro`、`src/components/PostCard.astro`

**Interfaces:**
- Produces: `PostCard` props `{ post: CollectionEntry<'posts'> }`；`/posts` 列出全部 `!draft` 文章（按 date 降序）

- [ ] **Step 1: reveal.ts + 在 BaseLayout 挂载**

```ts
const io = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { threshold: 0.15 });
function scan() { document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el)); }
document.addEventListener('astro:page-load', scan);
scan();
```
（`<script src="../scripts/reveal.ts">` 引入 BaseLayout；reduced-motion 用户 CSS 已兜底显示）

- [ ] **Step 2: PostCard.astro** — glass 卡：标题（hover 辉光）、日期、分类 chip、标签、summary 截断 80 字。整卡 `<a>`，hover `transform: translateY(-4px)` 过渡。

- [ ] **Step 3: /posts 页** — `max-w-6xl` 网格 `sm:grid-cols-2 lg:grid-cols-3`，逐卡加 `class="reveal"`；页面标题用 SectionTitle。Commit `feat: post list with scroll reveal`

### Task 6: 文章详情页

**Files:**
- Create: `src/pages/posts/[slug].astro`（或 `[id].astro`，与 content layer API 对齐）、`src/components/TOC.astro`、`src/components/ReadingProgress.astro`、`src/components/Giscus.astro`

**Interfaces:**
- Produces: `/posts/<slug>` 路由；`getStaticPaths` 由 `getCollection('posts')` 过滤 `!draft`；`render(entry)` 输出 Content + headings
- Giscus 配置放 `src/config.ts` 新增 `GISCUS = { repo: 'WuShuiYDF/WuShuiYDF.github.io', repoId: '<执行时从 giscus.app 生成>', category: 'Announcements', categoryId: '<同上>' }`——执行时提示用户跑 https://giscus.app 生成两行 ID（M1 允许先用占位符注释掉组件，M3 前补齐）

- [ ] **Step 1: ReadingProgress.astro** — 固定顶条 2px 渐变（primary→accent），`width` 由 scroll 监听设置 `transform: scaleX()`。

- [ ] **Step 2: TOC.astro** — 桌面端右侧粘性（`xl:block`），数据来自 `headings`（过滤 h2/h3），当前节高亮用 IntersectionObserver。

- [ ] **Step 3: [slug].astro** — 结构：进度条 → 标题 + 日期/分类/标签 meta → AI 摘要卡（`post.summary` 存在才渲染，样式 glass + 左侧渐变竖线，M4 接自动生成）→ prose 正文（markdown 渲染；补一套 `.prose` 手写排版规则：标题/代码块/引用/表格，深浅主题各一份变量）→ Giscus。`transition:name={post.id}` 供列表→详情的 View Transition。

- [ ] **Step 4: 验证** — `npm run build` 后 `npm run preview`，逐篇打开检查代码高亮深浅切换、TOC 高亮、进度条。Commit `feat: post detail with toc/progress/giscus`

### Task 7: 归档 + 标签页

**Files:**
- Create: `src/pages/archives.astro`, `src/pages/tags/index.astro`, `src/pages/tags/[tag].astro`

- [ ] **Step 1: /archives** — 按年分组时间轴：年份大字（glow-text）+ 竖线 + 每篇一行（日期 muted + 标题链接）。数据源 `getCollection('posts')` 过滤草稿按 date 分组。
- [ ] **Step 2: /tags 与 /tags/[tag]** — 标签云（字重按文章数）+ 该标签文章列表复用 PostCard。
- [ ] **Step 3: 验证 + Commit** `feat: archives and tag pages`

### Task 8: 静态页迁移 + 旧链重定向

**Files:**
- Create: `src/pages/about.astro`, `src/pages/gallery/index.astro`, `src/pages/links.astro`, `src/pages/ai.astro`, `src/pages/music.astro`, `src/pages/<year>/<month>/<day>/<hexo-slug>.astro` ×3
- Read: 旧站 `source/about/index.md`、`source/link/index.md`、`source/Gallery/`、`source/music/index.md`、`source/_data/link.yml`
- Copy: `source/Gallery/**` 图片 → `public/gallery/`；`source/img`（正文引用的）→ `public/img/`

- [ ] **Step 1: about** — 旧 md 内容套新排版（prose 样式）。
- [ ] **Step 2: links** — 读 `source/_data/link.yml` 渲染 flink 风格卡片网格（头像+名称+描述，glass 卡）。
- [ ] **Step 3: gallery** — `import.meta.glob('/public/gallery/**/*.{jpg,png,webp,jpeg}', { eager: true })` 按子文件夹分组渲染瀑布流（`columns-2 md:columns-3`），点击 `<dialog>` 原生灯箱放大。
- [ ] **Step 4: music** — 旧页 meting/aplayer 配置照搬：`<link>`+`<script>` 引 meting CDN，`<meting-js>` 标签保留原 server/type/id。
- [ ] **Step 5: ai 页** — 新版「一凡AI」：介绍 + Coze 按钮（`SITE.coze`）+ 悬浮客服组件（`src/components/CozeWidget.astro`：右下角圆形按钮，iframe 弹层加载 coze 链接；M4 换官方 Web SDK）。
- [ ] **Step 6: 旧链重定向** — 读每篇旧文 frontmatter 的 date 与文件名，生成 `src/pages/<YYYY>/<MM>/<DD>/<hexo-slug>/index.astro`：

```astro
--- // 内容为 meta refresh + fallback link，slug 与日期取旧 frontmatter
---
const target = '/posts/orp-hearthstone/'; // 逐篇改
---
<meta http-equiv="refresh" content={`0;url=${target}`} />
<link rel="canonical" href={target} />
<p>文章已迁移，<a href={target}>点此前往</a>。</p>
```
注意 hexo `:title` 的 URL 化规则：空格→`-`，其余保留（用 `.deploy_git` 里实际生成的目录名为准，逐篇核对）。

- [ ] **Step 7: 验证** — build 后用 `find dist -name 'index.html' | sort` 核对重定向路径与 `.deploy_git` 一致；打开相册/音乐页确认资源加载。Commit `feat: static pages migrated + legacy redirects`

### Task 9: 首页 v1（静态 hero + 精选）

**Files:**
- Create: `src/pages/index.astro`（替换 Task 1 占位）、`src/components/HeroStats.astro`

- [ ] **Step 1: Hero** — 全屏（`min-h-[88svh]`）：aurora 渐变背景（两个大圆 radial-gradient 模糊层，`blur-3xl`，缓慢漂移动画 60s 循环，reduced-motion 关闭）+ 噪点层；中央大标题 `glow-text`「你好，我是无水有点烦」+ 副句 motto + 两个按钮（开始阅读 `/posts`、关于我 `/about`，磁性 hover 效果：`onmousemove` 位移 ±6px）。
- [ ] **Step 2: HeroStats** — 三枚数字滚动卡：文章数（`posts.length`）、总字数（由 `post.body.length` 汇总，≥1k 显示 k 单位）、建站天数（自 2024-01-25 起）。进入视口时 rAF 数字滚动。
- [ ] **Step 3: 精选文章** — 最新 3 篇 PostCard 横排；再一排「探索入口」小卡（归档/相册/AI/友链 图标卡，过渡动画错峰 reveal）。
- [ ] **Step 4: noscript** — `<noscript>` 输出文字版导航与最新文章链接列表（SEO 兜底）。
- [ ] **Step 5: 验证** — Lighthouse（preview 模式）移动端 Performance ≥ 90（M1 无 3D 应轻松达标）。Commit `feat: homepage v1 with hero/stats/featured`

### Task 10: 部署上线 + 视觉验收

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: deploy.yml**

```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 仓库接线（需用户在场）** — 在 GitHub 仓库 Settings→Pages 把 Source 改为 **GitHub Actions**。因 `WuShuiYDF.github.io` 是用户主仓，推送 main 即发布。提供两种选项并让用户选：
  a) 在此仓库新建 `wsydf-world` 目录推送子目录（用 actions/checkout 后 `working-directory`）——域名不变、旧站历史保留；
  b) 独立仓库托管新站（`WuShuiYDF.github.io` 直接整体替换，旧 Hexo 先整库打 tag 备份）。
  默认推荐 a)。
- [ ] **Step 3: 构建验证** — Actions 绿、线上逐页可达（/、/posts、3 条旧链重定向、/gallery）。
- [ ] **Step 4: 视觉验收** — `npm run preview` + 截图（桌面 1440px / 移动 390px，深浅两主题），走 visual-judge 验收；不通过则修复重验。
- [ ] **Step 5: 收尾 Commit** `chore: deploy workflow`，M1 完成报告（含线上 URL、迁移清单、遗留项：Giscus ID、音乐页 CDN 可用性）。

---

## Self-Review 记录

- Spec 覆盖：M1 对应 spec §5 全部路由、§8 的 SEO/动效约束、§10 的构建与视觉验收；3D（§4）、发布链路（§6）、AI（§7）按里程碑留给 M2-M4，各有独立计划。✔
- 占位符扫描：Giscus repoId/categoryId 属用户侧凭据，已写明获取步骤与兜底（组件可暂关）。其余无 TBD/TODO。✔
- 类型一致性：`PostCard` 在 Task 5 定义、Task 9 复用；`SITE/NAV` 在 Task 2 定义、Task 4/8/9 消费；`reveal` class 生命周期 Task 2 定义、Task 5 脚本激活。✔
