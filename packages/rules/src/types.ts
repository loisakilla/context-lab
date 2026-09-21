export const COMPILE_TARGETS = ['claude', 'agents', 'cursor', 'copilot', 'text'] as const;
export type CompileTarget = (typeof COMPILE_TARGETS)[number];

export type RuleTarget = 'claude' | 'cursor' | 'copilot' | 'agents';

export interface RuleDefinition {
  id: string;
  version: string;
  title: string;
  body: string;
  appliesTo: string[];
  taskTypes: string[];
  priority: number;
  targets: RuleTarget[];
  extends?: string;
  conflictsWith: string[];
  set: string;
  file: string;
}

export interface RuleSet {
  name: string;
  version: string;
  description?: string;
  extends: string[];
  rules: RuleDefinition[];
  dir: string;
}

export interface Registry {
  sets: Map<string, RuleSet>;
  root: string;
}

export interface Provenance {
  id: string;
  version: string;
  definedIn: string;
  overrides?: string;
  refines?: string;
}

export interface ResolvedRule extends RuleDefinition {
  qualifiedId: string;
  definedIn: string;
  overrides?: string;
  refines?: string;
  tokens: number;
}

export interface ResolveOptions {
  taskType?: string;
  filePath?: string;
  target?: RuleTarget;
  budget?: number;
}

export interface Resolution {
  set: string;
  chain: string[];
  rules: ResolvedRule[];
  omitted: ResolvedRule[];
  provenance: Provenance[];
  tokens: number;
  options: ResolveOptions;
}

export interface CompiledFile {
  path: string;
  content: string;
}

export interface LintIssue {
  level: 'error' | 'warning';
  set: string;
  rule?: string;
  message: string;
}
