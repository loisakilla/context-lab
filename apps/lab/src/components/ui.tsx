'use client';

import type { ChangeEvent, ReactNode, TextareaHTMLAttributes } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="dim text-[13px] leading-snug">{hint}</span>}
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
      <select className="input" value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onValueChange(event.target.value)}>
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
      <textarea className="input" {...rest} />
    </Field>
  );
}

export function Tabs({
  ariaLabel,
  items,
  value,
  onValueChange,
  block = false,
}: {
  ariaLabel: string;
  items: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  block?: boolean;
}) {
  return (
    <div className={block ? 'seg seg--block' : 'seg'} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          className="seg__item"
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
  variant?: 'primary' | 'flat' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button type={type} className={`btn btn--${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'default',
  dot = false,
  mono = false,
}: {
  children: ReactNode;
  tone?: 'default' | 'ok' | 'bad' | 'warn' | 'accent';
  dot?: boolean;
  mono?: boolean;
}) {
  const classes = ['chip', tone === 'default' ? '' : `chip--${tone}`, mono ? 'chip--mono' : ''].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function Note({ tone = 'warn', title, children }: { tone?: 'warn' | 'bad'; title: string; children: ReactNode }) {
  return (
    <div className={`note note--${tone}`}>
      <span className="note__title">{title}</span>
      <div className="note__body">{children}</div>
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'ok' | 'bad' }) {
  const color = tone === 'bad' ? 'var(--danger)' : tone === 'ok' ? 'var(--success)' : tone === 'accent' ? 'var(--accent-text)' : 'var(--fg)';
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className="stat__value" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
