import path from 'node:path';
import { agentSandbox, claudeCodeDriver, CONTEXT_MODES, repoMcpServer, runTask, type ContextMode, type Task } from '@context-lab/runner';
import { checkCode } from '@/lib/checker';
import { labConfig, loadLabData } from '@/lib/data';

export const runtime = 'nodejs';
export const maxDuration = 600;

interface LocalRunBody {
  taskId?: string;
  prompt?: string;
  expects?: string[];
  mode?: string;
  model?: string;
}

export async function POST(request: Request): Promise<Response> {
  if (process.env.CONTEXT_LAB_LOCAL !== '1') return Response.json({ error: 'Локальный режим выключен' }, { status: 404 });

  let body: LocalRunBody;
  try {
    body = (await request.json()) as LocalRunBody;
  } catch {
    return Response.json({ error: 'Ожидается JSON' }, { status: 400 });
  }

  const mode = body.mode as ContextMode;
  if (!CONTEXT_MODES.includes(mode)) return Response.json({ error: `Неизвестный режим ${String(body.mode)}` }, { status: 400 });

  const data = loadLabData();
  const root = labConfig().root;
  const known = body.taskId ? data.tasks.find((task) => task.id === body.taskId) : undefined;
  const prompt = (body.prompt ?? known?.prompt ?? '').trim();
  if (prompt.length === 0) return Response.json({ error: 'Нужна задача: taskId или prompt' }, { status: 400 });

  const task: Task = known ?? { id: 'custom', title: 'Своя задача', prompt, taskType: 'ui', expects: body.expects ?? [] };
  if (known && body.prompt && body.prompt.trim() !== known.prompt) task.prompt = body.prompt.trim();

  const sources = { index: data.index, readme: data.readme, docs: data.docs, ...(data.rules ? { rules: data.rules } : {}) };
  try {
    const record = await runTask({
      driver: claudeCodeDriver({ cwd: agentSandbox(), ...(mode === 'mcp' ? { mcpServer: repoMcpServer(root) } : {}) }),
      mode,
      task,
      sources,
      model: body.model ?? 'claude-opus-5',
      checker: { check: (code, expects) => checkCode(code, expects) },
    });
    return Response.json(record);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
