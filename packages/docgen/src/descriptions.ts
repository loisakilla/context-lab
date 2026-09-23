import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { ComponentStatus, ExampleDoc } from '@context-lab/index-tools';

export interface ComponentDescription {
  component: string;
  description?: string;
  keywords: string[];
  status?: ComponentStatus;
  deprecated?: string;
  props: Record<string, string>;
  examples: ExampleDoc[];
}

interface Section {
  title: string;
  body: string;
}

function splitSections(content: string): { intro: string; sections: Section[] } {
  const lines = content.split(/\r?\n/);
  const sections: Section[] = [];
  let intro: string[] = [];
  let current: Section | undefined;
  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading && heading[1]) {
      current = { title: heading[1].trim().toLowerCase(), body: '' };
      sections.push(current);
      continue;
    }
    if (current) current.body += `${line}\n`;
    else intro.push(line);
  }
  return { intro: intro.join('\n').trim(), sections };
}

function parseProps(body: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const line of body.split('\n')) {
    const match = /^\s*[-*]\s*`?([A-Za-z_$][\w$]*)`?\s*[:—–-]\s*(.+?)\s*$/.exec(line);
    if (match && match[1] && match[2]) props[match[1]] = match[2];
  }
  return props;
}

function parseExamples(body: string): ExampleDoc[] {
  const examples: ExampleDoc[] = [];
  const pattern = /^###\s+(.+?)\s*$|^```[^\n`]*\r?\n([\s\S]*?)^```/gm;
  let title: string | undefined;
  for (const match of body.matchAll(pattern)) {
    if (match[1] !== undefined) {
      title = match[1];
      continue;
    }
    const code = (match[2] ?? '').trimEnd();
    if (code.length === 0) continue;
    examples.push(title ? { title, code } : { code });
    title = undefined;
  }
  return examples;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

export function parseDescription(markdown: string, fallbackName: string): ComponentDescription {
  const parsed = matter(markdown);
  const data = parsed.data as Record<string, unknown>;
  const { intro, sections } = splitSections(parsed.content);
  const propsSection = sections.find((section) => /^(props|пропсы)$/.test(section.title));
  const examplesSection = sections.find((section) => /^(examples|примеры)$/.test(section.title));

  const description: ComponentDescription = {
    component: typeof data.component === 'string' ? data.component : fallbackName,
    keywords: asStringList(data.keywords),
    props: propsSection ? parseProps(propsSection.body) : {},
    examples: examplesSection ? parseExamples(examplesSection.body) : [],
  };
  if (intro) description.description = intro;
  if (data.status === 'deprecated') description.status = 'deprecated';
  if (typeof data.deprecated === 'string') {
    description.status = 'deprecated';
    description.deprecated = data.deprecated;
  }
  return description;
}

export function loadDescriptions(dir: string): Map<string, ComponentDescription> {
  const result = new Map<string, ComponentDescription>();
  let entries: string[] = [];
  try {
    entries = readdirSync(dir).filter((file) => file.endsWith('.md'));
  } catch {
    return result;
  }
  for (const file of entries) {
    const markdown = readFileSync(path.join(dir, file), 'utf8');
    const description = parseDescription(markdown, path.basename(file, '.md'));
    result.set(description.component, description);
  }
  return result;
}
