import { existsSync } from 'node:fs';
import path from 'node:path';
import { TOOL_NAMES } from '@context-lab/index-tools';
import type { ClaudeCodeDriverOptions } from './drivers/claude-code.ts';

export const MCP_SERVER_NAME = 'context-lab';
export const MCP_TOOL_NAMES: string[] = [...TOOL_NAMES];

export function repoMcpServer(root: string, configFile = 'context-lab.config.json'): NonNullable<ClaudeCodeDriverOptions['mcpServer']> {
  const tsx = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const cli = path.join(root, 'packages', 'mcp', 'src', 'cli.ts');
  if (!existsSync(cli)) throw new Error(`MCP-сервер не найден: нет ${cli}`);
  if (!existsSync(tsx)) throw new Error('tsx не установлен: выполните npm install');
  return {
    name: MCP_SERVER_NAME,
    config: { command: process.execPath, args: [tsx, cli, 'serve', '--config', path.join(root, configFile), '--no-instructions'] },
    tools: MCP_TOOL_NAMES,
  };
}

export function commandMcpServer(command: string): NonNullable<ClaudeCodeDriverOptions['mcpServer']> {
  const [head, ...rest] = command.split(/\s+/).filter(Boolean);
  return { name: MCP_SERVER_NAME, config: { command: head ?? 'node', args: rest }, tools: MCP_TOOL_NAMES };
}
