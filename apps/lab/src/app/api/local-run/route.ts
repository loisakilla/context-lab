import { agentSandbox, claudeCodeDriver, CONTEXT_MODES, loadSources, loadTasks, repoMcpServer, runTask, type ContextMode, type Task } from '@context-lab/runner';
import { checkCode } from '@/lib/checker';
import { labConfig } from '@/lib/data';
import { readJsonObject, sameOrigin, sendsJson } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const maxDuration = 300;

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export async function POST(request: Request): Promise<Response> {
  if (process.env.CONTEXT_LAB_LOCAL !== '1') return Response.json({ error: 'Локальный режим выключен' }, { status: 404 });
  if (!sameOrigin(request)) return Response.json({ error: 'Локальный прогон доступен только со страниц лаборатории' }, { status: 403 });
  if (!sendsJson(request)) return Response.json({ error: 'Ожидается Content-Type: application/json' }, { status: 415 });

  const body = await readJsonObject(request);
  if (!body) return Response.json({ error: 'Ожидается JSON-объект' }, { status: 400 });

  const mode = text(body.mode) as ContextMode;
  if (!CONTEXT_MODES.includes(mode)) return Response.json({ error: `Неизвестный режим ${String(body.mode)}` }, { status: 400 });

  const config = labConfig();
  const taskId = text(body.taskId);
  const promptText = text(body.prompt);
  const known = taskId ? loadTasks(config).find((task) => task.id === taskId) : undefined;
  const prompt = (promptText ?? known?.prompt ?? '').trim();
  if (prompt.length === 0) return Response.json({ error: 'Нужна задача: taskId или prompt' }, { status: 400 });

  const expects = Array.isArray(body.expects) ? body.expects.filter((item): item is string => typeof item === 'string') : [];
  const task: Task = known ? { ...known } : { id: 'custom', title: 'Своя задача', prompt, taskType: 'ui', expects };
  if (known && promptText && promptText.trim() !== known.prompt) task.prompt = promptText.trim();

  const sources = loadSources(config);
  try {
    const record = await runTask({
      driver: claudeCodeDriver({ cwd: agentSandbox(), ...(mode === 'mcp' ? { mcpServer: repoMcpServer(config.root) } : {}) }),
      mode,
      task,
      sources,
      model: text(body.model) ?? 'claude-opus-5',
      checker: { check: (code, expects) => checkCode(code, expects) },
      signal: request.signal,
    });
    return Response.json(record);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
