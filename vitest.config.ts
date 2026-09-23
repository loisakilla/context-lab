import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'packages',
          include: ['packages/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: { '@': path.join(import.meta.dirname, 'apps/lab/src') },
        },
        test: {
          name: 'lab',
          include: ['apps/lab/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
    ],
  },
});
