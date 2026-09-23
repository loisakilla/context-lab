import { readFileSync } from 'node:fs';
import type { LibraryIndex } from '@context-lab/index-tools';

export { loadConfig, resolveFrom } from './config.ts';
export type { LabConfig, LibraryConfig } from './config.ts';

export function loadIndex(file: string): LibraryIndex {
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<LibraryIndex>;
  if (parsed.schemaVersion !== 2 || !Array.isArray(parsed.components) || !parsed.library) {
    throw new Error(`Файл ${file} не похож на индекс компонентов (schemaVersion 2)`);
  }
  return parsed as LibraryIndex;
}
