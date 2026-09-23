import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { libraryCommit } from '../src/config.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const installed = path.join(repo, 'node_modules/@jinx-ui/react');

describe('libraryCommit', () => {
  it('не выдаёт коммит объемлющего репозитория за коммит установленной библиотеки', () => {
    const labHead = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const commit = libraryCommit(installed);
    expect(commit).not.toBe(labHead);
    expect(commit).toBe('');
  });

  it('берёт коммит у репозитория, корнем которого библиотека является сама', () => {
    const labHead = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    expect(libraryCommit(repo)).toBe(labHead);
  });
});
