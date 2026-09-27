#!/usr/bin/env node
// Notion → 博客内容同步（无服务器依赖，原生 fetch）
// 环境变量：NOTION_TOKEN + NOTION_DATABASE_ID（缺失则静默退出，不影响其它任务）
// Notion 数据库属性约定：Name(title) / Slug(rich_text) / Date(date) / Tags(multi_select)
//                        / Category(select) / Status(select: Draft | Published)
// 用法：把数据库分享给 Integration 后，GitHub Actions 每 30 分钟拉一次 Published 页面
//       转成 markdown 写入 src/content/posts/（由 workflow 负责提交推送）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const POSTS = join(ROOT, 'src/content/posts');
const IMG = join(ROOT, 'public/images/notion');
const TOKEN = process.env.NOTION_TOKEN;
const DB = process.env.NOTION_DATABASE_ID;

if (!TOKEN || !DB) {
  console.log('[notion-sync] 未配置 NOTION_TOKEN / NOTION_DATABASE_ID，跳过同步');
  process.exit(0);
}

const API = 'https://api.notion.com/v1';
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function notion(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// rich_text 数组 → markdown（含粗体/斜体/行内代码/链接）
function rt2md(rich) {
  return (rich ?? [])
    .map((r) => {
      let t = r.plain_text ?? '';
      if (r.href) t = `[${t}](${r.href})`;
      if (r.annotations?.code) t = `\`${t}\``;
      if (r.annotations?.bold) t = `**${t}**`;
      if (r.annotations?.italic) t = `*${t}*`;
      return t;
    })
    .join('');
}

async function blocksToMd(blockId, imgName) {
  const out = [];
  let cursor;
  let imgIdx = 0;
  do {
    const res = await notion(`/blocks/${blockId}/children${cursor ? `?start_cursor=${cursor}` : ''}`);
    for (const b of res.results ?? []) {
      const t = b.type;
      const v = b[t] ?? {};
      const text = rt2md(v.rich_text);
      switch (t) {
        case 'paragraph': out.push(text, ''); break;
        case 'heading_1': out.push(`# ${text}`, ''); break;
        case 'heading_2': out.push(`## ${text}`, ''); break;
        case 'heading_3': out.push(`### ${text}`, ''); break;
        case 'bulleted_list_item': out.push(`- ${text}`); break;
        case 'numbered_list_item': out.push(`1. ${text}`); break;
        case 'to_do': out.push(`- [${v.checked ? 'x' : ' '}] ${text}`); break;
        case 'quote': out.push(`> ${text}`, ''); break;
        case 'callout': out.push(`> 💡 ${text}`, ''); break;
        case 'code': out.push('```' + (v.language || ''), text, '```', ''); break;
        case 'divider': out.push('---', ''); break;
        case 'image': {
          const src = v.type === 'external' ? v.external.url : v.file.url;
          const ext = (src.split('?')[0].match(/\.(png|jpe?g|gif|webp)$/i)?.[1] ?? 'png').toLowerCase();
          imgIdx++;
          try {
            const imgRes = await fetch(src);
            if (imgRes.ok) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              const name = `${imgName}-${imgIdx}.${ext}`;
              writeFileSync(join(IMG, name), buf);
              out.push(`![](/images/notion/${name})`, '');
            } else out.push(`![](${src})`, '');
          } catch { out.push(`![](${src})`, ''); }
          break;
        }
        case 'bookmark': case 'link_preview': out.push(`[${v.url}](${v.url})`, ''); break;
        case 'child_database': out.push(`（内嵌数据库：${rt2md(v.title)}）`, ''); break;
        default:
          if (text) out.push(text, '');
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const yamlEsc = (v) => `'${String(v ?? '').replaceAll("'", "''")}'`;

async function main() {
  mkdirSync(POSTS, { recursive: true });
  mkdirSync(IMG, { recursive: true });
  const data = await notion(`/databases/${DB}/query`, {
    filter: { property: 'Status', select: { equals: 'Published' } },
    page_size: 100,
  });
  let count = 0;
  for (const page of data.results ?? []) {
    const props = page.properties ?? {};
    const title = rt2md(props.Name?.title) || '未命名';
    const slug = (props.Slug?.rich_text?.[0]?.plain_text ?? page.id.replaceAll('-', '')).slice(0, 80);
    const date = props.Date?.date?.start ?? page.last_edited_time;
    const tags = (props.Tags?.multi_select ?? []).map((t) => t.name);
    const category = props.Category?.select?.name;
    const fm = [
      '---',
      `title: ${yamlEsc(title)}`,
      `date: ${yamlEsc(date)}`,
      tags.length ? `tags: [${tags.map(yamlEsc).join(', ')}]` : 'tags: []',
      category ? `category: ${yamlEsc(category)}` : null,
      `source: notion`,
      '---',
      '',
    ].filter(Boolean).join('\n');
    const md = await blocksToMd(page.id, slug.replaceAll(/[^\w-]/g, ''));
    writeFileSync(join(POSTS, `${slug}.md`), `${fm}\n${md}\n`);
    count++;
    console.log(`[notion-sync] ${slug} ← ${title}`);
  }
  console.log(`[notion-sync] 同步完成：${count} 篇`);
}

main().catch((e) => {
  console.error(`[notion-sync] 失败：${e.message}`);
  process.exit(0); // 同步失败不阻塞后续流程，下次定时任务重试
});
