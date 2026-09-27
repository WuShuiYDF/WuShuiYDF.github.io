#!/usr/bin/env node
// 构建时 AI 摘要：给没有 summary 的文章生成 60-80 字中文摘要
// 环境变量：AI_API_KEY（必填，缺失则跳过）、AI_BASE_URL（默认智谱）、AI_MODEL（默认 glm-4-flash，免费档）
// 结果缓存到 .ai-cache/summaries.json（随仓库提交，避免重复消耗额度）
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const POSTS = join(ROOT, 'src/content/posts');
const CACHE_DIR = join(ROOT, '.ai-cache');
const CACHE = join(CACHE_DIR, 'summaries.json');

if (!process.env.AI_API_KEY) {
  console.log('[ai-summary] 未配置 AI_API_KEY，跳过摘要生成（不影响构建）');
  process.exit(0);
}

const BASE_URL = (process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '');
const MODEL = process.env.AI_MODEL || 'glm-4-flash';

// 极简 frontmatter 解析（够用即可）
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { fm: {}, body: raw };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
  }
  return { fm, body: raw.slice(m[0].length) };
}

const slugFromFile = (f) => f.replace(/\.md$/, '');
const files = readdirSync(POSTS).filter((f) => f.endsWith('.md'));
mkdirSync(CACHE_DIR, { recursive: true });
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
let generated = 0;

async function summarize(title, text) {
  const prompt = `用中文为下面这篇博客文章写一段 60-80 字的摘要，客观概括核心内容，不要出现"本文/文章"字样，直接输出摘要正文：\n\n标题：${title}\n\n${text}`;
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 150,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim().replace(/^["'「]|["'」]$/g, '');
}

for (const file of files) {
  const slug = slugFromFile(file);
  const raw = readFileSync(join(POSTS, file), 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  if (fm.summary || fm.draft === 'true') continue;
  if (cache[slug]) continue;
  const plain = body.replace(/[#*`>\[\]!(){}|~$]/g, ' ').replace(/\s+/g, ' ').slice(0, 2400);
  if (plain.trim().length < 50) continue;
  try {
    const summary = await summarize(fm.title ?? slug, plain);
    if (summary) {
      cache[slug] = summary;
      generated++;
      console.log(`[ai-summary] ${slug}: ${summary.slice(0, 40)}…`);
    }
  } catch (e) {
    console.warn(`[ai-summary] ${slug} 失败：${e.message}（不阻塞构建）`);
  }
}

writeFileSync(CACHE, JSON.stringify(cache, null, 2));
console.log(`[ai-summary] 完成：新生成 ${generated} 篇，缓存共 ${Object.keys(cache).length} 篇`);
