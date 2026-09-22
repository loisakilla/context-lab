import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CompiledFile } from './types.ts';

const GENERATED_EXTENSIONS = new Set(['.md', '.mdc']);

export function writeCompiled(files: CompiledFile[], outDir: string): string[] {
  const written: string[] = [];
  for (const file of files) {
    const target = path.join(outDir, file.path);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, file.content, 'utf8');
    written.push(file.path);
  }
  return written;
}

export function findDrift(files: CompiledFile[], outDir: string): string[] {
  const drifted: string[] = [];
  for (const file of files) {
    const target = path.join(outDir, file.path);
    const committed = existsSync(target) ? readFileSync(target, 'utf8') : undefined;
    if (committed !== file.content) drifted.push(file.path);
  }
  return drifted;
}

export function findOrphans(files: CompiledFile[], outDir: string): string[] {
  const expected = new Set(files.map((file) => file.path));
  const directories = new Set(files.map((file) => path.posix.dirname(file.path)));
  const orphans: string[] = [];
  for (const directory of directories) {
    const full = directory === '.' ? outDir : path.join(outDir, directory);
    if (!existsSync(full)) continue;
    for (const entry of readdirSync(full, { withFileTypes: true })) {
      if (!entry.isFile() || !GENERATED_EXTENSIONS.has(path.extname(entry.name))) continue;
      const relative = directory === '.' ? entry.name : `${directory}/${entry.name}`;
      if (!expected.has(relative)) orphans.push(relative);
    }
  }
  return orphans.sort();
}

export function removeOrphans(files: CompiledFile[], outDir: string): string[] {
  const orphans = findOrphans(files, outDir);
  for (const orphan of orphans) rmSync(path.join(outDir, orphan), { force: true });
  return orphans;
}
