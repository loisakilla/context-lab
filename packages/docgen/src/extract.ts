import path from 'node:path';
import ts from 'typescript';
import type { ComponentDoc, ExampleDoc, HookDoc, PropDoc } from '@context-lab/index-tools';
import type { ComponentDescription } from './descriptions.ts';
import { toPosix, type LibraryProgram } from './program.ts';

export interface ExtractOptions {
  entry?: string;
  descriptions?: Map<string, ComponentDescription>;
  knownClasses?: Set<string>;
}

export interface Extracted {
  components: ComponentDoc[];
  hooks: HookDoc[];
}

const TYPE_FLAGS = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const CLASS_LITERAL = /^jx-[a-z0-9-]+(?:--[a-z0-9-]+)?$/;

function isInside(file: string, root: string): boolean {
  return file.startsWith(`${root}/`) && !file.slice(root.length).includes('/node_modules/');
}

function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function unwrapFunction(node: ts.Node | undefined): ts.SignatureDeclaration | undefined {
  if (!node) return undefined;
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return node;
  if (ts.isVariableDeclaration(node)) return unwrapFunction(node.initializer);
  if (ts.isCallExpression(node)) {
    for (const argument of node.arguments) {
      const inner = unwrapFunction(argument);
      if (inner) return inner;
    }
  }
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return unwrapFunction(node.expression);
  return undefined;
}

function implementationOf(declaration: ts.Node, name: string, lib: LibraryProgram): ts.SignatureDeclaration | undefined {
  if (lib.mode !== 'package') return undefined;
  const typesFile = toPosix(declaration.getSourceFile().fileName);
  if (!typesFile.endsWith('.d.ts')) return undefined;
  const base = typesFile.slice(0, -'.d.ts'.length);
  const code = [`${base}.js`, `${base}.mjs`].map((file) => lib.program.getSourceFile(file)).find((file) => file !== undefined);
  if (!code) return undefined;
  for (const statement of code.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) return statement;
    if (!ts.isVariableStatement(statement)) continue;
    for (const variable of statement.declarationList.declarations) {
      if (ts.isIdentifier(variable.name) && variable.name.text === name) return unwrapFunction(variable);
    }
  }
  return undefined;
}

function defaultsFromSignature(fn: ts.SignatureDeclaration | undefined): Map<string, string> {
  const defaults = new Map<string, string>();
  const first = fn?.parameters[0];
  if (!first || !ts.isObjectBindingPattern(first.name)) return defaults;
  for (const element of first.name.elements) {
    if (!element.initializer) continue;
    const key = element.propertyName ?? element.name;
    if (ts.isIdentifier(key) || ts.isStringLiteral(key)) defaults.set(key.text, element.initializer.getText());
  }
  return defaults;
}

function unwrapParens(text: string): string {
  if (!text.startsWith('(') || !text.endsWith(')')) return text;
  let depth = 0;
  for (let position = 0; position < text.length; position += 1) {
    if (text[position] === '(') depth += 1;
    if (text[position] === ')') depth -= 1;
    if (depth === 0 && position < text.length - 1) return text;
  }
  return text.slice(1, -1);
}

function stripUndefined(text: string): string {
  return unwrapParens(text.replace(/^undefined \| /, '').replace(/ \| undefined$/, ''));
}

function literalValues(type: ts.Type): string[] | undefined {
  const members = type.isUnion() ? type.types : [type];
  const meaningful = members.filter((member) => !(member.flags & ts.TypeFlags.Undefined));
  if (meaningful.length < 2) return undefined;
  const values: string[] = [];
  for (const member of meaningful) {
    if (member.isStringLiteral()) values.push(JSON.stringify(member.value));
    else if (member.isNumberLiteral()) values.push(String(member.value));
    else return undefined;
  }
  return values;
}

function docText(symbol: ts.Symbol, checker: ts.TypeChecker): string | undefined {
  const text = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
  return text.length > 0 ? text : undefined;
}

function tagText(symbol: ts.Symbol, name: string): string | undefined {
  const tag = symbol.getJsDocTags().find((candidate) => candidate.name === name);
  if (!tag) return undefined;
  const text = ts.displayPartsToString(tag.text).trim();
  return text;
}

