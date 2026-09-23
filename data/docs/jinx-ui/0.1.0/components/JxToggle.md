# JxToggle

Сегментированный переключатель на два-три коротких варианта: режим отображения, тема, период. Для большего числа вариантов берите `JxSelect`, для навигации между разделами — `JxTabs`.

Импорт: `import { JxToggle } from '@jinx-ui/react'`  
Источник: `dist/components/Toggle.d.ts:12`
Ключевые слова: toggle, переключатель, сегментированный контрол, режим, выбор одного

## Сигнатура

```tsx
<JxToggle items: JxToggleItem[]; defaultValue?: string; onValueChange?: (value: string) => void; value?: string />
```

Наследует `Omit<HTMLAttributes<HTMLDivElement>, "onChange">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `JxToggleItem[]` | да |  | варианты переключателя, каждый со значением `value` и подписью `label` |
| `defaultValue` | `string` | нет |  | начальное значение в неуправляемом режиме |
| `onValueChange` | `(value: string) => void` | нет |  | вызывается при выборе варианта |
| `value` | `string` | нет |  | выбранное значение в управляемом режиме |

## CSS-классы

`jx-toggle-btn`, `jx-toggle-group`, `jx-toggle-indicator-bg`

## Примеры

### Выбор периода

```tsx
function ReportPeriod({ setPeriod }: { setPeriod: (period: string) => void }) {
  return (
    <JxToggle
      items={[
        { value: 'day', label: 'День' },
        { value: 'week', label: 'Неделя' },
        { value: 'month', label: 'Месяц' },
      ]}
      defaultValue="week"
      onValueChange={(value) => setPeriod(value)}
    />
  );
}
```
