'use client';

import { JxToggle } from '@jinx-ui/react';
import { setStyle, setTheme, STYLES, THEMES, useAppearance, type Style, type Theme } from '@/lib/theme';

export function ThemeControls() {
  const appearance = useAppearance();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <JxToggle aria-label="Тема" items={THEMES} value={appearance.theme} onValueChange={(value) => setTheme(value as Theme)} />
      <JxToggle aria-label="Стиль" items={STYLES} value={appearance.style} onValueChange={(value) => setStyle(value as Style)} />
    </div>
  );
}
