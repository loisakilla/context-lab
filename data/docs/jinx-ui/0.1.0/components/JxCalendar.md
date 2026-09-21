# JxCalendar

Календарь на один месяц с выбором одной даты. Значение — `Date` или `null`, управляемое через `value` и `onValueChange`. Диапазон подсвечивается через `rangeHover`, а подпись месяца форматируется `monthFormatter` или локалью.

Импорт: `import { JxCalendar } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Calendar.tsx:59`
Ключевые слова: календарь, calendar, дата, выбор даты, datepicker, период, месяц

## Сигнатура

```tsx
<JxCalendar defaultValue?: Date | null; locale?: string = 'en-US'; monthFormatter?: (date: Date) => { month: string; year: string }; onValueChange?: (value: Date | null) => void; rangeHover?: { from: Date; to: Date } | null; value?: Date | null />
```

Наследует `Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `defaultValue` | `Date \| null` | нет |  | начальная дата |
| `locale` | `string` | нет | `'en-US'` | локаль для названий месяцев и дней недели, `en-US` по умолчанию |
| `monthFormatter` | `(date: Date) => { month: string; year: string }` | нет |  | функция форматирования подписи месяца и года |
| `onValueChange` | `(value: Date \| null) => void` | нет |  | вызывается с выбранной датой или `null` |
| `rangeHover` | `{ from: Date; to: Date } \| null` | нет |  | подсветка диапазона `{ from, to }` |
| `value` | `Date \| null` | нет |  | выбранная дата в управляемом режиме |

## CSS-классы

`jx-cal-day`, `jx-cal-day--in-range`, `jx-cal-day--out`, `jx-cal-day--selected`, `jx-cal-day--today`, `jx-cal-dow`, `jx-cal-grid`, `jx-cal-head`, `jx-cal-month`, `jx-cal-nav`, `jx-calendar`

## Примеры

### Выбор даты с русской локалью

```tsx
<JxCalendar locale="ru-RU" value={date} onValueChange={setDate} />
```
