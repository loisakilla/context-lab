import { readFileSync } from 'node:fs';

const prompt = readFileSync(0, 'utf8');
const args = process.argv.slice(2);
const usage = { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
const emit = (event) => process.stdout.write(`${JSON.stringify(event)}\n`);

if (prompt.includes('HANG')) {
  emit({ type: 'assistant', message: { id: 'm1', content: [{ type: 'text', text: 'думаю' }], usage } });
  setInterval(() => undefined, 1000);
} else if (prompt.includes('MAX_TURNS')) {
  emit({ type: 'assistant', message: { id: 'm1', content: [{ type: 'tool_use', id: 't1', name: 'mcp__context-lab__search_components', input: { query: 'x' } }], usage } });
  emit({ type: 'result', subtype: 'error_max_turns', is_error: true, usage, num_turns: 9 });
} else {
  const effort = args.includes('--effort') ? args[args.indexOf('--effort') + 1] : 'none';
  emit({ type: 'assistant', message: { id: 'm1', content: [{ type: 'text', text: 'готово' }], usage } });
  emit({ type: 'result', subtype: 'success', result: `effort:${effort}`, usage, stop_reason: 'end_turn' });
}
