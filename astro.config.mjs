// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://wushuiydf.github.io',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  vite: {
    // @ts-expect-error @tailwindcss/vite 自带的 vite 类型与 astro 锁定的 vite 版本不一致，运行时兼容
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      wrap: true,
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
