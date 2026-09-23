# JxDateRangePicker

Выбор периода на календаре. Первый клик задаёт начало, второй — конец; если второй день раньше первого, границы меняются местами сами. Пока конец не выбран, наведение подсвечивает будущий промежуток. Значение — объект `{ from, to }`, где любая граница может быть `null`, управляемый через `value` и `onValueChange`. Над сеткой показаны обе даты и кнопка сброса, под сеткой — текстовый статус для скринридера. Клавиатура общая с `JxCalendar`: стрелки ходят по дням и неделям, `Home` и `End` — к краям недели, `PageUp` и `PageDown` — по месяцам, фокус переходит через границу месяца. Названия дней недели не локализуются — `locale` влияет на месяц и на подписи дат.

Импорт: `import { JxDateRangePicker } from '@jinx-ui/react'`  
Источник: `dist/components/Calendar.d.ts:33`
Ключевые слова: диапазон дат, период, date range, от и до, с по, выбор периода, отпуск, бронирование, отчёт за период

## Сигнатура

```tsx
<JxDateRangePicker defaultValue?: JxDateRange; fromLabel?: string = 'From'; locale?: string = 'en-US'; monthFormatter?: (date: Date) => { month: string; year: string; }; onValueChange?: (value: JxDateRange) => void; toLabel?: string = 'To'; value?: JxDateRange />
```

Наследует `Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `defaultValue` | `JxDateRange` | нет |  | начальный период |
| `fromLabel` | `string` | нет | `'From'` | подпись поля начала, `From` по умолчанию |
| `locale` | `string` | нет | `'en-US'` | локаль для названия месяца и подписей дат, `en-US` по умолчанию |
| `monthFormatter` | `(date: Date) => { month: string; year: string; }` | нет |  | функция форматирования подписи месяца и года |
| `onValueChange` | `(value: JxDateRange) => void` | нет |  | вызывается с новым `{ from, to }` после каждого клика; пока выбрано только начало, `to` равно `null` |
| `toLabel` | `string` | нет | `'To'` | подпись поля конца, `To` по умолчанию |
| `value` | `JxDateRange` | нет |  | выбранный период `{ from, to }` в управляемом режиме |

## CSS-классы

`jx-cal-day`, `jx-cal-day--in-range`, `jx-cal-day--out`, `jx-cal-day--range-end`, `jx-cal-day--range-start`, `jx-cal-day--selected`, `jx-cal-day--today`, `jx-cal-dow`, `jx-cal-grid`, `jx-cal-head`, `jx-cal-month`, `jx-cal-nav`, `jx-calendar`, `jx-daterange`, `jx-daterange-arrow`, `jx-daterange-clear`, `jx-daterange-field`, `jx-daterange-field-label`, `jx-daterange-field-value`, `jx-daterange-fields`, `jx-daterange-status`

## Примеры

### Период отчёта

```tsx
function ReportPeriod() {
  const [range, setRange] = useState<JxDateRange>({ from: null, to: null });
  return <JxDateRangePicker locale="ru-RU" fromLabel="С" toLabel="По" value={range} onValueChange={setRange} />;
}
```

### Кнопка активна только при выбранном периоде

```tsx
function ReportRequest() {
  const [range, setRange] = useState<JxDateRange>({ from: null, to: null });
  return (
    <>
      <JxDateRangePicker value={range} onValueChange={setRange} />
      <JxButton variant="primary" disabled={!range.from || !range.to}>
        Построить отчёт
      </JxButton>
    </>
  );
}
```
