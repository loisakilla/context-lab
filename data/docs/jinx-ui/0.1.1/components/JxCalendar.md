# JxCalendar

Календарь на один месяц с выбором одной даты. Значение — `Date` или `null`, управляемое через `value` и `onValueChange`. Диапазон подсвечивается через `rangeHover`, а подпись месяца форматируется `monthFormatter` или локалью. Чтобы пользователь сам выбирал период, берите `JxDateRangePicker`: `rangeHover` только показывает готовый диапазон. С клавиатуры: стрелки ходят по дням и неделям, `Home` и `End` — к краям недели, `PageUp` и `PageDown` — по месяцам. Доступное имя каждого дня — полная дата, а не число.

Импорт: `import { JxCalendar } from '@jinx-ui/react'`  
Источник: `dist/components/Calendar.d.ts:34`
Ключевые слова: календарь, calendar, дата, выбор даты, datepicker, период, месяц

## Сигнатура

```tsx
<JxCalendar defaultValue?: Date | null; locale?: string = 'en-US'; monthFormatter?: (date: Date) => { month: string; year: string; }; onValueChange?: (value: Date | null) => void; rangeHover?: { from: Date; to: Date; } | null; ref?: Ref<HTMLDivElement>; value?: Date | null />
```

Наследует `Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `defaultValue` | `Date \| null` | нет |  | начальная дата |
| `locale` | `string` | нет | `'en-US'` | локаль для названия месяца и доступных имён дней, `en-US` по умолчанию; однобуквенные подписи дней недели не локализуются |
| `monthFormatter` | `(date: Date) => { month: string; year: string; }` | нет |  | функция форматирования подписи месяца и года |
| `onValueChange` | `(value: Date \| null) => void` | нет |  | вызывается с выбранной датой или `null` |
| `rangeHover` | `{ from: Date; to: Date; } \| null` | нет |  | подсветка диапазона `{ from, to }` |
| `ref` | `Ref<HTMLDivElement>` | нет |  |  |
| `value` | `Date \| null` | нет |  | выбранная дата в управляемом режиме |

## CSS-классы

`jx-cal-day`, `jx-cal-day--in-range`, `jx-cal-day--out`, `jx-cal-day--range-end`, `jx-cal-day--range-start`, `jx-cal-day--selected`, `jx-cal-day--today`, `jx-cal-dow`, `jx-cal-grid`, `jx-cal-head`, `jx-cal-month`, `jx-cal-nav`, `jx-calendar`

## Примеры

### Выбор даты с русской локалью

```tsx
function DueDate() {
  const [date, setDate] = useState<Date | null>(null);
  return <JxCalendar locale="ru-RU" value={date} onValueChange={setDate} />;
}
```
