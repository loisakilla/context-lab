import { spawn } from 'node:child_process';
import { estimateTokens } from '@context-lab/index-tools';
import { addUsage, emptyUsage, type Driver, type GenerationRequest, type GenerationResult, type Turn, type Usage } from '../types.ts';

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ClaudeCodeDriverOptions {
  binary?: string;
  cwd?: string;
  timeoutMs?: number;
  mcpServer?: { name: string; config: McpServerConfig; tools: string[] };
}

interface StreamEvent {
  type: string;
  subtype?: string;
  message?: { role?: string; content?: Array<Record<string, unknown>>; usage?: Record<string, number>; stop_reason?: string };
  result?: string;
  usage?: Record<string, number>;
  total_cost_usd?: number;
  duration_ms?: number;
  is_error?: boolean;
  stop_reason?: string;
}

export const NOT_LOGGED_IN_HINT =
  'Claude Code не авторизован в дочернем процессе. Выполните один раз `claude login` в терминале; учётные данные десктопного приложения дочернему процессу недоступны.';

function usageFrom(raw: Record<string, number> | undefined): Usage {
  return {
    input: raw?.input_tokens ?? 0,
    output: raw?.output_tokens ?? 0,
    cacheRead: raw?.cache_read_input_tokens ?? 0,
    cacheCreation: raw?.cache_creation_input_tokens ?? 0,
  };
}

export interface ParsedStream {
  text: string;
  turns: Turn[];
  usage: Usage;
  stopReason: string;
  costUsd?: number;
  durationMs?: number;
  isError: boolean;
  errorText?: string;
}

export function parseStreamJson(output: string): ParsedStream {
  const turns: Turn[] = [];
  const pendingResults = new Map<string, ToolCallRef>();
  let text = '';
  let usage = emptyUsage();
  let stopReason = 'end_turn';
  let costUsd: number | undefined;
  let durationMs: number | undefined;
  let isError = false;
  let errorText: string | undefined;
  let sawResultUsage = false;

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    let event: StreamEvent;
    try {
      event = JSON.parse(trimmed) as StreamEvent;
    } catch {
      continue;
    }

    if (event.type === 'assistant' && event.message) {
      const turn: Turn = { usage: usageFrom(event.message.usage), toolCalls: [] };
      const texts: string[] = [];
      for (const block of event.message.content ?? []) {
        if (block.type === 'text' && typeof block.text === 'string') texts.push(block.text);
        if (block.type === 'tool_use') {
          const call = { name: String(block.name ?? ''), input: block.input, resultTokens: 0 };
          turn.toolCalls.push(call);
          if (typeof block.id === 'string') pendingResults.set(block.id, call);
        }
      }
      if (texts.length > 0) text = texts.join('\n');
      if (typeof event.message.stop_reason === 'string') stopReason = event.message.stop_reason;
      turns.push(turn);
      usage = addUsage(usage, turn.usage);
    }

    if (event.type === 'user' && event.message) {
      for (const block of event.message.content ?? []) {
        if (block.type !== 'tool_result' || typeof block.tool_use_id !== 'string') continue;
        const call = pendingResults.get(block.tool_use_id);
        if (!call) continue;
        const content = block.content;
        const resultText = typeof content === 'string' ? content : Array.isArray(content) ? content.map((part) => (typeof part === 'object' && part && 'text' in part ? String((part as { text: unknown }).text) : '')).join('\n') : '';
        call.resultTokens = estimateTokens(resultText);
        if (block.is_error === true) call.isError = true;
      }
    }

    if (event.type === 'result') {
      if (typeof event.result === 'string' && event.result.trim().length > 0) text = event.result;
      if (event.usage) {
        usage = usageFrom(event.usage);
        sawResultUsage = true;
      }
      if (typeof event.total_cost_usd === 'number') costUsd = event.total_cost_usd;
      if (typeof event.duration_ms === 'number') durationMs = event.duration_ms;
      if (event.is_error) {
        isError = true;
        errorText = typeof event.result === 'string' ? event.result : event.subtype;
      }
      if (event.subtype && event.subtype !== 'success') stopReason = event.subtype;
    }
  }

  if (!sawResultUsage && turns.length === 0) stopReason = 'no_output';
  const parsed: ParsedStream = { text, turns, usage, stopReason, isError };
  if (costUsd !== undefined) parsed.costUsd = costUsd;
  if (durationMs !== undefined) parsed.durationMs = durationMs;
  if (errorText !== undefined) parsed.errorText = errorText;
  return parsed;
}

type ToolCallRef = Turn['toolCalls'][number];

export function buildClaudeArgs(request: GenerationRequest, options: ClaudeCodeDriverOptions): string[] {
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--no-session-persistence', '--model', request.model, '--append-system-prompt', request.system];
  if (options.mcpServer) {
    args.push('--tools', '');
    args.push('--mcp-config', JSON.stringify({ mcpServers: { [options.mcpServer.name]: options.mcpServer.config } }));
    args.push('--strict-mcp-config');
    args.push('--allowedTools', options.mcpServer.tools.map((tool) => `mcp__${options.mcpServer!.name}__${tool}`).join(','));
    args.push('--max-turns', String(request.maxTurns));
  } else {
    args.push('--tools', '');
  }
  return args;
}

export function composePrompt(request: GenerationRequest): string {
  return request.contextText.length > 0 ? `${request.contextText}\n\n${request.taskText}` : request.taskText;
}

function childEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  return env;
}

export function claudeCodeDriver(options: ClaudeCodeDriverOptions = {}): Driver {
  const binary = options.binary ?? process.env.CLAUDE_CODE_BINARY ?? 'claude';
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;

  return {
    name: 'claude-code',
    generate(request: GenerationRequest): Promise<GenerationResult> {
      const started = Date.now();
      const args = buildClaudeArgs(request, options);
      return new Promise<GenerationResult>((resolve, reject) => {
        const child = spawn(binary, args, { cwd: options.cwd ?? process.cwd(), env: childEnv(), windowsHide: true });
        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => child.kill(), timeoutMs);
        request.signal?.addEventListener('abort', () => child.kill());

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
          stdout += chunk;
          if (request.onText) request.onText(chunk);
        });
        child.stderr.on('data', (chunk: string) => {
          stderr += chunk;
        });
        child.on('error', (error) => {
          clearTimeout(timer);
          reject(new Error(`Не удалось запустить ${binary}: ${error.message}`));
        });
        child.on('close', (code) => {
          clearTimeout(timer);
          const parsed = parseStreamJson(stdout);
          if (parsed.isError || (code !== 0 && parsed.turns.length === 0)) {
            const detail = parsed.errorText ?? stderr.trim().slice(-800) ?? 'без вывода';
            const hint = /not logged in|\/login/i.test(detail) ? ` ${NOT_LOGGED_IN_HINT}` : '';
            reject(new Error(`claude -p завершился с кодом ${code}: ${detail}.${hint}`));
            return;
          }
          const result: GenerationResult = {
            text: parsed.text,
            turns: parsed.turns,
            usage: parsed.usage,
            stopReason: parsed.stopReason,
            durationMs: parsed.durationMs ?? Date.now() - started,
          };
          if (parsed.costUsd !== undefined) result.costUsd = parsed.costUsd;
          resolve(result);
        });

        child.stdin.on('error', () => undefined);
        child.stdin.end(composePrompt(request));
      });
    },
  };
}
