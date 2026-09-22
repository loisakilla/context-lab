'use client';

import { useEffect, useState } from 'react';
import { forgetKey, maskKey, readKey, saveKey, type KeyScope } from '@/lib/key-store';
import { Button, Field } from './ui';

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
      <div className="flex flex-col gap-3">
        <p className="quiet text-sm">
          Ключ {maskKey(stored.key)} хранится {stored.scope === 'session' ? 'до закрытия вкладки' : 'в этом браузере'}. Запросы идут напрямую в
          api.anthropic.com.
        </p>
        <Button variant="ghost" onClick={forget}>
          Забыть ключ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Ключ Anthropic API">
        <input
          className="control"
          type="password"
          placeholder="sk-ant-…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="off"
        />
      </Field>
      <p className="quiet text-sm">
        Ключ остаётся в браузере: страница вызывает api.anthropic.com напрямую, сервер лаборатории получает только сгенерированный код для проверки.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sessionOnly} onChange={(event) => setSessionOnly(event.target.checked)} />
        <span className="muted">Помнить только до закрытия вкладки</span>
      </label>
      <Button variant="primary" onClick={save} disabled={draft.trim().length === 0}>
        Сохранить ключ
      </Button>
    </div>
  );
}
