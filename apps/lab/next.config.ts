import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jinx-ui/react', '@context-lab/runner', '@context-lab/index-tools', '@context-lab/checks', '@context-lab/docgen'],
  serverExternalPackages: ['typescript', '@typescript/vfs', 'postcss', 'gray-matter'],
  outputFileTracingRoot: path.join(import.meta.dirname, '..', '..'),
  outputFileTracingExcludes: {
    '/api/local-run': ['**/*'],
    '*': ['.git/**', 'data/runs/**', 'vendor/**/node_modules/**', 'apps/lab/public/preview/**'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.anthropic.com; frame-src 'self'; worker-src 'self' blob:",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
