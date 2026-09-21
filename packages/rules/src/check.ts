import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CompiledFile } from './types.ts';

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
