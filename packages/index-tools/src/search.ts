import type { ComponentDoc, LibraryIndex, SearchHit } from './types.ts';

const DEPRECATED_PENALTY = 0.4;
const MAX_PROP_MATCHES = 3;
const MIN_FUZZY_LENGTH = 4;
const MAX_FUZZY_DISTANCE = 2;

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1);
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, position) => position);

  for (let row = 1; row <= a.length; row += 1) {
    const current: number[] = [row];
    for (let column = 1; column <= b.length; column += 1) {
      const substitution = a[row - 1] === b[column - 1] ? 0 : 1;
      current[column] = Math.min(
        (previous[column] ?? 0) + 1,
        (current[column - 1] ?? 0) + 1,
        (previous[column - 1] ?? 0) + substitution,
      );
    }
    previous = current;
  }

  return previous[b.length] ?? 0;
}

function normalizedName(component: ComponentDoc): string {
  return component.name.toLowerCase();
}

function bareName(component: ComponentDoc): string {
  return component.name.replace(/^Jx/, '').toLowerCase();
}

function isNearMiss(term: string, name: string): boolean {
  return term.length >= MIN_FUZZY_LENGTH && editDistance(term, name) <= MAX_FUZZY_DISTANCE;
}

function scoreComponent(component: ComponentDoc, query: string, terms: string[]): SearchHit | undefined {
  const name = normalizedName(component);
  const short = bareName(component);
  const description = (component.description ?? '').toLowerCase();
  const matchedOn = new Set<string>();
  let score = 0;

  if (name === query || short === query) {
    score += 120;
    matchedOn.add('name');
  } else if (query.length > 1 && (name.includes(query) || short.includes(query))) {
    score += 60;
    matchedOn.add('name');
  }

  for (const term of terms) {
    if (name.startsWith(term) || short.startsWith(term)) {
      score += 40;
      matchedOn.add('name');
    } else if (name.includes(term)) {
      score += 25;
      matchedOn.add('name');
    } else if (isNearMiss(term, name) || isNearMiss(term, short)) {
      score += 18;
      matchedOn.add('name (опечатка)');
    }

    for (const keyword of component.keywords) {
      const lowered = keyword.toLowerCase();
      if (lowered === term) {
        score += 35;
        matchedOn.add('keywords');
      } else if (lowered.includes(term)) {
        score += 20;
        matchedOn.add('keywords');
      }
    }

    if (description.includes(term)) {
      score += 12;
      matchedOn.add('description');
    }

    let propMatches = 0;
    for (const prop of component.props) {
      if (propMatches >= MAX_PROP_MATCHES) break;
      if (prop.name.toLowerCase().includes(term)) {
        score += 8;
        propMatches += 1;
        matchedOn.add('props');
      }
    }

    if (component.examples.some((example) => example.code.toLowerCase().includes(term))) {
      score += 4;
      matchedOn.add('examples');
    }
  }

  if (score === 0) return undefined;
  if (component.status === 'deprecated') score *= DEPRECATED_PENALTY;

  return { component, score: Math.round(score), matchedOn: [...matchedOn] };
}

export function searchComponents(index: LibraryIndex, rawQuery: string, limit = 5): SearchHit[] {
  const query = rawQuery.trim().toLowerCase();
  const terms = tokenize(rawQuery);

  if (query.length === 0) {
    return index.components.slice(0, limit).map((component) => ({ component, score: 0, matchedOn: [] }));
  }

  const hits: SearchHit[] = [];
  for (const component of index.components) {
    const hit = scoreComponent(component, query, terms);
    if (hit) hits.push(hit);
  }

  hits.sort((a, b) => (b.score === a.score ? a.component.name.localeCompare(b.component.name) : b.score - a.score));
  return hits.slice(0, limit);
}

export function findComponent(index: LibraryIndex, name: string): ComponentDoc | undefined {
  const needle = name.trim().toLowerCase();
  return index.components.find((component) => normalizedName(component) === needle || bareName(component) === needle);
}

export function suggestNames(index: LibraryIndex, name: string, limit = 3): string[] {
  const found = searchComponents(index, name, limit).map((hit) => hit.component.name);
  if (found.length > 0) return found;

  const needle = name.trim().toLowerCase();
  const threshold = Math.max(MAX_FUZZY_DISTANCE, Math.floor(needle.length / 2));

  return index.components
    .map((component) => ({
      name: component.name,
      distance: Math.min(editDistance(needle, normalizedName(component)), editDistance(needle, bareName(component))),
    }))
    .filter((candidate) => candidate.distance <= threshold)
    .sort((a, b) => (a.distance === b.distance ? a.name.localeCompare(b.name) : a.distance - b.distance))
    .slice(0, limit)
    .map((candidate) => candidate.name);
}
