import { estimateTokens } from '@context-lab/index-tools';
import { buildContext, CONTEXT_MODES, contextTokens, knownModels, libraryKey, type BuiltContext, type ContextMode, type ContextSources, type Matrix, type RunRecord, type Task } from '@context-lab/runner/browser';

export { buildContext, CONTEXT_MODES, contextTokens, knownModels, libraryKey };
export type { BuiltContext, ContextMode, ContextSources, Matrix, RunRecord, Task };

const PROBE: Task = { id: 'probe', title: 'probe', prompt: 'probe', taskType: 'ui', expects: [] };

export function estimateContext(sources: ContextSources): Record<ContextMode, number> {
  const result = {} as Record<ContextMode, number>;
  for (const mode of CONTEXT_MODES) {
    try {
      result[mode] = contextTokens(buildContext(mode, PROBE, sources));
    } catch {
      result[mode] = estimateTokens('');
    }
  }
  return result;
}
