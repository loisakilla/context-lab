import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs', 'screenshots');
const base = process.env.LAB_URL ?? 'http://localhost:3000';

const SHOTS = [
  { name: 'lab', url: '/', width: 1500, height: 1000 },
  { name: 'compare', url: '/compare?task=confirm-delete&left=none&right=mcp', width: 1800, height: 1100 },
  { name: 'rules', url: '/rules?set=jinx-ui&task=ui', width: 1300, height: 1000 },
];

const CANDIDATES = [
  process.env.CHROME_BINARY,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

function findBrowser(): string {
  const found = CANDIDATES.find((candidate) => candidate !== undefined && existsSync(candidate));
  if (!found) throw new Error('Не нашёл Chrome или Edge: укажите путь в переменной CHROME_BINARY');
  return found;
}

const browser = findBrowser();
mkdirSync(outDir, { recursive: true });
process.stderr.write(`Снимаю ${base} через ${path.basename(browser)}\n`);

for (const shot of SHOTS) {
  const file = path.join(outDir, `${shot.name}.png`);
  execFileSync(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${shot.width},${shot.height}`,
      '--virtual-time-budget=12000',
      `--screenshot=${file}`,
      `${base}${shot.url}`,
    ],
    { stdio: 'ignore' },
  );
  process.stderr.write(`  ${shot.name}.png — ${shot.width}×${shot.height}\n`);
}

process.stderr.write(`Готово: ${path.relative(root, outDir)}\n`);
