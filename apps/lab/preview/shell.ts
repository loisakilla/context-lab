export const PREVIEW_CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob:; connect-src 'none'; form-action 'none'";

export function previewShell(script: string, styles: string): string {
  return `<!doctype html>
<html lang="ru" data-theme="light" data-style="brutal">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}" />
    <title>Preview</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" />
    <style>
${styles}
      html, body { margin: 0; background: var(--jx-bg); color: var(--jx-text); font-family: var(--jx-font-sans, system-ui, sans-serif); }
      #root { padding: 16px; }
      .preview-error { white-space: pre-wrap; padding: 12px; border: 2px solid var(--jx-danger); border-radius: var(--jx-r, 4px); color: var(--jx-danger); font: 13px/1.4 var(--jx-font-mono, monospace); }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
${script}
    </script>
  </body>
</html>
`;
}
