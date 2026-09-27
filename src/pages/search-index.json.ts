import { getCollection } from 'astro:content';

// 构建时生成全站搜索索引（正文截断 6000 字，够 Fuse 检索用）
export const GET = async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const index = posts.map((p) => ({
    title: p.data.title,
    summary: p.data.summary ?? '',
    tags: p.data.tags,
    category: p.data.category ?? '',
    date: p.data.date.toISOString().slice(0, 10),
    url: `/posts/${p.id}/`,
    body: (p.body ?? '')
      .replace(/[#*`>\[\]!(){}|~$]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 6000),
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
