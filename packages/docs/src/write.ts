import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { LibraryIndex } from '@context-lab/index-tools';
import { renderComponentDoc, renderLlmsFull, renderLlmsTxt, renderTokensDoc } from './render.ts';

export interface DocsBundle {
  files: Record<string, string>;
}

export function renderDocsBundle(index: LibraryIndex): DocsBundle {
  const files: Record<string, string> = {
    'llms.txt': renderLlmsTxt(index),
    'llms-full.txt': renderLlmsFull(index),
    'tokens.md': renderTokensDoc(index.tokens),
    'index.json': `${JSON.stringify(index, null, 2)}\n`,
  };
  for (const component of index.components) {
    files[`components/${component.name}.md`] = renderComponentDoc(component, index);
  }
  return { files };
}

export function writeDocs(index: LibraryIndex, outDir: string): string[] {
  const bundle = renderDocsBundle(index);
  const written: string[] = [];
  for (const [relative, content] of Object.entries(bundle.files)) {
    const target = path.join(outDir, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf8');
    written.push(relative);
  }
  return written;
}

export function findDocsDrift(index: LibraryIndex, outDir: string): string[] {
  const bundle = renderDocsBundle(index);
  const drifted: string[] = [];
  for (const [relative, content] of Object.entries(bundle.files)) {
    let committed: string | undefined;
    try {
      committed = readFileSync(path.join(outDir, relative), 'utf8');
    } catch {
      committed = undefined;
    }
    if (committed !== content) drifted.push(relative);
  }
  return drifted;
}

export function docsVersionDir(baseDir: string, index: LibraryIndex): string {
  return path.join(baseDir, index.library.version);
}
