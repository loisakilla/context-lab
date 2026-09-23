import type { LibraryIndex } from '@context-lab/index-tools';

export interface ExampleChecker {
  typecheck(code: string): { errors: Array<{ code: number; line: number; message: string }> };
}

export interface ExampleIssue {
  component: string;
  title: string;
  errors: string[];
}

const REACT_HOOKS = ['useState', 'useEffect', 'useMemo', 'useRef', 'useCallback', 'useId', 'useReducer'];
const REACT_TYPES = ['FormEvent', 'ChangeEvent', 'MouseEvent', 'KeyboardEvent', 'ReactNode'];

function used(body: string, names: readonly string[]): string[] {
  return names.filter((name) => new RegExp(`\\b${name}\\b`).test(body));
}

export function exampleModule(code: string, packageName: string, libraryHooks: readonly string[] = []): string {
  const body = code.trim();
  const libraryNames = [...new Set([...(body.match(/\bJx[A-Z]\w*/g) ?? []), ...used(body, libraryHooks)])].sort();
  const hooks = used(body, REACT_HOOKS);
  const types = used(body, REACT_TYPES);
  const imports = [
    hooks.length > 0 ? `import { ${hooks.join(', ')} } from 'react';` : '',
    types.length > 0 ? `import type { ${types.join(', ')} } from 'react';` : '',
    libraryNames.length > 0 ? `import { ${libraryNames.join(', ')} } from '${packageName}';` : '',
  ].filter((line) => line.length > 0);
  const components = [...body.matchAll(/^function\s+([A-Z]\w*)/gm)].map((match) => match[1]);
  const main = components.at(-1);
  const module = main ? `${body}\n\nexport default ${main};` : `export default function Example() {\n  return (\n${body}\n  );\n}`;
  return `${[...imports, module].join('\n')}\n`;
}

export function checkExamples(index: LibraryIndex, checker: ExampleChecker): ExampleIssue[] {
  const issues: ExampleIssue[] = [];
  for (const component of index.components) {
    component.examples.forEach((example, position) => {
      const { errors } = checker.typecheck(exampleModule(example.code, index.library.package, index.hooks.map((hook) => hook.name)));
      if (errors.length === 0) return;
      issues.push({
        component: component.name,
        title: example.title ?? `пример ${position + 1}`,
        errors: errors.map((error) => `TS${error.code}: ${error.message.split('\n')[0]}`),
      });
    });
  }
  return issues;
}
