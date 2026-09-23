import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { docsDirReader } from '@context-lab/docs';
import { createTools, estimateTokens, libraryOverview, libraryRulesPrompt, serverInstructions, type LibraryIndex, type ToolResult } from '@context-lab/index-tools';
import { renderRulesText, resolveRules, rulesToolSource, type Registry } from '@context-lab/rules';

export interface ServerOptions {
  index: LibraryIndex;
  registry?: Registry;
  rulesSet?: string;
  docsDir?: string;
  version?: string;
  instructions?: boolean;
}

function textResult(result: ToolResult) {
  return {
    content: [{ type: 'text' as const, text: result.text }],
    ...(result.isError ? { isError: true } : {}),
  };
}

export function createServer(options: ServerOptions): McpServer {
  const { index, registry } = options;
  const readDoc = options.docsDir ? docsDirReader(options.docsDir) : undefined;
  const rulesSet = options.rulesSet ?? index.library.name;
  const server = new McpServer(
    { name: 'context-lab', version: options.version ?? '0.1.0' },
    options.instructions === false ? {} : { instructions: serverInstructions(index) },
  );

  const tools = createTools(index, {
    ...(readDoc ? { docs: readDoc } : {}),
    ...(registry ? { rules: rulesToolSource(registry, rulesSet) } : {}),
  });
  for (const spec of tools) {
    server.registerTool(spec.name, { title: spec.title, description: spec.description, inputSchema: spec.shape }, async (args) => textResult(spec.run(args as never)));
  }

  server.registerPrompt(
    'jinx_rules',
    {
      title: 'Правила работы с библиотекой',
      description: 'Версионированные правила для ассистента: как пользоваться библиотекой компонентов и инструментами сервера, чтобы не выдумывать API.',
      argsSchema: { task: z.string().optional().describe('Задача, которую предстоит решить') },
    },
    ({ task }) => {
      const base = libraryRulesPrompt(index, task);
      const registryText = registry ? `\n\n${renderRulesText(resolveRules(registry, rulesSet, { taskType: 'ui', target: 'claude' }))}` : '';
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: `${base}${registryText}` } }] };
    },
  );

  server.registerResource(
    'library-overview',
    'context-lab://library',
    { title: `Обзор библиотеки ${index.library.name}`, description: 'Однострочные сигнатуры всех компонентов: дешёвый обзор всей библиотеки.', mimeType: 'text/plain' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/plain', text: libraryOverview(index) }] }),
  );

  const llms = readDoc?.('llms.txt');
  if (llms) {
    server.registerResource(
      'llms-txt',
      'context-lab://llms.txt',
      { title: 'llms.txt', description: `AI-документация ${index.library.name}: обзор, ~${estimateTokens(llms)} токенов.`, mimeType: 'text/markdown' },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: llms }] }),
    );
  }

  return server;
}
