import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import solid from '@solidjs/vite-plugin';

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [
    solid(),
    // TypeScript 7 dropped the JavaScript compiler API, so this reads types
    // through the @typescript/typescript6 fallback. Both are dev dependencies.
    dts({ tsconfigPath: 'tsconfig.build.json' }),
  ],
  build: {
    lib: {
      entry: { main: 'src/main.ts', pocketbase: 'src/pocketbase.ts' },
      formats: ['es', 'cjs'],
    },
    // solid-js is a peer dependency and must never end up in the bundle.
    rollupOptions: { external: [/^solid-js(\/.*)?$/] },
  },
  resolve: {
    // Solid must resolve to its dev build inside tests, and only once.
    conditions: ['development', 'browser'],
    dedupe: ['solid-js', 'solid-js/web', 'solid-js/store'],
    // Mirrors the docs site aliases so the live demos are covered by CI.
    alias: {
      '@sparkstone/solid-validation/pocketbase': src('./src/pocketbase.ts'),
      '@sparkstone/solid-validation': src('./src/main.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    testTimeout: 10_000,
    coverage: { provider: 'v8', include: ['src/**/*.ts'], reporter: ['text', 'html'] },
  },
});
