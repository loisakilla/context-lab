import path from 'node:path';
import ts from 'typescript';

export interface LibraryProgram {
  program: ts.Program;
  checker: ts.TypeChecker;
  packageRoot: string;
  libraryRoot: string;
  files: string[];
}

export interface ProgramOptions {
  packageRoot: string;
  libraryRoot?: string;
  tsconfig?: string;
}

const IGNORED = /(\.(test|spec|stories)\.tsx?|\.d\.ts)$/;

export function toPosix(file: string): string {
  return file.replace(/\\/g, '/');
}

function readConfig(packageRoot: string, explicit?: string): ts.ParsedCommandLine {
  const configPath = explicit ?? ts.findConfigFile(packageRoot, ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) {
    throw new Error(`tsconfig.json не найден в ${packageRoot}`);
  }
  const raw = ts.readConfigFile(configPath, ts.sys.readFile);
  if (raw.error) {
    throw new Error(ts.flattenDiagnosticMessageText(raw.error.messageText, '\n'));
  }
  return ts.parseJsonConfigFileContent(raw.config, ts.sys, path.dirname(configPath));
}

export function createLibraryProgram(options: ProgramOptions): LibraryProgram {
  const packageRoot = toPosix(path.resolve(options.packageRoot));
  const libraryRoot = toPosix(path.resolve(options.libraryRoot ?? options.packageRoot));
  const parsed = readConfig(packageRoot, options.tsconfig);
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

  return { program, checker: program.getTypeChecker(), packageRoot, libraryRoot, files };
}
