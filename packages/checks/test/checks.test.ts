import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildNodeTypeBundle, type TypeBundle } from '../src/bundle.ts';
import { lintCode, usedComponents } from '../src/lint.ts';
import { runChecks } from '../src/report.ts';
import { createChecker, type Checker } from '../src/typecheck.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');

const VALID = `import { useState } from 'react';
import { JxButton, JxModal } from '@jinx-ui/react';

export default function ConfirmDelete() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <JxButton variant="danger" onClick={() => setOpen(true)}>Удалить</JxButton>
      <JxModal open={open} onOpenChange={setOpen} intent="danger" title="Удалить проект?" message="Это нельзя отменить.">
        <JxButton variant="ghost" onClick={() => setOpen(false)}>Отмена</JxButton>
        <JxButton variant="danger" onClick={() => setOpen(false)}>Удалить</JxButton>
      </JxModal>
    </>
  );
}
`;

const INVENTED = `import { JxButton, JxDialog, JxSelect } from '@jinx-ui/react';

export default function Broken() {
  return (
    <div>
      <JxButton tone="loud">Удалить</JxButton>
      <JxButton size="xl">Ещё</JxButton>
      <JxDialog open title="x" />
      <JxSelect options={[{ value: 'a', label: 'A', colour: 'x' }]} />
    </div>
  );
}
`;

let bundle: TypeBundle;
let checker: Checker;

beforeAll(() => {
  bundle = buildNodeTypeBundle({
    packageRoot: path.join(root, 'vendor/jinx-ui/packages/react'),
    packageName: '@jinx-ui/react',
    nodeModules: path.join(root, 'node_modules'),
  });
  checker = createChecker(bundle);
}, 60_000);

describe('бандл типов', () => {
  it('содержит d.ts библиотеки, типы React и стандартные библиотеки', () => {
    expect(Object.keys(bundle.files)).toEqual(expect.arrayContaining(['/node_modules/@jinx-ui/react/src/runtime.d.ts', '/node_modules/@types/react/index.d.ts', '/lib.dom.d.ts']));
    expect(bundle.files['/node_modules/@jinx-ui/react/package.json']).toMatch(/"types"/);
  });

  it('переводит условные exports пакета в пути до d.ts и пропускает лишнее', () => {
    const manifest = JSON.parse(bundle.files['/node_modules/@jinx-ui/react/package.json'] ?? '{}') as {
      exports: Record<string, { types: string }>;
    };
    expect(manifest.exports['.']?.types).toBe('./src/index.d.ts');
    expect(manifest.exports['./runtime']?.types).toBe('./src/runtime.d.ts');
    expect(manifest.exports['./package.json']).toBeUndefined();
    Object.values(manifest.exports).forEach((entry) => {
      expect(bundle.files[`/node_modules/@jinx-ui/react/${entry.types.slice(2)}`]).toBeTruthy();
    });
  });
});

describe('проверка компилятором', () => {
  it('корректный код проходит без ошибок', () => {
    const report = checker.typecheck(VALID);
    expect(report.errors).toEqual([]);
    expect(report.unknownProps).toEqual([]);
    expect(report.unknownComponents).toEqual([]);
  });

  it('выдуманный компонент и выдуманные пропсы попадают в отчёт', () => {
    const report = checker.typecheck(INVENTED);
    expect(report.unknownComponents).toEqual(['JxDialog']);
    expect(report.unknownProps).toEqual(expect.arrayContaining([{ component: 'JxButton', prop: 'tone' }, { component: 'JxSelect', prop: 'colour' }]));
    expect(report.errors.some((error) => error.message.includes('"xl"'))).toBe(true);
  });

  it('неверное значение union-пропса тоже считается ошибкой компилятора', () => {
    const report = checker.typecheck(`import { JxButton } from '@jinx-ui/react';\nexport default () => <JxButton size="xl">x</JxButton>;\n`);
    expect(report.errors.some((error) => error.message.includes('"xl"'))).toBe(true);
  });
});

describe('линтер', () => {
  it('ловит цвета напрямую, innerHTML и посторонние импорты', () => {
    const findings = lintCode(`import axios from 'axios';
const styles = { color: '#ff0000', background: 'rgb(1, 2, 3)' };
export default () => <div style={styles} className="card jx-card" dangerouslySetInnerHTML={{ __html: 'x' }} />;
`);
    expect(findings.map((finding) => finding.rule)).toEqual(['import-allowlist', 'no-raw-colors', 'no-raw-colors', 'inline-style', 'custom-class', 'no-inner-html']);
    expect(findings.filter((finding) => finding.severity === 'error')).toHaveLength(4);
  });

  it('токены через var(--jx-*) и классы библиотеки не считаются нарушением', () => {
    const findings = lintCode(`export default () => <div className="jx-card jx-card--raised" data-color="var(--jx-accent)" />;`);
    expect(findings).toEqual([]);
  });

  it('собирает использованные компоненты из JSX', () => {
    expect(usedComponents(VALID)).toEqual(['JxButton', 'JxModal']);
  });
});

describe('сводный отчёт', () => {
  it('считает покрытие ожидаемых компонентов и общий вердикт', () => {
    const report = runChecks(checker, VALID, ['JxModal', 'JxButton', 'JxToast']);
    expect(report.passed).toBe(true);
    expect(report.expectedCoverage).toBe(0.67);
    expect(runChecks(checker, INVENTED, ['JxModal']).passed).toBe(false);
  });
});
