export { DRIVER_LABELS, MODE_LABELS, SOURCE_LABELS } from '@context-lab/runner/browser';

export function sentence(text: string): string {
  return /^[а-яё]/.test(text) ? text.charAt(0).toLocaleUpperCase('ru-RU') + text.slice(1) : text;
}

export function plural(count: number, one: string, few: string, many: string): string {
  if (!Number.isInteger(count)) return few;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
