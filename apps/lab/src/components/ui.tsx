'use client';

import type { ChangeEvent, ReactNode, TextareaHTMLAttributes } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
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
  return (
    <Field label={label}>
      <select className="control" value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onValueChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Textarea({ label, ...rest }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label}>
      <textarea className="control" {...rest} />
    </Field>
  );
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
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          className="tab"
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
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
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button type={type} className={`btn btn--${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'default', dot = false }: { children: ReactNode; tone?: 'default' | 'ok' | 'bad' | 'warn'; dot?: boolean }) {
  return (
    <span className={tone === 'default' ? 'badge' : `badge badge--${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function Note({ tone = 'warn', title, children }: { tone?: 'warn' | 'bad'; title: string; children: ReactNode }) {
  const color = tone === 'bad' ? 'var(--bad)' : 'var(--warn)';
  return (
    <div className="panel flex flex-col gap-2" style={{ borderColor: `color-mix(in oklab, ${color} 35%, transparent)` }}>
      <span className="text-sm font-medium" style={{ color }}>
        {title}
      </span>
      <div className="muted text-sm">{children}</div>
    </div>
  );
}

export function Figure({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'ok' | 'bad' }) {
  const color = tone === 'bad' ? 'var(--bad)' : tone === 'ok' ? 'var(--ok)' : tone === 'accent' ? 'var(--accent)' : 'var(--ink)';
  return (
    <div className="flex flex-col gap-1">
      <span className="field-label">{label}</span>
      <span className="mono text-[17px] leading-tight" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
