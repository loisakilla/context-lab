import { lintCode, usedComponents, type LintFinding, type LintOptions } from './lint.ts';
import type { Checker, TscReport } from './typecheck.ts';

export interface CheckReport {
  tsc: TscReport;
  lint: LintFinding[];
  usedComponents: string[];
  expectedCoverage: number;
  passed: boolean;
}

export function expectedCoverage(used: string[], expects: string[]): number {
  if (expects.length === 0) return 1;
  const hit = expects.filter((name) => used.includes(name)).length;
  return Number((hit / expects.length).toFixed(2));
}

export function runChecks(checker: Checker, code: string, expects: string[] = [], lintOptions?: LintOptions): CheckReport {
  const tsc = checker.typecheck(code);
  const lint = lintCode(code, lintOptions);
  const used = usedComponents(code);
  const lintErrors = lint.filter((finding) => finding.severity === 'error').length;
  return {
    tsc,
    lint,
    usedComponents: used,
    expectedCoverage: expectedCoverage(used, expects),
    passed: tsc.errors.length === 0 && lintErrors === 0,
  };
}
