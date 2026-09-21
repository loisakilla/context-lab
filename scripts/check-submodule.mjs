import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const marker = join(root, 'vendor', 'jinx-ui', 'package.json');

if (!existsSync(marker)) {
  console.error('Сабмодуль vendor/jinx-ui пуст. Выполните: git submodule update --init');
  process.exit(1);
}