function exampleTags(symbol: ts.Symbol): ExampleDoc[] {
  const examples: ExampleDoc[] = [];
  for (const tag of symbol.getJsDocTags()) {
    if (tag.name !== 'example') continue;
    const text = ts.displayPartsToString(tag.text).trim();
    const fenced = /```\w*\r?\n([\s\S]*?)```/.exec(text);
    const code = (fenced?.[1] ?? text).trimEnd();
    if (code.length === 0) continue;
    const title = fenced ? text.slice(0, fenced.index).trim() : '';
    examples.push(title ? { title, code } : { code });
  }
  return examples;
}

const MAX_TEMPLATE_EXPANSIONS = 64;

function classTokens(text: string): string[] {
  return text.split(/\s+/).filter((token) => CLASS_LITERAL.test(token));
}

function stringLiteralValues(type: ts.Type): string[] | undefined {
  const parts = type.isUnion() ? type.types : [type];
  const values = parts.map((part) => (part.isStringLiteral() ? part.value : undefined));
  return values.every((value): value is string => value !== undefined) ? values : undefined;
}

function templateExpansions(template: ts.TemplateExpression, valuesOf: (expression: ts.Expression) => string[] | undefined): string[] | undefined {
  let results = [template.head.text];
  for (const span of template.templateSpans) {
    const values = valuesOf(span.expression);
    if (!values || values.length === 0) return undefined;
    results = results.flatMap((prefix) => values.map((value) => `${prefix}${value}${span.literal.text}`));
    if (results.length > MAX_TEMPLATE_EXPANSIONS) return undefined;
  }
  return results;
}

function staticTemplateTokens(template: ts.TemplateExpression): string[] {
  const hole = '\u0000';
  return classTokens([template.head.text, ...template.templateSpans.map((span) => span.literal.text)].join(hole)).filter((token) => !token.includes(hole));
}

function collectClassLiterals(node: ts.Node, checker: ts.TypeChecker, propValues: Map<string, string[]>, knownClasses?: Set<string>): string[] {
  const found = new Set<string>();
  const visited = new Set<ts.Node>();
  const source = node.getSourceFile();

  const valuesOf = (expression: ts.Expression): string[] | undefined => {
    const fromType = stringLiteralValues(checker.getTypeAtLocation(expression));
    if (fromType) return fromType;
    if (!ts.isIdentifier(expression)) return undefined;
    const declaration = checker.getSymbolAtLocation(expression)?.valueDeclaration;
    if (!declaration || !ts.isBindingElement(declaration)) return undefined;
    const prop = (declaration.propertyName ?? declaration.name).getText();
    return propValues.get(prop);
  };

  const visit = (current: ts.Node): void => {
    if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
      for (const token of classTokens(current.text)) found.add(token);
    }
    if (ts.isTemplateExpression(current)) {
      for (const token of staticTemplateTokens(current)) found.add(token);
      const expansions = knownClasses ? templateExpansions(current, valuesOf) : undefined;
      for (const token of (expansions ?? []).flatMap(classTokens)) {
        if (knownClasses?.has(token)) found.add(token);
      }
    }
    if (ts.isIdentifier(current)) {
      const declaration = checker.getSymbolAtLocation(current)?.valueDeclaration;
      if (declaration && declaration.getSourceFile() === source && !visited.has(declaration)) {
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          visited.add(declaration);
          visit(declaration.initializer);
        } else if (ts.isFunctionDeclaration(declaration) && declaration.body) {
          visited.add(declaration);
          visit(declaration.body);
        }
      }
    }
    ts.forEachChild(current, visit);
  };

  visit(node);
  return [...found].sort();
}

const TRANSPARENT_WRAPPERS = new Set(['PropsWithoutRef', 'PropsWithRef', 'PropsWithChildren']);
const REF_PLUMBING = new Set(['RefAttributes']);

function declarationFile(symbol: ts.Symbol | undefined): string | undefined {
  const file = symbol?.declarations?.[0]?.getSourceFile().fileName;
  return file ? toPosix(file) : undefined;
}

