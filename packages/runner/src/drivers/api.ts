import Anthropic from '@anthropic-ai/sdk';
import { estimateTokens } from '@context-lab/index-tools';
import { addUsage, emptyUsage, type Driver, type GenerationRequest, type GenerationResult, type Turn, type Usage } from '../types.ts';

export interface ApiDriverOptions {
  apiKey?: string;
  client?: Anthropic;
  dangerouslyAllowBrowser?: boolean;
  maxTokens?: number;
}

function usageOf(message: Anthropic.Message): Usage {
  return {
    input: message.usage.input_tokens,
    output: message.usage.output_tokens,
    cacheRead: message.usage.cache_read_input_tokens ?? 0,
    cacheCreation: message.usage.cache_creation_input_tokens ?? 0,
  };
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

function firstUserMessage(request: GenerationRequest): Anthropic.MessageParam {
  const content: Anthropic.TextBlockParam[] = [];
  if (request.contextText.length > 0) {
    content.push({ type: 'text', text: request.contextText, cache_control: { type: 'ephemeral' } });
  }
  content.push({ type: 'text', text: request.taskText });
  return { role: 'user', content };
}

export function apiDriver(options: ApiDriverOptions = {}): Driver {
  const client =
    options.client ??
    new Anthropic({
      ...(options.apiKey ? { apiKey: options.apiKey } : {}),
      ...(options.dangerouslyAllowBrowser ? { dangerouslyAllowBrowser: true } : {}),
    });
  const maxTokens = options.maxTokens ?? 16000;

  return {
    name: 'api',
    async generate(request: GenerationRequest): Promise<GenerationResult> {
      const started = Date.now();
      const messages: Anthropic.MessageParam[] = [firstUserMessage(request)];
      const tools: Anthropic.Tool[] | undefined = request.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema as Anthropic.Tool.InputSchema,
      }));
      const turns: Turn[] = [];
      let total = emptyUsage();
      let stopReason = 'end_turn';
      let text = '';

      for (let turn = 0; turn < request.maxTurns; turn += 1) {
        const stream = client.messages.stream(
          {
            model: request.model,
            max_tokens: maxTokens,
            system: request.system,
            messages,
            ...(tools ? { tools } : {}),
            ...(request.effort ? { output_config: { effort: request.effort as 'low' | 'medium' | 'high' | 'xhigh' | 'max' } } : {}),
          },
          request.signal ? { signal: request.signal } : undefined,
        );
        if (request.onText) stream.on('text', request.onText);
        const message = await stream.finalMessage();

        const usage = usageOf(message);
        total = addUsage(total, usage);
        stopReason = message.stop_reason ?? 'end_turn';
        text = textOf(message);
        const toolUses = message.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use');
        const current: Turn = { usage, toolCalls: [] };
        turns.push(current);

        if (stopReason !== 'tool_use' || toolUses.length === 0 || !request.runTool) break;

        messages.push({ role: 'assistant', content: message.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const use of toolUses) {
          const result = request.runTool(use.name, use.input);
          current.toolCalls.push({ name: use.name, input: use.input, resultTokens: estimateTokens(result.text), ...(result.isError ? { isError: true } : {}) });
          results.push({ type: 'tool_result', tool_use_id: use.id, content: result.text, ...(result.isError ? { is_error: true } : {}) });
        }
        messages.push({ role: 'user', content: results });
        if (turn === request.maxTurns - 1) stopReason = 'max_turns';
      }

      return { text, turns, usage: total, stopReason, durationMs: Date.now() - started };
    },
  };
}
