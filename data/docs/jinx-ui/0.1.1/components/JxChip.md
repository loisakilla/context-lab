# JxChip

Компактная метка-кнопка для фильтров и быстрого выбора. Может быть активной и удаляемой; клик обрабатывается через обычный `onClick`, так как компонент наследует атрибуты `<span>`.

Импорт: `import { JxChip } from '@jinx-ui/react'`  
Источник: `dist/components/Chip.d.ts:9`
Ключевые слова: chip, чип, фильтр, быстрый выбор, период, удаляемая метка

## Сигнатура

```tsx
<JxChip active?: boolean = false; children?: ReactNode; onRemove?: () => void; ref?: Ref<HTMLSpanElement>; removable?: boolean = false />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `active` | `boolean` | нет | `false` | выделить как выбранную |
| `children` | `ReactNode` | нет |  | текст метки |
| `onRemove` | `() => void` | нет |  | вызывается по крестику |
| `ref` | `Ref<HTMLSpanElement>` | нет |  |  |
| `removable` | `boolean` | нет | `false` | показать крестик удаления |

## CSS-классы

`jx-chip`, `jx-chip--active`, `jx-chip-x`

## Примеры

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