function externalConstituents(propsType: ts.Type, checker: ts.TypeChecker, libraryRoot: string): string[] {
  const names = new Set<string>();
  const seen = new Set<ts.Type>();

  const isExternal = (symbol: ts.Symbol | undefined): boolean => {
    const file = declarationFile(symbol);
    return file !== undefined && !isInside(file, libraryRoot);
  };

  const walkType = (type: ts.Type): void => {
    if (seen.has(type)) return;
    seen.add(type);

    if (type.isIntersection()) {
      for (const part of type.types) walkType(part);
      return;
    }

    const alias = type.aliasSymbol;
    if (alias && TRANSPARENT_WRAPPERS.has(alias.name) && type.aliasTypeArguments?.[0]) {
      walkType(type.aliasTypeArguments[0]);
      return;
    }

    const symbol = alias ?? type.getSymbol();
    if (!symbol) return;

    if (isExternal(symbol)) {
      if (!REF_PLUMBING.has(symbol.name)) names.add(checker.typeToString(type, undefined, TYPE_FLAGS));
      return;
    }

    for (const declaration of symbol.declarations ?? []) {
      if (ts.isInterfaceDeclaration(declaration)) {
        for (const clause of declaration.heritageClauses ?? []) {
          for (const expression of clause.types) walkNode(expression);
        }
      }
      if (ts.isTypeAliasDeclaration(declaration)) walkNode(declaration.type);
    }
  };

  const walkNode = (node: ts.TypeNode | ts.ExpressionWithTypeArguments): void => {
    if (ts.isIntersectionTypeNode(node)) {
      for (const member of node.types) walkNode(member);
      return;
    }
    if (ts.isParenthesizedTypeNode(node)) {
      walkNode(node.type);
      return;
    }
    if (ts.isTypeLiteralNode(node)) return;

    const type = checker.getTypeAtLocation(node);
    const symbol = type.getSymbol() ?? type.aliasSymbol;
    if (symbol && isExternal(symbol)) {
      if (!REF_PLUMBING.has(symbol.name)) names.add(node.getText().replace(/\s+/g, ' '));
      return;
    }
    walkType(type);
  };

  walkType(propsType);
  return [...names];
}

function ownDeclaration(property: ts.Symbol, libraryRoot: string): ts.PropertySignature | ts.PropertyDeclaration | undefined {
  for (const declaration of property.declarations ?? []) {
    if (!isInside(toPosix(declaration.getSourceFile().fileName), libraryRoot)) continue;
    if (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)) return declaration;
  }
  return undefined;
}

function extractProps(propsType: ts.Type, location: ts.Node, defaults: Map<string, string>, lib: LibraryProgram, described: Record<string, string>): PropDoc[] {
  const props: PropDoc[] = [];
  for (const property of propsType.getApparentProperties()) {
    const declarations = property.declarations ?? [];
    const own = declarations.length === 0 || declarations.some((declaration) => isInside(toPosix(declaration.getSourceFile().fileName), lib.libraryRoot));
    if (!own) continue;

    const declared = ownDeclaration(property, lib.libraryRoot);
    const type = declared?.type ? lib.checker.getTypeAtLocation(declared.type) : lib.checker.getTypeOfSymbolAtLocation(property, location);
    const narrowing = declarations
      .filter((declaration) => !isInside(toPosix(declaration.getSourceFile().fileName), lib.libraryRoot))
      .flatMap((declaration) => (ts.isPropertySignature(declaration) && declaration.type ? [declaration.type] : []))
      .filter((inheritedType) => declared?.type && !lib.checker.isTypeAssignableTo(type, lib.checker.getTypeAtLocation(inheritedType)));
    const inherited = narrowing.map((inheritedType) => stripUndefined(inheritedType.getText().replace(/\s+/g, ' ')));
    const prop: PropDoc = {
      name: property.name,
      type: declared?.type
        ? [declared.type.getText().replace(/\s+/g, ' '), ...inherited].join(' & ')
        : stripUndefined(lib.checker.typeToString(type, undefined, TYPE_FLAGS)),
      required: declared ? declared.questionToken === undefined : !(property.flags & ts.SymbolFlags.Optional),
    };
    const values = literalValues(type);
    if (values) prop.unionValues = values;
    const fallback = defaults.get(property.name);
    if (fallback) prop.defaultValue = fallback;
    const description = described[property.name] ?? docText(property, lib.checker);
    if (description) prop.description = description;
    const deprecated = tagText(property, 'deprecated');
    if (deprecated !== undefined) prop.deprecated = deprecated || 'не использовать';
    props.push(prop);
  }
  return props;
}

function location(node: ts.Node, lib: LibraryProgram): { file: string; line: number } {
  const source = node.getSourceFile();
  const relative = toPosix(path.relative(lib.libraryRoot, source.fileName));
  return { file: relative, line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1 };
}

