'use client';

import { useRouter } from 'next/navigation';
import { Select } from './ui';
import { MODE_LABELS } from './MatrixTable';

interface CompareControlsProps {
  tasks: { id: string; title: string }[];
  modes: string[];
  task: string;
  left: string;
  right: string;
}

export function CompareControls({ tasks, modes, task, left, right }: CompareControlsProps) {
  const router = useRouter();
  const go = (next: { task?: string; left?: string; right?: string }) => {
    const query = new URLSearchParams({ task: next.task ?? task, left: next.left ?? left, right: next.right ?? right });
    router.push(`/compare?${query.toString()}`);
  };
  const modeOptions = modes.map((mode) => ({ value: mode, label: MODE_LABELS[mode] ?? mode }));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Select label="Задача" options={tasks.map((item) => ({ value: item.id, label: item.title }))} value={task} onValueChange={(value) => go({ task: value })} />
      <Select label="Слева" options={modeOptions} value={left} onValueChange={(value) => go({ left: value })} />
      <Select label="Справа" options={modeOptions} value={right} onValueChange={(value) => go({ right: value })} />
    </div>
  );
}
