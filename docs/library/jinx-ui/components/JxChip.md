---
component: JxChip
keywords: [chip, чип, фильтр, быстрый выбор, период, удаляемая метка]
---
Компактная метка-кнопка для фильтров и быстрого выбора. Может быть активной и удаляемой; клик обрабатывается через обычный `onClick`, так как компонент наследует атрибуты `<span>`.

## Props
- children: текст метки
- active: выделить как выбранную
- removable: показать крестик удаления
- onRemove: вызывается по крестику

## Examples
### Быстрый выбор периода
```tsx
const periods = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
];

function PeriodChips() {
  const [selected, setSelected] = useState('month');
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {periods.map((period) => (
        <JxChip key={period.value} active={period.value === selected} onClick={() => setSelected(period.value)}>
          {period.label}
        </JxChip>
      ))}
    </div>
  );
}
```
