import { createSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import ts from 'typescript';
import type { TypeBundle } from './bundle.ts';

export interface TscError {
  code: number;
  line: number;
  message: string;
}

export interface UnknownProp {
  component: string;
  prop: string;
}

export interface TscReport {
  errors: TscError[];
  unknownComponents: string[];
  unknownProps: UnknownProp[];
}

export interface Checker {
  typecheck(code: string): TscReport;
}

const GENERATED = '/generated.tsx';
const COMPONENT_NAME = /\bJx[A-Z]\w*/;

function componentFromType(typeText: string): string | undefined {
  const match = COMPONENT_NAME.exec(typeText);
  if (!match) return undefined;
  return match[0].replace(/Props$/, '');
}

function enclosingJsxTag(source: ts.SourceFile, position: number): string | undefined {
  let found: ts.Node | undefined;
  const visit = (node: ts.Node): void => {
    if (position < node.getStart(source) || position >= node.getEnd()) return;
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) found = node;
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!found) return undefined;
  const element = found as ts.JsxOpeningElement | ts.JsxSelfClosingElement;
  return element.tagName.getText(source);
}

export function classifyDiagnostics(diagnostics: readonly ts.Diagnostic[], source?: ts.SourceFile): TscReport {
  const errors: TscError[] = [];
  const unknownComponents = new Set<string>();
  const unknownProps = new Map<string, UnknownProp>();

  for (const diagnostic of diagnostics) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const line = diagnostic.file && diagnostic.start !== undefined ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1 : 0;
    errors.push({ code: diagnostic.code, line, message });

    const missingExport = /has no exported member (?:named )?'([^']+)'/.exec(message);
    if (missingExport?.[1]) unknownComponents.add(missingExport[1]);

    const missingName = /^Cannot find name '(Jx[A-Z]\w*)'/.exec(message);
    if (missingName?.[1]) unknownComponents.add(missingName[1]);

    const tag = source && diagnostic.start !== undefined ? enclosingJsxTag(source, diagnostic.start) : undefined;
    const record = (prop: string | undefined, typeText: string | undefined): void => {
      const component = (tag && COMPONENT_NAME.test(tag) ? tag : undefined) ?? componentFromType(typeText ?? '');
      if (component && prop) unknownProps.set(`${component}.${prop}`, { component, prop });
    };
    for (const match of message.matchAll(/Property '([^']+)' does not exist on type '([^']+)'/g)) record(match[1], match[2]);
    for (const match of message.matchAll(/and '([^']+)' does not exist in type '([^']+)'/g)) record(match[1], match[2]);
  }

  return { errors, unknownComponents: [...unknownComponents].sort(), unknownProps: [...unknownProps.values()] };
}

export function createChecker(bundle: TypeBundle): Checker {
  const fsMap = new Map(Object.entries(bundle.files));
  fsMap.set(GENERATED, 'export {};\n');
  const system = createSystem(fsMap);
  const env = createVirtualTypeScriptEnvironment(system, [GENERATED], ts, bundle.compilerOptions);

  return {
    typecheck(code: string): TscReport {
      env.updateFile(GENERATED, code.length > 0 ? code : 'export {};\n');
      const diagnostics = [...env.languageService.getSyntacticDiagnostics(GENERATED), ...env.languageService.getSemanticDiagnostics(GENERATED)];
      return classifyDiagnostics(diagnostics, env.languageService.getProgram()?.getSourceFile(GENERATED));
    },
  };
}
