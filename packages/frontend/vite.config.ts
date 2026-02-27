import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

const backendEnvDir = fileURLToPath(new URL('../backend', import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const backendEnv = loadEnv(mode, backendEnvDir, '');
  const backendPort = backendEnv.PORT || '3000';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/graphql': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './vitest.setup.ts',
      css: true,
      exclude: [...configDefaults.exclude, 'e2e/**'],
      coverage: {
        reporter: ['text', 'lcov', 'html'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          ...configDefaults.coverage.exclude!,
          'src/vite-env.d.ts',
          'src/graphql/**',
          'src/components/types.ts',
        ],
        thresholds: {
          branches: 75,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  };
});
