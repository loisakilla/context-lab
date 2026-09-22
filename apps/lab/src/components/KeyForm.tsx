'use client';

import { useEffect, useState } from 'react';
import { forgetKey, maskKey, readKey, saveKey, type KeyScope } from '@/lib/key-store';
import { Button } from './ui';

interface KeyFormProps {
  onChange: (key: string | null) => void;
}

export function KeyForm({ onChange }: KeyFormProps) {
  const [stored, setStored] = useState<{ key: string; scope: KeyScope } | null>(null);
  const [draft, setDraft] = useState('');
  const [sessionOnly, setSessionOnly] = useState(false);

  useEffect(() => {
    const existing = readKey();
    setStored(existing);
    onChange(existing?.key ?? null);
  }, [onChange]);

  const save = () => {
    const key = draft.trim();
    if (!key) return;
    const scope: KeyScope = sessionOnly ? 'session' : 'local';
    saveKey(key, scope);
    setStored({ key, scope });
    setDraft('');
    onChange(key);
  };

  const forget = () => {
    forgetKey();
    setStored(null);
    onChange(null);
  };

  if (stored) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="mono text-sm">{maskKey(stored.key)}</span>
        <span className="dim max-w-[62ch] text-[13px]">
          хранится {stored.scope === 'session' ? 'до закрытия вкладки' : 'в этом браузере'}; запросы идут напрямую в api.anthropic.com.
        </span>
        <Button variant="ghost" onClick={forget}>
          Забыть ключ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="field min-w-[18rem] flex-1">
          <span className="label">Ключ Anthropic API</span>
          <input className="input" type="password" placeholder="sk-ant-…" value={draft} onChange={(event) => setDraft(event.target.value)} autoComplete="off" />
        </label>
        <Button variant="flat" onClick={save} disabled={draft.trim().length === 0}>
          Сохранить
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="muted flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={sessionOnly} onChange={(event) => setSessionOnly(event.target.checked)} />
          Помнить только до закрытия вкладки
        </label>
        <span className="dim max-w-[68ch] text-[13px]">
          Ключ остаётся в браузере: страница вызывает api.anthropic.com напрямую, сервер лаборатории получает только сгенерированный код для проверки.
        </span>
      </div>
    </div>
  );
}
