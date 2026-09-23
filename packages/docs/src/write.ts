import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { LibraryIndex } from '@context-lab/index-tools';
import { renderDocsBundle } from './render.ts';

function listFiles(dir: string, prefix = ''): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(path.join(dir, entry.name), relative) : [relative];
  });
}

function staleFiles(files: Record<string, string>, outDir: string): string[] {
  return listFiles(outDir)
    .filter((relative) => !(relative in files))
    .sort();
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
  for (const stale of staleFiles(bundle.files, outDir)) rmSync(path.join(outDir, stale), { force: true });
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
  return [...drifted, ...staleFiles(bundle.files, outDir)];
}

export function docsVersionDir(baseDir: string, index: LibraryIndex): string {
  return path.join(baseDir, index.library.version);
}

export function docsDirReader(dir: string): (relative: string) => string | undefined {
  const root = path.resolve(dir);
  return (relative) => {
    const file = path.resolve(root, relative);
    const inside = path.relative(root, file);
    if (inside.startsWith('..') || path.isAbsolute(inside)) return undefined;
    return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  };
}
