import type { Usage } from './types.ts';

export interface ModelPrice {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export const PRICES_UPDATED_AT = '2026-06-24';

const PER_MILLION: Record<string, ModelPrice> = {
  'claude-opus-5': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-8': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-opus-4-7': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-sonnet-5': { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

const ALIASES: Record<string, string> = {
  opus: 'claude-opus-5',
  sonnet: 'claude-sonnet-5',
  haiku: 'claude-haiku-4-5',
};

export function canonicalModel(model: string): string {
  const alias = ALIASES[model];
  if (alias) return alias;
  const known = Object.keys(PER_MILLION).find((name) => model.startsWith(name));
  return known ?? model;
}

export function priceOf(model: string, usage: Usage): number | undefined {
  const price = PER_MILLION[canonicalModel(model)];
  if (!price) return undefined;
  const usd = (usage.input * price.input + usage.output * price.output + usage.cacheRead * price.cacheRead + usage.cacheCreation * price.cacheWrite) / 1_000_000;
  return Number(usd.toFixed(6));
}

export function knownModels(): string[] {
  return Object.keys(PER_MILLION);
}
