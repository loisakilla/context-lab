import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export function agentSandbox(): string {
  const dir = path.join(tmpdir(), 'context-lab-agent');
  mkdirSync(dir, { recursive: true });
  return dir;
}
