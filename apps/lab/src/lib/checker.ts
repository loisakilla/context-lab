import 'server-only';
import { createChecker, parseBundle, runChecks, type CheckReport, type Checker } from '@context-lab/checks';
import bundleJson from '../generated/type-bundle.json';

let checker: Checker | undefined;

export function serverChecker(): Checker {
  checker ??= createChecker(parseBundle(JSON.stringify(bundleJson)));
  return checker;
}

export function checkCode(code: string, expects: string[] = []): CheckReport {
  return runChecks(serverChecker(), code, expects);
}
