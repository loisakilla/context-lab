import type { ContextMode, ContextSource } from '@context-lab/runner/browser';

export interface BuiltPreview {
  mode: ContextMode;
  tokens: number;
  sources: ContextSource[];
  tools: Array<{ name: string; description: string }> | null;
  body: string;
  bodyLength: number;
  taskAround: [string, string];
}

export interface FailedPreview {
  mode: ContextMode;
  error: string;
}

export type ModePreview = BuiltPreview | FailedPreview;

export function taskTextOf(preview: BuiltPreview, prompt: string): string {
  return `${preview.taskAround[0]}${prompt}${preview.taskAround[1]}`;
}
