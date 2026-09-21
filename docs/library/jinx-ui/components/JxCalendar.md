---
component: JxCalendar
keywords: [календарь, calendar, дата, выбор даты, datepicker, период, месяц]
---
Календарь на один месяц с выбором одной даты. Значение — `Date` или `null`, управляемое через `value` и `onValueChange`. Диапазон подсвечивается через `rangeHover`, а подпись месяца форматируется `monthFormatter` или локалью.

## Props
- value: выбранная дата в управляемом режиме
- defaultValue: начальная дата
- onValueChange: вызывается с выбранной датой или `null`
- rangeHover: подсветка диапазона `{ from, to }`
- monthFormatter: функция форматирования подписи месяца и года
- locale: локаль для названий месяцев и дней недели, `en-US` по умолчанию

## Examples
### Выбор даты с русской локалью
```tsx
<JxCalendar locale="ru-RU" value={date} onValueChange={setDate} />
```
