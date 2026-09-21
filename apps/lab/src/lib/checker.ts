import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createChecker, parseBundle, runChecks, type CheckReport, type Checker } from '@context-lab/checks';

const BUNDLE_PATH = path.join(process.cwd(), 'src', 'generated', 'type-bundle.json');

let checker: Checker | undefined;

export function serverChecker(): Checker {
  if (!checker) {
    if (!existsSync(BUNDLE_PATH)) {
      throw new Error('Бандл типов не собран: выполните npm run types:bundle (или npm run lab:prepare) в корне репозитория');
    }
    checker = createChecker(parseBundle(readFileSync(BUNDLE_PATH, 'utf8')));
  }
  return checker;
}

export function checkCode(code: string, expects: string[] = []): CheckReport {
  return runChecks(serverChecker(), code, expects);
}
