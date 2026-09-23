import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CompiledFile, CompileTarget } from './types.ts';

const RULE_DIRECTORIES: Partial<Record<CompileTarget, string>> = {
  claude: '.claude/rules',
  cursor: '.cursor/rules',
  copilot: '.github/instructions',
};

const RULE_MARKER = /<!-- [\w-]+\/[\w-]+@\d+\.\d+\.\d+/;

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

export function findOrphans(files: CompiledFile[], outDir: string, targets: readonly CompileTarget[]): string[] {
  const expected = new Set(files.map((file) => file.path));
  const orphans: string[] = [];
  for (const target of targets) {
    const directory = RULE_DIRECTORIES[target];
    if (!directory) continue;
    const full = path.join(outDir, directory);
    if (!existsSync(full)) continue;
    for (const entry of readdirSync(full, { withFileTypes: true })) {
      const relative = `${directory}/${entry.name}`;
      if (!entry.isFile() || expected.has(relative)) continue;
      if (RULE_MARKER.test(readFileSync(path.join(full, entry.name), 'utf8'))) orphans.push(relative);
    }
  }
  return orphans.sort();
}

export function removeOrphans(files: CompiledFile[], outDir: string, targets: readonly CompileTarget[]): string[] {
  const orphans = findOrphans(files, outDir, targets);
  for (const orphan of orphans) rmSync(path.join(outDir, orphan), { force: true });
  return orphans;
}
