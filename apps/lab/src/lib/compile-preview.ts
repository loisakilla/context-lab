import { transform } from 'sucrase';

export function compilePreview(code: string): string {
  return transform(code, { transforms: ['typescript', 'jsx', 'imports'], jsxRuntime: 'automatic', production: true }).code;
}
