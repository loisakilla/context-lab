import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { BuildOptions } from './build.ts';

export interface LibraryConfig {
  name: string;
  package?: string;
  libraryRoot: string;
  packageRoot: string;
  entry?: string;
  docsDir?: string;
  tokensCss?: string[];
  readme?: string;
}

export interface LabConfig {
  root: string;
  library: LibraryConfig;
  index: string;
  docs: string;
  tasks: string;
  runs: string;
  matrix: string;
}

export function loadConfig(file = 'context-lab.config.json'): LabConfig {
  const absolute = path.resolve(file);
  const raw = JSON.parse(readFileSync(absolute, 'utf8')) as Omit<LabConfig, 'root'>;
  return { root: path.dirname(absolute), ...raw };
}

export function resolveFrom(config: LabConfig, relative: string): string {
  return path.resolve(config.root, relative);
}

function manifestGitHead(libraryRoot: string): string {
  try {
    const raw = JSON.parse(readFileSync(path.join(libraryRoot, 'package.json'), 'utf8')) as { gitHead?: string };
    return raw.gitHead ?? '';
  } catch {
    return '';
  }
}

export function libraryCommit(libraryRoot: string): string {
  const fromManifest = manifestGitHead(libraryRoot);
  if (fromManifest) return fromManifest;
  try {
    const topLevel = execFileSync('git', ['-C', libraryRoot, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    if (path.resolve(topLevel) !== path.resolve(libraryRoot)) return '';
    return execFileSync('git', ['-C', libraryRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

export function buildOptionsFromConfig(config: LabConfig): BuildOptions {
  const { library } = config;
  const libraryRoot = resolveFrom(config, library.libraryRoot);
  return {
    packageRoot: resolveFrom(config, library.packageRoot),
    libraryRoot,
    ...(library.entry ? { entry: library.entry } : {}),
    ...(library.docsDir ? { docsDir: resolveFrom(config, library.docsDir) } : {}),
    tokensCss: (library.tokensCss ?? []).map((file) => resolveFrom(config, file)),
    library: {
      name: library.name,
      ...(library.package ? { package: library.package } : {}),
      commit: libraryCommit(libraryRoot),
    },
  };
}
