import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

interface Manifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function jinxPins(relative: string): Record<string, string> {
  const manifest = JSON.parse(readFileSync(path.join(root, relative), 'utf8')) as Manifest;
  const all = { ...manifest.devDependencies, ...manifest.dependencies };
  return Object.fromEntries(Object.entries(all).filter(([name]) => name.startsWith('@jinx-ui/')));
}

describe('версия библиотеки-цели', () => {
  it('в лаборатории закреплена та же версия Jinx UI, из которой собираются индекс и бандл типов', () => {
    const tooling = jinxPins('package.json');
    const lab = jinxPins('apps/lab/package.json');
    expect(Object.keys(tooling).length).toBeGreaterThan(0);
    expect(lab).toEqual(tooling);
  });
});
