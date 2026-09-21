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
        test: {
          name: 'lab',
          include: ['apps/lab/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
