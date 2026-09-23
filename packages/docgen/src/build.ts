import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { LibraryIndex, LibraryMeta } from '@context-lab/index-tools';
import { loadDescriptions } from './descriptions.ts';
import { extract } from './extract.ts';
import { createLibraryProgram } from './program.ts';
import { parseTokensCss } from './tokens.ts';

export interface BuildOptions {
  packageRoot: string;
  libraryRoot?: string;
  entry?: string;
  docsDir?: string;
  tokensCss?: string[];
  library: Partial<LibraryMeta> & { name: string };
}

function readPackageMeta(packageRoot: string): { name: string; version: string } {
  try {
    const raw = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as { name?: string; version?: string };
    return { name: raw.name ?? '', version: raw.version ?? '0.0.0' };
  } catch {
    return { name: '', version: '0.0.0' };
  }
}

export function buildIndex(options: BuildOptions): LibraryIndex {
  const lib = createLibraryProgram({
    packageRoot: options.packageRoot,
    ...(options.libraryRoot ? { libraryRoot: options.libraryRoot } : {}),
    ...(options.entry ? { entry: options.entry } : {}),
  });
  const descriptions = options.docsDir ? loadDescriptions(options.docsDir) : undefined;
  const extracted = extract(lib, { ...(options.entry ? { entry: options.entry } : {}), ...(descriptions ? { descriptions } : {}) });
  if (extracted.components.length === 0) {
    throw new Error(`В ${options.packageRoot} не нашлось ни одного компонента: проверьте library.packageRoot и library.entry в конфиге`);
  }
  const tokens = (options.tokensCss ?? []).flatMap((file) => parseTokensCss(readFileSync(file, 'utf8')));
  const meta = readPackageMeta(options.packageRoot);

  return {
    schemaVersion: 2,
    library: {
      name: options.library.name,
      package: options.library.package ?? meta.name,
      version: options.library.version ?? meta.version,
      commit: options.library.commit ?? '',
    },
    components: extracted.components,
    hooks: extracted.hooks,
    tokens,
  };
}

export function serializeIndex(index: LibraryIndex): string {
  return `${JSON.stringify(index, null, 2)}\n`;
}

export function loadIndex(file: string): LibraryIndex {
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<LibraryIndex>;
  if (parsed.schemaVersion !== 2 || !Array.isArray(parsed.components) || !parsed.library) {
    throw new Error(`Файл ${file} не похож на индекс компонентов (schemaVersion 2)`);
  }
  return parsed as LibraryIndex;
}
