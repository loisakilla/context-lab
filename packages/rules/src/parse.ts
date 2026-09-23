import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { Registry, RuleDefinition, RuleSet, RuleTarget } from './types.ts';

const SEMVER = /^\d+\.\d+\.\d+$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;

const ruleSchema = z.object({
  id: z.string().regex(ID, 'id: только строчные буквы, цифры и дефис'),
  version: z.string().regex(SEMVER, 'version: ожидается semver вида 1.2.0'),
  title: z.string().min(1),
  applies_to: z.array(z.string()).default([]),
  task_types: z.array(z.string()).default([]),
  priority: z.number().int().min(0).max(100).default(50),
  targets: z.array(z.enum(['claude', 'cursor', 'copilot', 'agents'])).default(['claude', 'cursor', 'copilot', 'agents']),
  extends: z.string().optional(),
  conflicts_with: z.array(z.string()).default([]),
});

const setSchema = z.object({
  name: z.string().regex(ID),
  version: z.string().regex(SEMVER),
  description: z.string().optional(),
  extends: z.array(z.string()).default([]),
});

export class RuleParseError extends Error {
  constructor(
    public readonly file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
  }
}

function issuesText(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`).join('; ');
}

export function parseRule(markdown: string, set: string, file: string): RuleDefinition {
  const parsed = matter(markdown);
  const result = ruleSchema.safeParse(parsed.data);
  if (!result.success) throw new RuleParseError(file, issuesText(result.error));
  const data = result.data;
  const rule: RuleDefinition = {
    id: data.id,
    version: data.version,
    title: data.title,
    body: parsed.content.trim(),
    appliesTo: data.applies_to,
    taskTypes: data.task_types,
    priority: data.priority,
    targets: data.targets as RuleTarget[],
    conflictsWith: data.conflicts_with,
    set,
    file,
  };
  if (data.extends) rule.extends = data.extends;
  return rule;
}

export function parseSetManifest(text: string, dir: string): Omit<RuleSet, 'rules'> {
  const result = setSchema.safeParse(parseYaml(text) ?? {});
  if (!result.success) throw new RuleParseError(path.join(dir, '_set.yaml'), issuesText(result.error));
  const data = result.data;
  return { name: data.name, version: data.version, extends: data.extends, dir, ...(data.description ? { description: data.description } : {}) };
}

export function loadSet(dir: string): RuleSet {
  const manifestFile = path.join(dir, '_set.yaml');
  if (!existsSync(manifestFile)) throw new RuleParseError(manifestFile, 'нет файла _set.yaml');
  const manifest = parseSetManifest(readFileSync(manifestFile, 'utf8'), dir);
  const rules = readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => parseRule(readFileSync(path.join(dir, file), 'utf8'), manifest.name, path.join(dir, file)));
  return { ...manifest, rules };
}

export function loadRegistry(root: string): Registry {
  const sets = new Map<string, RuleSet>();
  if (!existsSync(root)) return { sets, root };
  for (const entry of readdirSync(root).sort()) {
    const dir = path.join(root, entry);
    if (!statSync(dir).isDirectory() || entry.startsWith('.') || entry === 'compiled') continue;
    if (!existsSync(path.join(dir, '_set.yaml'))) continue;
    const set = loadSet(dir);
    sets.set(set.name, set);
  }
  return { sets, root };
}

export { registryFromSets } from './registry.ts';
