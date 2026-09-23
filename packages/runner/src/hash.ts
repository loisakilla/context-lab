export function textHash(text: string): string {
  let first = 0xdeadbeef;
  let second = 0x41c6ce57;
  for (let position = 0; position < text.length; position += 1) {
    const code = text.charCodeAt(position);
    first = Math.imul(first ^ code, 2654435761);
    second = Math.imul(second ^ code, 1597334677);
  }
  first = Math.imul(first ^ (first >>> 16), 2246822507) ^ Math.imul(second ^ (second >>> 13), 3266489909);
  second = Math.imul(second ^ (second >>> 16), 2246822507) ^ Math.imul(first ^ (first >>> 13), 3266489909);
  return `${(second >>> 0).toString(16).padStart(8, '0')}${(first >>> 0).toString(16).padStart(8, '0')}`;
}
