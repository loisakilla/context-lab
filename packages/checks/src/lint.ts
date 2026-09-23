import ts from 'typescript';

export type LintSeverity = 'error' | 'warning';

export interface LintFinding {
  rule: string;
  severity: LintSeverity;
  line: number;
  message: string;
}

export interface LintOptions {
  allowedImports?: string[];
  classPrefix?: string;
}

const DEFAULT_ALLOWED_IMPORTS = ['react', 'react-dom', '@jinx-ui/react', '@jinx-ui/react/runtime'];
const RAW_COLOR = /(^|[^\w-])(#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|oklab\()/i;

export function parseTsx(code: string): ts.SourceFile {
  return ts.createSourceFile('/generated.tsx', code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
}

function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function stringValue(node: ts.Node): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(' ');
  return undefined;
}

function isImportAllowed(specifier: string, allowed: string[]): boolean {
  return allowed.some((entry) => specifier === entry || specifier.startsWith(`${entry}/`));
}

export function lintCode(code: string, options: LintOptions = {}): LintFinding[] {
  const source = parseTsx(code);
  const findings: LintFinding[] = [];
  const allowed = options.allowedImports ?? DEFAULT_ALLOWED_IMPORTS;
  const prefix = options.classPrefix ?? 'jx-';

  const report = (rule: string, severity: LintSeverity, node: ts.Node, message: string): void => {
    findings.push({ rule, severity, line: lineOf(source, node), message });
  };

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!isImportAllowed(specifier, allowed)) {
        report('import-allowlist', 'error', node, `Импорт "${specifier}" вне списка разрешённых: ${allowed.join(', ')}`);
      }
    }

    const text = stringValue(node);
    if (text !== undefined && RAW_COLOR.test(text)) {
      report('no-raw-colors', 'error', node, `Цвет задан напрямую (${text.trim().slice(0, 40)}), вместо него нужен токен var(--jx-*)`);
    }

    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
      const name = node.name.text;
      if (name === 'dangerouslySetInnerHTML') report('no-inner-html', 'error', node, 'dangerouslySetInnerHTML запрещён');
      if (name === 'style') report('inline-style', 'warning', node, 'Инлайновые стили вместо классов и токенов библиотеки');
      if (name === 'className' && node.initializer) {
        const classes = ts.isStringLiteral(node.initializer) ? node.initializer.text : undefined;
        if (classes) {
          const foreign = classes.split(/\s+/).filter((token) => token.length > 0 && !token.startsWith(prefix));
          if (foreign.length > 0) report('custom-class', 'warning', node, `Классы вне библиотеки: ${foreign.join(' ')}`);
        }
      }
    }

    if (ts.isPropertyAccessExpression(node) && node.name.text === 'innerHTML') {
      report('no-inner-html', 'error', node, 'Прямая запись innerHTML запрещена');
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return findings.sort((a, b) => a.line - b.line);
}

export function usedComponents(code: string, componentPrefix = 'Jx'): string[] {
  const source = parseTsx(code);
  const used = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (tag.startsWith(componentPrefix)) used.add(tag);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return [...used].sort();
}
