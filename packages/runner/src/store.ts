import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { libraryKey } from './matrix.ts';
import type { RunRecord } from './types.ts';

export function runsFolder(runsDir: string, library: { version: string; commit: string }): string {
  return path.join(runsDir, libraryKey(library));
}

export function libraryFolders(runsDir: string): string[] {
  if (!existsSync(runsDir)) return [];
  return readdirSync(runsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function readRunFolder(folder: string): RunRecord[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(readFileSync(path.join(folder, file), 'utf8')) as RunRecord);
}
