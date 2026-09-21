import { z } from 'zod';
import { fitToBudget, renderComponent, renderComponentSections, renderExamples, renderSearchHit, renderTokens, withFooter } from './format.ts';
import { findComponent, searchComponents, suggestNames } from './search.ts';
import type { LibraryIndex } from './types.ts';

export const DEFAULT_SEARCH_BUDGET = 700;
export const DEFAULT_API_BUDGET = 1200;

export interface ToolResult {
  text: string;
  isError?: boolean;
}

export interface ToolSpec<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  shape: Shape;
  run(args: z.infer<z.ZodObject<Shape>>): ToolResult;
}

export interface JsonSchemaTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

function ok(text: string): ToolResult {
  return { text: withFooter(text) };
}

function notFound(index: LibraryIndex, name: string): ToolResult {
  const suggestions = suggestNames(index, name);
  const hint = suggestions.length > 0 ? `Похожие компоненты: ${suggestions.join(', ')}.` : 'Подходящих компонентов не нашлось.';
  return {
    text: `Компонента "${name}" в библиотеке ${index.library.name} нет. ${hint} Не выдумывайте пропсы — сначала найдите компонент через search_components.`,
    isError: true,
  };
}

export function createTools(index: LibraryIndex): ToolSpec[] {
  const search: ToolSpec<{ query: z.ZodString; limit: z.ZodOptional<z.ZodNumber>; maxTokens: z.ZodOptional<z.ZodNumber> }> = {
    name: 'search_components',
    title: 'Поиск компонентов',
    description:
      'Находит компоненты библиотеки по задаче или названию: понимает русские и английские запросы, ищет по имени, ключевым словам, описанию и пропсам. ' +
      'Возвращает компактные карточки с сигнатурой, чтобы выбрать компонент, не загружая всю библиотеку в контекст.',
    shape: {
      query: z.string().min(1).describe("Что нужно сделать или как называется компонент: 'модальное окно', 'таблица с сортировкой', 'Button'"),
      limit: z.number().int().min(1).max(20).optional().describe('Сколько компонентов вернуть, по умолчанию 5'),
      maxTokens: z.number().int().min(100).max(20000).optional().describe('Бюджет ответа в токенах, по умолчанию 700'),
    },
    run({ query, limit, maxTokens }) {
      const hits = searchComponents(index, query, limit ?? 5);
      if (hits.length === 0) {
        return {
          text: `По запросу "${query}" в библиотеке ${index.library.name} ничего не нашлось. Доступно компонентов: ${index.components.length}. Попробуйте другое слово или название на английском.`,
        };
      }
      const budget = fitToBudget(hits.map(renderSearchHit), maxTokens ?? DEFAULT_SEARCH_BUDGET);
      const header = `Найдено ${hits.length} из ${index.components.length} компонентов ${index.library.name}:`;
      return ok(`${header}\n\n${budget.text}`);
    },
  };

  const api: ToolSpec<{ name: z.ZodString; detail: z.ZodOptional<z.ZodEnum<{ signature: 'signature'; full: 'full' }>>; maxTokens: z.ZodOptional<z.ZodNumber> }> = {
    name: 'get_component_api',
    title: 'API компонента',
    description:
      'Отдаёт реальный API компонента: пропсы с типами, обязательностью, значениями по умолчанию и описаниями, допустимые значения union-типов, что компонент наследует и пометки deprecated. ' +
      'detail=signature даёт одну строку сигнатуры для экономии контекста, detail=full — полное описание.',
    shape: {
      name: z.string().min(1).describe('Имя компонента, например JxButton'),
      detail: z.enum(['signature', 'full']).optional().describe('По умолчанию full'),
      maxTokens: z.number().int().min(100).max(20000).optional().describe('Бюджет ответа в токенах, по умолчанию 1200'),
    },
    run({ name, detail, maxTokens }) {
      const component = findComponent(index, name);
      if (!component) return notFound(index, name);
      if ((detail ?? 'full') === 'signature') return ok(renderComponent(component, 'signature'));
      const budget = fitToBudget(renderComponentSections(component), maxTokens ?? DEFAULT_API_BUDGET);
      return ok(budget.text);
    },
  };

  const examples: ToolSpec<{ name: z.ZodString }> = {
    name: 'get_component_examples',
    title: 'Примеры использования',
    description: 'Возвращает примеры использования компонента из документации библиотеки. Примеры проверяются компилятором и соответствуют текущему коду.',
    shape: {
      name: z.string().min(1).describe('Имя компонента, например JxModal'),
    },
    run({ name }) {
      const component = findComponent(index, name);
      if (!component) return notFound(index, name);
      return ok(renderExamples(component));
    },
  };

  const tokens: ToolSpec<{ group: z.ZodOptional<z.ZodString> }> = {
    name: 'list_design_tokens',
    title: 'Токены дизайн-системы',
    description: 'Перечисляет CSS-токены дизайн-системы с их значениями по темам и режимам. Используйте var(--токен) вместо хардкода цветов, радиусов и шрифтов.',
    shape: {
      group: z.string().optional().describe('Фильтр по группе токенов: color, radius, font, shadow, motion'),
    },
    run({ group }) {
      const filtered = group ? index.tokens.filter((token) => token.group.toLowerCase().startsWith(group.toLowerCase())) : index.tokens;
      if (filtered.length === 0) {
        const groups = [...new Set(index.tokens.map((token) => token.group))];
        return { text: `Группы "${group}" нет. Доступные группы: ${groups.join(', ') || 'нет'}.` };
      }
      return ok(renderTokens(filtered));
    },
  };

  return [search, api, examples, tokens] as ToolSpec[];
}

export function toJsonSchemaTools(tools: ToolSpec[]): JsonSchemaTool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: z.toJSONSchema(z.object(tool.shape)) as Record<string, unknown>,
  }));
}

export function runTool(tools: ToolSpec[], name: string, args: unknown): ToolResult {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) return { text: `Инструмента "${name}" нет. Доступны: ${tools.map((candidate) => candidate.name).join(', ')}.`, isError: true };
  const parsed = z.object(tool.shape).safeParse(args ?? {});
  if (!parsed.success) return { text: `Неверные аргументы для ${name}: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`, isError: true };
  return tool.run(parsed.data);
}

export function libraryRulesPrompt(index: LibraryIndex, task?: string): string {
  return [
    `Библиотека: ${index.library.name} (${index.library.package}@${index.library.version}). Компонентов: ${index.components.length}, токенов: ${index.tokens.length}.`,
    '',
    'Правила:',
    '1. Прежде чем писать разметку, найдите компонент через search_components и возьмите его API через get_component_api. Не полагайтесь на память.',
    '2. Используйте только те пропсы, которые вернул сервер. Если нужного пропса нет — не выдумывайте его, а соберите решение из существующего API или скажите, что компонент нужно расширить.',
    '3. Цвета, радиусы и шрифты берите из list_design_tokens через var(--токен), а не хардкодом.',
    '4. Компоненты с пометкой DEPRECATED в новом коде не используйте.',
    '5. Запрашивайте detail=signature, когда нужен только список пропсов, и detail=full, когда нужны описания и примеры. Не тяните всю библиотеку в контекст.',
    ...(task ? ['', `Задача: ${task}`] : []),
  ].join('\n');
}

export function libraryOverview(index: LibraryIndex): string {
  return index.components.map((component) => renderComponent(component, 'signature')).join('\n');
}
