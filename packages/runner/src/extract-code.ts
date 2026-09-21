const FENCE = /```(?:tsx|jsx|ts|typescript|javascript)?[^\n]*\r?\n([\s\S]*?)```/g;

export function extractCode(text: string): string {
  const blocks = [...text.matchAll(FENCE)].map((match) => (match[1] ?? '').trim()).filter((block) => block.length > 0);
  if (blocks.length > 0) {
    const withExport = blocks.find((block) => /export default/.test(block));
    return withExport ?? blocks.reduce((longest, block) => (block.length > longest.length ? block : longest), '');
  }
  const trimmed = text.trim();
  if (/^import\s|export default/m.test(trimmed)) return trimmed;
  return '';
}
