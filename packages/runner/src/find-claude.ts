import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

function versionParts(dir: string): number[] {
  return dir.split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function newestVersionDir(root: string): string | undefined {
  if (!existsSync(root)) return undefined;
  const dirs = readdirSync(root).filter((entry) => /^\d+\.\d+\.\d+/.test(entry));
  dirs.sort((a, b) => {
    const left = versionParts(a);
    const right = versionParts(b);
    for (let position = 0; position < 3; position += 1) {
      if ((left[position] ?? 0) !== (right[position] ?? 0)) return (right[position] ?? 0) - (left[position] ?? 0);
    }
    return 0;
  });
  return dirs[0];
}

export function findClaudeBinary(): string {
  const explicit = process.env.CLAUDE_CODE_BINARY;
  if (explicit && existsSync(explicit)) return explicit;

  const suffix = process.platform === 'win32' ? '.exe' : '';
  const candidates = [path.join(homedir(), '.local', 'bin', `claude${suffix}`)];
  if (process.platform === 'win32' && process.env.APPDATA) candidates.push(path.join(process.env.APPDATA, 'npm', 'claude.cmd'));

  const desktop = process.env.APPDATA ? path.join(process.env.APPDATA, 'Claude', 'claude-code') : undefined;
  if (desktop) {
    const newest = newestVersionDir(desktop);
    if (newest) candidates.push(path.join(desktop, newest, `claude${suffix}`));
  }

  return candidates.find((candidate) => existsSync(candidate)) ?? 'claude';
}
