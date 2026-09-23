import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { libraryCommit } from '../src/config.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const installed = path.join(repo, 'node_modules/@jinx-ui/react');
const labHead = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

describe('libraryCommit', () => {
  it('не выдаёт коммит объемлющего репозитория за коммит установленной библиотеки', () => {
    const commit = libraryCommit(installed);
    expect(commit).not.toBe(labHead);
    expect(commit).toBe('');
  });

  it('берёт коммит из gitHead в package.json установленного пакета', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'library-commit-'));
    const pkg = path.join(dir, 'node_modules', 'ui-kit');
    mkdirSync(pkg, { recursive: true });
    writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'ui-kit', version: '1.0.0', gitHead: 'abc1234def' }), 'utf8');
    expect(libraryCommit(pkg)).toBe('abc1234def');
    rmSync(dir, { recursive: true, force: true });
  });

  it('берёт коммит чекаута и тогда, когда библиотека лежит в подпапке репозитория', () => {
    expect(libraryCommit(repo)).toBe(labHead);
    expect(libraryCommit(path.join(repo, 'packages', 'docgen'))).toBe(labHead);
  });

  it.runIf(process.platform === 'win32')('не теряет коммит, если путь записан в другом регистре', () => {
    expect(libraryCommit(repo.toLowerCase())).toBe(labHead);
  });
});
