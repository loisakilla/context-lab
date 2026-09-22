import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createDefaultMapFromNodeModules } from '@typescript/vfs';
import ts from 'typescript';

export interface TypeBundle {
  files: Record<string, string>;
  compilerOptions: ts.CompilerOptions;
}

export interface BundleOptions {
  packageRoot: string;
  packageName: string;
  nodeModules: string;
  extraPackages?: string[];
}

export const CHECK_COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
  isolatedModules: true,
  noEmit: true,
  types: [],
};

function toPosix(file: string): string {
  return file.replace(/\\/g, '/');
}

function walk(dir: string, filter: (file: string) => boolean, into: Record<string, string>, prefix: string): void {
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const relative = `${prefix}/${entry}`;
    if (statSync(absolute).isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(absolute, filter, into, relative);
      continue;
    }
    if (filter(entry)) into[relative] = readFileSync(absolute, 'utf8');
  }
}

function emitDeclarations(packageRoot: string, packageName: string, into: Record<string, string>): string[] {
  const configPath = ts.findConfigFile(packageRoot, ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) throw new Error(`tsconfig.json не найден в ${packageRoot}`);
  const raw = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(raw.config, ts.sys, path.dirname(configPath));
  const rootNames = parsed.fileNames.filter((file) => !/\.(test|spec|stories)\.tsx?$/.test(file));
  const rootDir = toPosix(path.resolve(packageRoot));
  const program = ts.createProgram({
    rootNames,
    options: {
      ...parsed.options,
      noEmit: false,
      declaration: true,
      emitDeclarationOnly: true,
      declarationMap: false,
      sourceMap: false,
      outDir: '/emit',
      rootDir,
      types: [],
      skipLibCheck: true,
      jsx: parsed.options.jsx ?? ts.JsxEmit.ReactJSX,
    },
  });
  const written: string[] = [];
  program.emit(undefined, (fileName, text) => {
    const relative = toPosix(fileName).replace(/^\/emit\//, '');
    const target = `/node_modules/${packageName}/${relative}`;
    into[target] = text;
    written.push(target);
  });
  return written;
}

type ExportTarget = string | Record<string, string> | null;

function readPackageExports(packageRoot: string): Record<string, ExportTarget> {
  try {
    const raw = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as { exports?: Record<string, ExportTarget> };
    return raw.exports ?? {};
  } catch {
    return {};
  }
}

function targetPath(target: ExportTarget): string | undefined {
  if (typeof target === 'string') return target;
  if (!target) return undefined;
  return target.types ?? target.import ?? target.default;
}

function declarationFor(target: ExportTarget): string | undefined {
  const file = targetPath(target);
  if (!file || !/\.(ts|tsx|js|mjs|d\.ts)$/.test(file)) return undefined;
  return file.replace(/^\.\/dist\//, './src/').replace(/\.(d\.ts|tsx?|mjs|js)$/, '.d.ts');
}

export function buildNodeTypeBundle(options: BundleOptions): TypeBundle {
  const files: Record<string, string> = {};
  for (const [name, content] of createDefaultMapFromNodeModules({ target: ts.ScriptTarget.ES2022 }, ts)) files[name] = content;

  const emitted = new Set(emitDeclarations(options.packageRoot, options.packageName, files));
  const exportsMap = readPackageExports(options.packageRoot);
  const typedExports: Record<string, { types: string }> = {};
  for (const [subpath, target] of Object.entries(exportsMap)) {
    const declaration = declarationFor(target);
    if (!declaration) continue;
    if (!emitted.has(`/node_modules/${options.packageName}/${declaration.replace(/^\.\//, '')}`)) continue;
    typedExports[subpath] = { types: declaration };
  }
  files[`/node_modules/${options.packageName}/package.json`] = JSON.stringify({ name: options.packageName, types: typedExports['.']?.types ?? './src/index.d.ts', exports: typedExports }, null, 2);

  for (const pkg of ['@types/react', 'csstype', ...(options.extraPackages ?? [])]) {
    const dir = path.join(options.nodeModules, pkg);
    walk(dir, (file) => file.endsWith('.d.ts') || file === 'package.json', files, `/node_modules/${pkg}`);
  }

  return { files, compilerOptions: CHECK_COMPILER_OPTIONS };
}

export function serializeBundle(bundle: TypeBundle): string {
  return JSON.stringify(bundle);
}

export function parseBundle(json: string): TypeBundle {
  const parsed = JSON.parse(json) as TypeBundle;
  return { files: parsed.files, compilerOptions: { ...CHECK_COMPILER_OPTIONS, ...parsed.compilerOptions } };
}
