import type { CheckReport } from '@context-lab/checks';
import type { JsonSchemaTool, ToolResult } from '@context-lab/index-tools';

export const CONTEXT_MODES = ['none', 'readme', 'docs', 'docs+rules', 'mcp'] as const;
export type ContextMode = (typeof CONTEXT_MODES)[number];

export const DRIVER_NAMES = ['claude-code', 'api', 'subagent'] as const;
export type DriverName = (typeof DRIVER_NAMES)[number];

export interface Task {
  id: string;
  title: string;
  prompt: string;
  taskType: string;
  expects: string[];
}

export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

export interface ToolCall {
  name: string;
  input: unknown;
  resultTokens: number;
  isError?: boolean;
}

export interface Turn {
  usage: Usage;
  toolCalls: ToolCall[];
}

export interface ContextSource {
  kind: 'readme' | 'docs' | 'rules' | 'tools';
  id: string;
  version: string;
  tokens: number;
}

export interface BuiltContext {
  mode: ContextMode;
  system: string;
  contextText: string;
  taskText: string;
  tools?: JsonSchemaTool[];
  runTool?: (name: string, args: unknown) => ToolResult;
  sources: ContextSource[];
}

export interface GenerationRequest {
  model: string;
  effort?: string;
  system: string;
  contextText: string;
  taskText: string;
  tools?: JsonSchemaTool[];
  runTool?: (name: string, args: unknown) => ToolResult;
  maxTurns: number;
  signal?: AbortSignal;
  onText?: (delta: string) => void;
}

export interface GenerationResult {
  text: string;
  turns: Turn[];
  usage: Usage;
  stopReason: string;
  durationMs: number;
  costUsd?: number;
  raw?: unknown;
}

export interface Driver {
  name: DriverName;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}

export interface RunRecord {
  id: string;
  createdAt: string;
  repeat: number;
  durationMs: number;
  driver: DriverName;
  library: { name: string; version: string; commit: string };
  model: string;
  effort?: string;
  mode: ContextMode;
  task: Task;
  context: { tokens: number; sources: ContextSource[] };
  turns: Turn[];
  usage: Usage;
  costUsd: number | null;
  stopReason: string;
  output: { code: string; text: string };
  checks: CheckReport | null;
  verdict: { passed: boolean; score: number };
}

export function emptyUsage(): Usage {
  return { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
}

export function addUsage(total: Usage, part: Usage): Usage {
  return {
    input: total.input + part.input,
    output: total.output + part.output,
    cacheRead: total.cacheRead + part.cacheRead,
    cacheCreation: total.cacheCreation + part.cacheCreation,
  };
}
