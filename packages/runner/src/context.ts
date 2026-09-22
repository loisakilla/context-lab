import { createTools, estimateTokens, libraryRulesPrompt, runTool, toJsonSchemaTools, type LibraryIndex } from '@context-lab/index-tools';
import type { BuiltContext, ContextMode, ContextSource, Task } from './types.ts';

export interface ContextSources {
  index: LibraryIndex;
  readme?: string;
  docs?: string;
  rules?: string;
}

export const OUTPUT_CONTRACT = [
  'Формат ответа: ровно один блок кода ```tsx с одним компонентом на TypeScript и default-экспортом.',
  "Импорты только из 'react' и '@jinx-ui/react'. Никаких пояснений вне блока кода.",
  'Стили только через классы библиотеки и CSS-токены var(--jx-*); без хардкода цветов и без innerHTML.',
].join('\n');

export const NO_TOOLS_NOTE = 'Инструментов у тебя нет: не читай файлы, не ищи по коду и не обращайся к памяти. Весь доступный контекст уже в этом сообщении, отвечай сразу блоком кода.';

export const BASE_SYSTEM_PROMPT = [
  'Ты frontend-разработчик. Пишешь React-компоненты на TypeScript с библиотекой компонентов Jinx UI (пакет @jinx-ui/react).',
  OUTPUT_CONTRACT,
].join('\n\n');

function wrap(tag: string, body: string): string {
  return `<${tag}>\n${body.trim()}\n</${tag}>`;
}

function source(kind: ContextSource['kind'], id: string, version: string, text: string): ContextSource {
  return { kind, id, version, tokens: estimateTokens(text) };
}

export function buildContext(mode: ContextMode, task: Task, sources: ContextSources): BuiltContext {
  const version = sources.index.library.version;
  const parts: string[] = [];
  const contextSources: ContextSource[] = [];
  let system = `${BASE_SYSTEM_PROMPT}

${NO_TOOLS_NOTE}`;
  let tools: BuiltContext['tools'];
  let runner: BuiltContext['runTool'];

  if (mode === 'readme') {
    if (!sources.readme) throw new Error('Для режима readme нужен текст README библиотеки');
    parts.push(wrap('library_readme', sources.readme));
    contextSources.push(source('readme', 'README.md', version, sources.readme));
  }

  if (mode === 'docs' || mode === 'docs+rules') {
    if (!sources.docs) throw new Error(`Для режима ${mode} нужна сгенерированная документация llms-full.txt`);
    parts.push(wrap('library_docs', sources.docs));
    contextSources.push(source('docs', 'llms-full.txt', version, sources.docs));
  }

  if (mode === 'docs+rules') {
    if (!sources.rules) throw new Error('Для режима docs+rules нужен скомпилированный набор правил');
    parts.push(wrap('rules', sources.rules));
    contextSources.push(source('rules', 'jinx-ui', version, sources.rules));
  }

  if (mode === 'mcp') {
    const specs = createTools(sources.index);
    tools = toJsonSchemaTools(specs);
    runner = (name, args) => runTool(specs, name, args);
    const rules = libraryRulesPrompt(sources.index);
    system = `${BASE_SYSTEM_PROMPT}\n\n${rules}`;
    contextSources.push(source('tools', specs.map((spec) => spec.name).join(','), version, JSON.stringify(tools)));
  }

  const taskLines = [`Задача: ${task.prompt}`];
  if (mode === 'mcp') taskLines.push('Сначала найди подходящие компоненты через search_components и запроси их API через get_component_api, и только потом пиши код.');
  taskLines.push('', OUTPUT_CONTRACT);

  const result: BuiltContext = {
    mode,
    system,
    contextText: parts.join('\n\n'),
    taskText: taskLines.join('\n'),
    sources: contextSources,
  };
  if (tools) result.tools = tools;
  if (runner) result.runTool = runner;
  return result;
}

export function contextTokens(context: BuiltContext): number {
  return context.sources.reduce((sum, item) => sum + item.tokens, 0) + estimateTokens(context.system);
}
