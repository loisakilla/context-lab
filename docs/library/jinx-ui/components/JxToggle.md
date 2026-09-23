---
component: JxToggle
keywords: [toggle, переключатель, сегментированный контрол, режим, выбор одного]
---
Сегментированный переключатель на два-три коротких варианта: режим отображения, тема, период. Для большего числа вариантов берите `JxSelect`, для навигации между разделами — `JxTabs`.

## Props
- items: варианты переключателя, каждый со значением `value` и подписью `label`
- value: выбранное значение в управляемом режиме
- defaultValue: начальное значение в неуправляемом режиме
- onValueChange: вызывается при выборе варианта

## Examples
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
