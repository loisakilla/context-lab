import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findClaudeBinary } from '../packages/runner/src/find-claude.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const binary = findClaudeBinary();
process.stderr.write(`Локальный режим: CONTEXT_LAB_LOCAL=1, Claude Code — ${binary}\n`);

const child = spawn('npm', ['run', 'dev', '-w', '@context-lab/lab', '--', '--hostname', '127.0.0.1'], {
  cwd: root,
  env: { ...process.env, CONTEXT_LAB_LOCAL: '1', CLAUDE_CODE_BINARY: binary },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 0));
