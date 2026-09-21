import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@jinx-ui/tokens';
import '@jinx-ui/core';
import './globals.css';

export const metadata: Metadata = {
  title: 'Context Lab',
  description: 'Как контекст меняет код агента на библиотеке Jinx UI',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" data-style="brutal">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
