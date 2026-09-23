---
component: JxDateRangePicker
keywords: [диапазон дат, период, date range, от и до, с по, выбор периода, отпуск, бронирование, отчёт за период]
---
Выбор периода на календаре. Первый клик задаёт начало, второй — конец; если второй день раньше первого, границы меняются местами сами. Пока конец не выбран, наведение подсвечивает будущий промежуток. Значение — объект `{ from, to }`, где любая граница может быть `null`, управляемый через `value` и `onValueChange`. Над сеткой показаны обе даты и кнопка сброса, под сеткой — текстовый статус для скринридера.

Клавиатура общая с `JxCalendar`: стрелки ходят по дням и неделям, `Home` и `End` — к краям недели, `PageUp` и `PageDown` — по месяцам, фокус переходит через границу месяца. Названия дней недели не локализуются — `locale` влияет на месяц и на подписи дат.

## Props
- value: выбранный период `{ from, to }` в управляемом режиме
- defaultValue: начальный период
- onValueChange: вызывается с новым `{ from, to }` после каждого клика; пока выбрано только начало, `to` равно `null`
- monthFormatter: функция форматирования подписи месяца и года
- locale: локаль для названия месяца и подписей дат, `en-US` по умолчанию
- fromLabel: подпись поля начала, `From` по умолчанию
- toLabel: подпись поля конца, `To` по умолчанию

## Examples
### Период отчёта
```tsx
const [range, setRange] = useState<JxDateRange>({ from: null, to: null });

<JxDateRangePicker locale="ru-RU" fromLabel="С" toLabel="По" value={range} onValueChange={setRange} />
```

### Кнопка активна только при выбранном периоде
```tsx
<JxDateRangePicker value={range} onValueChange={setRange} />
<JxButton variant="primary" disabled={!range.from || !range.to}>Построить отчёт</JxButton>
```
