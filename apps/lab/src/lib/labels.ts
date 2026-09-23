export { DRIVER_LABELS, MODE_LABELS, SOURCE_LABELS } from '@context-lab/runner/browser';

export function sentence(text: string): string {
  return /^[а-яё]/.test(text) ? text.charAt(0).toLocaleUpperCase('ru-RU') + text.slice(1) : text;
}
