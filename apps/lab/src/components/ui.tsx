'use client';

import type { ReactNode, TextareaHTMLAttributes } from 'react';
import { JxAlert, JxBadge, JxButton, JxSelect, JxTabs, JxTextareaField } from '@jinx-ui/react';

type Tone = 'default' | 'ok' | 'bad' | 'warn' | 'accent';

const BADGE_TONES: Record<Tone, 'default' | 'success' | 'danger' | 'warning' | 'accent'> = {
  default: 'default',
  ok: 'success',
  bad: 'danger',
  warn: 'warning',
  accent: 'accent',
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="jx-field">
      <span className="jx-label">{label}</span>
      {children}
    </label>
  );
}

export function Select({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return <JxSelect label={label} options={options} value={value} onValueChange={onValueChange} />;
}

export function Textarea({ label, ...rest }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <JxTextareaField label={label} {...rest} />;
}

export function Tabs({
  ariaLabel,
  items,
  value,
  onValueChange,
}: {
  ariaLabel: string;
  items: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return <JxTabs ariaLabel={ariaLabel} items={items} value={value} onValueChange={onValueChange} />;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'flat' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <JxButton type={type} variant={variant === 'flat' ? 'secondary' : variant} onClick={onClick} disabled={disabled}>
      {children}
    </JxButton>
  );
}

export function Badge({ children, tone = 'default', dot = false }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <JxBadge tone={BADGE_TONES[tone]} dot={dot}>
      {children}
    </JxBadge>
  );
}

export function Note({ tone = 'warn', title, children }: { tone?: 'warn' | 'bad'; title: string; children: ReactNode }) {
  return (
    <JxAlert intent={tone === 'bad' ? 'danger' : 'warning'} title={title}>
      {children}
    </JxAlert>
  );
}

export function plural(count: number, one: string, few: string, many: string): string {
  if (!Number.isInteger(count)) return few;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function CodeBlock({ code, title = 'tsx', maxHeight }: { code: string; title?: string; maxHeight?: number }) {
  const lines = code.replace(/\n+$/, '').split('\n');
  return (
    <div className="jx-codeblock">
      <div className="jx-codeblock-head">
        <span>{title}</span>
        <span>
          {lines.length} {plural(lines.length, 'строка', 'строки', 'строк')}
        </span>
      </div>
      <div className="jx-codeblock-body" style={maxHeight === undefined ? undefined : { maxHeight, overflowY: 'auto' }}>
        <pre className="ln">{lines.map((_, index) => index + 1).join('\n')}</pre>
        <pre className="code">{lines.join('\n')}</pre>
      </div>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'ok' | 'bad' }) {
  return (
    <div className="stat">
      <span className="jx-label">{label}</span>
      <span className="stat__value" style={tone === 'bad' ? { color: 'var(--jx-danger)' } : undefined}>
        {value}
      </span>
    </div>
  );
}