function entrySource(lib: LibraryProgram, entry: string): ts.SourceFile {
  const source = lib.program.getSourceFile(toPosix(path.resolve(lib.packageRoot, entry)));
  if (!source) throw new Error(`Точки входа ${entry} нет в ${lib.packageRoot}: проверьте library.entry в конфиге`);
  return source;
}

function candidateSymbols(lib: LibraryProgram, entry?: string): Array<{ exported: ts.Symbol; resolved: ts.Symbol }> {
  const sources = entry ? [entrySource(lib, entry)] : lib.program.getSourceFiles().filter((source) => lib.files.includes(toPosix(source.fileName)));

  const seen = new Set<ts.Symbol>();
  const result: Array<{ exported: ts.Symbol; resolved: ts.Symbol }> = [];
  for (const source of sources) {
    const moduleSymbol = lib.checker.getSymbolAtLocation(source);
    if (!moduleSymbol) continue;
    for (const exported of lib.checker.getExportsOfModule(moduleSymbol)) {
      const resolved = resolveAlias(lib.checker, exported);
      if (!(resolved.flags & ts.SymbolFlags.Value) || seen.has(resolved)) continue;
      seen.add(resolved);
      result.push({ exported, resolved });
    }
  }
  return result;
}

export function extract(lib: LibraryProgram, options: ExtractOptions = {}): Extracted {
  const components: ComponentDoc[] = [];
  const hooks: HookDoc[] = [];

  for (const { exported, resolved } of candidateSymbols(lib, options.entry)) {
    const declaration = resolved.valueDeclaration ?? resolved.declarations?.[0];
    if (!declaration) continue;
    const type = lib.checker.getTypeOfSymbolAtLocation(resolved, declaration);
    const signatures = type.getCallSignatures();
    if (signatures.length === 0) continue;
    const signature = signatures[0];
    if (!signature) continue;
    const name = exported.name;

    if (/^use[A-Z]/.test(name)) {
      const hook: HookDoc = {
        name,
        ...location(declaration, lib),
        signature: lib.checker.signatureToString(signature, declaration, TYPE_FLAGS),
      };
      const description = docText(resolved, lib.checker);
      if (description) hook.description = description;
      hooks.push(hook);
      continue;
    }

    if (!/^[A-Z]/.test(name)) continue;

    const described = options.descriptions?.get(name);
    const fn = implementationOf(declaration, resolved.name, lib) ?? unwrapFunction(declaration);
    const defaults = defaultsFromSignature(fn);
    const propsSymbol = signature.getParameters()[0];
    const propsType = propsSymbol ? lib.checker.getTypeOfSymbolAtLocation(propsSymbol, propsSymbol.valueDeclaration ?? declaration) : undefined;
    const props = propsType ? extractProps(propsType, declaration, defaults, lib, described?.props ?? {}) : [];
    const propValues = new Map<string, string[]>();
    for (const prop of props) {
      const values = (prop.unionValues ?? []).filter((value) => /^"[^"]*"$/.test(value)).map((value) => value.slice(1, -1));
      if (values.length > 0) propValues.set(prop.name, values);
    }

    const component: ComponentDoc = {
      name,
      ...location(declaration, lib),
      keywords: described?.keywords ?? (tagText(resolved, 'keywords') ?? '').split(',').map((keyword) => keyword.trim()).filter(Boolean),
      status: 'stable',
      props,
      inheritsFrom: propsType ? externalConstituents(propsType, lib.checker, lib.libraryRoot) : [],
      cssClasses: collectClassLiterals(fn ?? declaration, lib.checker, propValues, options.knownClasses),
      examples: described?.examples.length ? described.examples : exampleTags(resolved),
    };

    const description = described?.description ?? docText(resolved, lib.checker);
    if (description) component.description = description;
    const deprecated = described?.deprecated ?? tagText(resolved, 'deprecated');
    if (described?.status === 'deprecated' || deprecated !== undefined) {
      component.status = 'deprecated';
      component.deprecated = deprecated || 'не использовать в новом коде';
    }
    components.push(component);
  }

  components.sort((a, b) => a.name.localeCompare(b.name));
  hooks.sort((a, b) => a.name.localeCompare(b.name));
  return { components, hooks };
}
