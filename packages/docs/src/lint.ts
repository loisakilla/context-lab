import type { ComponentDescription } from '@context-lab/docgen';
import type { LibraryIndex } from '@context-lab/index-tools';

export interface DocsIssue {
  level: 'error' | 'warning';
  component: string;
  message: string;
}

export function lintDocs(index: LibraryIndex, descriptions: Map<string, ComponentDescription>): DocsIssue[] {
  const issues: DocsIssue[] = [];
  const byName = new Map(index.components.map((component) => [component.name, component]));

  for (const [name, description] of descriptions) {
    const component = byName.get(name);
    if (!component) {
      issues.push({ level: 'error', component: name, message: `описание есть, а компонента ${name} в библиотеке нет` });
      continue;
    }
    const known = new Set(component.props.map((prop) => prop.name));
    for (const prop of Object.keys(description.props)) {
      if (!known.has(prop)) issues.push({ level: 'error', component: name, message: `в описании есть проп ${prop}, которого нет в типах компонента` });
    }
    if (!description.description) issues.push({ level: 'warning', component: name, message: 'файл описания без вводного текста' });
    if (description.examples.length === 0) issues.push({ level: 'warning', component: name, message: 'нет ни одного примера' });
  }

  for (const component of index.components) {
    if (!descriptions.has(component.name)) {
      issues.push({ level: 'warning', component: component.name, message: 'нет файла описания в docs/components' });
    }
  }

  return issues.sort((a, b) => (a.level === b.level ? a.component.localeCompare(b.component) : a.level === 'error' ? -1 : 1));
}
