import mdx from '@mdx-js/rollup';
import { nodeTypes } from '@mdx-js/mdx';
import rehypeShiki from '@shikijs/rehype';
import { serverFunctions } from '@solidjs/prerender/integration';
import solid from '@solidjs/vite-plugin';
import { fileRoutes } from 'filesystem-routing/vite';
import { prerender } from 'prerender-crawler/vite';
import rehypeRaw from 'rehype-raw';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig } from 'vite';

export default defineConfig({
  // Pages serves the site under the repo name, so assets need that prefix. The
  // /v2 segment on top of it comes from the route tree.
  base: '/solid-validation/',
  plugins: [
    // MDX runs first and emits Solid JSX, which the solid plugin then compiles
    // exactly as it compiles a .tsx route. Pages are the routes: no content
    // directory, no markdown renderer, no demo registry.
    {
      enforce: 'pre',
      ...mdx({
        jsx: true,
        jsxImportSource: '@solidjs/web',
        providerImportSource: '/src/mdx/components.tsx',
        elementAttributeNameCase: 'html',
        stylePropertyNameCase: 'css',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        rehypePlugins: [
          [rehypeRaw, { passThrough: nodeTypes }],
          [
            rehypeShiki,
            {
              themes: { light: 'github-light-default', dark: 'github-dark-default' },
              defaultColor: false,
            },
          ],
        ],
      }),
    },
    solid({
      start: true,
      ssr: true,
      serverFunctions: true,
      extensions: ['.jsx', '.tsx', '.md', '.mdx'],
    }),
    fileRoutes({ extensions: ['tsx', 'jsx', 'md', 'mdx'] }),
    // Crawls the built app and writes every page out as static HTML.
    prerender({ mode: 'static', integrations: [serverFunctions()] }),
  ],
  server: { port: 3000 },
  build: { target: 'esnext' },
});
