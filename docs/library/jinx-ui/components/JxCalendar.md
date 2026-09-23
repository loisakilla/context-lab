---
component: JxCalendar
keywords: [календарь, calendar, дата, выбор даты, datepicker, период, месяц]
---
Календарь на один месяц с выбором одной даты. Значение — `Date` или `null`, управляемое через `value` и `onValueChange`. Диапазон подсвечивается через `rangeHover`, а подпись месяца форматируется `monthFormatter` или локалью. Чтобы пользователь сам выбирал период, берите `JxDateRangePicker`: `rangeHover` только показывает готовый диапазон.

С клавиатуры: стрелки ходят по дням и неделям, `Home` и `End` — к краям недели, `PageUp` и `PageDown` — по месяцам. Доступное имя каждого дня — полная дата, а не число.

## Props
- value: выбранная дата в управляемом режиме
- defaultValue: начальная дата
- onValueChange: вызывается с выбранной датой или `null`
- rangeHover: подсветка диапазона `{ from, to }`
- monthFormatter: функция форматирования подписи месяца и года
- locale: локаль для названия месяца и доступных имён дней, `en-US` по умолчанию; однобуквенные подписи дней недели не локализуются

## Examples
### Выбор даты с русской локалью
```tsx
function DueDate() {
  const [date, setDate] = useState<Date | null>(null);
  return <JxCalendar locale="ru-RU" value={date} onValueChange={setDate} />;
}
```
