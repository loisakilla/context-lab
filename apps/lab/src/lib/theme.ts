'use client';

import { useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
export type Style = 'brutal' | 'glass' | 'minimal';

export interface Appearance {
  theme: Theme;
  style: Style;
}

export const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Тёмная' },
  { value: 'light', label: 'Светлая' },
];

export const STYLES: { value: Style; label: string }[] = [
  { value: 'brutal', label: 'Brutal' },
  { value: 'glass', label: 'Glass' },
  { value: 'minimal', label: 'Minimal' },
];

const STORAGE_KEY = 'contextlab.appearance';
const DEFAULT: Appearance = { theme: 'dark', style: 'brutal' };

let current: Appearance = DEFAULT;
let restored = false;
const listeners = new Set<() => void>();

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function isStyle(value: unknown): value is Style {
  return value === 'brutal' || value === 'glass' || value === 'minimal';
}

function apply(appearance: Appearance): void {
  const html = document.documentElement;
  html.setAttribute('data-theme', appearance.theme);
  html.setAttribute('data-style', appearance.style);
}

function remember(appearance: Appearance): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    return;
  }
}

function stored(): Appearance {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<Appearance>;
    return {
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT.theme,
      style: isStyle(parsed.style) ? parsed.style : DEFAULT.style,
    };
  } catch {
    return DEFAULT;
  }
}

function publish(next: Appearance): void {
  current = next;
  apply(next);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setTheme(theme: Theme): void {
  const next: Appearance = { ...current, theme };
  remember(next);
  publish(next);
}

export function setStyle(style: Style): void {
  const next: Appearance = { ...current, style };
  remember(next);
  publish(next);
}

export function useAppearance(): Appearance {
  const appearance = useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT,
  );

  useEffect(() => {
    if (restored) return;
    restored = true;
    const saved = stored();
    if (saved.theme !== current.theme || saved.style !== current.style) publish(saved);
  }, []);

  return appearance;
}
