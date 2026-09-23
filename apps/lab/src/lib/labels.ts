export const MODE_LABELS: Record<string, string> = {
  none: 'Без контекста',
  readme: 'README',
  docs: 'Доки',
  'docs+rules': 'Доки + правила',
  mcp: 'MCP',
};

export const SOURCE_LABELS: Record<string, string> = {
  readme: 'README',
  docs: 'Доки',
  rules: 'Правила',
  tools: 'Инструменты',
};

export const DRIVER_LABELS: Record<string, string> = {
  'claude-code': 'Claude Code',
  api: 'Anthropic API',
  subagent: 'Агент-исполнитель',
};

export function sentence(text: string): string {
  return /^[а-яё]/.test(text) ? text.charAt(0).toLocaleUpperCase('ru-RU') + text.slice(1) : text;
}
