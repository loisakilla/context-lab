import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export interface LibraryProgram {
  program: ts.Program;
  checker: ts.TypeChecker;
  packageRoot: string;
  libraryRoot: string;
  files: string[];
  mode: 'source' | 'package';
}

export interface ProgramOptions {
  packageRoot: string;
  libraryRoot?: string;
  tsconfig?: string;
  entry?: string;
}

const IGNORED = /(\.(test|spec|stories)\.tsx?|\.d\.ts)$/;
const SHIPPED_TYPES = /\.d\.ts$/;
const SHIPPED_CODE = /\.(m?js)$/;

const PACKAGE_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: true,
  checkJs: false,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
};

export function toPosix(file: string): string {
  return file.replace(/\\/g, '/');
}

function readConfig(configPath: string): ts.ParsedCommandLine {
  const raw = ts.readConfigFile(configPath, ts.sys.readFile);
  if (raw.error) {
    throw new Error(ts.flattenDiagnosticMessageText(raw.error.messageText, '\n'));
  }
  const parsed = ts.parseJsonConfigFileContent(raw.config, ts.sys, path.dirname(configPath));
  if (parsed.errors.length > 0) {
    throw new Error(`${configPath}: ${parsed.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('; ')}`);
  }
  return parsed;
}

function shippedFiles(dir: string, into: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const absolute = path.join(dir, entry);
    if (statSync(absolute).isDirectory()) {
      shippedFiles(absolute, into);
      continue;
    }
    if (SHIPPED_TYPES.test(entry) || SHIPPED_CODE.test(entry)) into.push(toPosix(absolute));
  }
  return into;
}

function sourceProgram(configPath: string, packageRoot: string, libraryRoot: string): LibraryProgram {
  const parsed = readConfig(configPath);
  const files = parsed.fileNames.map(toPosix).filter((file) => !IGNORED.test(file));
  const program = ts.createProgram({
    rootNames: files,
    options: {
      ...parsed.options,
      noEmit: true,
      skipLibCheck: true,
      types: [],
      jsx: parsed.options.jsx ?? ts.JsxEmit.ReactJSX,
    },
  });
  return { program, checker: program.getTypeChecker(), packageRoot, libraryRoot, files, mode: 'source' };
}

function packageProgram(packageRoot: string, libraryRoot: string): LibraryProgram {
  const shipped = shippedFiles(packageRoot, []);
  if (!shipped.some((file) => SHIPPED_TYPES.test(file))) {
    throw new Error(`В ${packageRoot} нет ни tsconfig.json, ни объявлений .d.ts: разбирать нечего`);
  }
  const program = ts.createProgram({ rootNames: shipped, options: PACKAGE_OPTIONS });
  const files = shipped.filter((file) => SHIPPED_TYPES.test(file));
  return { program, checker: program.getTypeChecker(), packageRoot, libraryRoot, files, mode: 'package' };
}

export function createLibraryProgram(options: ProgramOptions): LibraryProgram {
  const packageRoot = toPosix(path.resolve(options.packageRoot));
  const libraryRoot = toPosix(path.resolve(options.libraryRoot ?? options.packageRoot));
  if (options.entry && SHIPPED_TYPES.test(options.entry)) return packageProgram(packageRoot, libraryRoot);
  const ownConfig = path.join(packageRoot, 'tsconfig.json');
  const configPath = options.tsconfig ?? (existsSync(ownConfig) ? ownConfig : undefined);
  return configPath ? sourceProgram(configPath, packageRoot, libraryRoot) : packageProgram(packageRoot, libraryRoot);
}
