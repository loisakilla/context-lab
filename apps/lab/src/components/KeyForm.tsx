'use client';

import { useEffect, useState } from 'react';
import { JxButton, JxInputField, JxSwitch } from '@jinx-ui/react';
import { forgetKey, maskKey, readKey, saveKey, type KeyScope } from '@/lib/key-store';

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
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>
          Ключ {maskKey(stored.key)} хранится {stored.scope === 'session' ? 'до закрытия вкладки' : 'в этом браузере'}. Запросы идут напрямую в api.anthropic.com, на сервер лаборатории ключ не попадает.
        </span>
        <JxButton variant="ghost" size="sm" onClick={forget}>
          Забыть ключ
        </JxButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <JxInputField
        label="Ключ Anthropic API"
        type="password"
        placeholder="sk-ant-…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        helperText="Нужен только для живого прогона. Ключ остаётся в браузере: страница вызывает api.anthropic.com напрямую, сервер лаборатории получает лишь сгенерированный код для проверки компилятором."
      />
      <div className="flex flex-wrap items-center gap-3">
        <JxSwitch label="Помнить только до закрытия вкладки" checked={sessionOnly} onChange={(event) => setSessionOnly(event.target.checked)} />
        <JxButton variant="primary" size="sm" onClick={save} disabled={draft.trim().length === 0}>
          Сохранить ключ
        </JxButton>
      </div>
    </div>
  );
}
