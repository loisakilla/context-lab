# JxChip

Компактная метка-кнопка для фильтров и быстрого выбора. Может быть активной и удаляемой; клик обрабатывается через обычный `onClick`, так как компонент наследует атрибуты `<span>`.

Импорт: `import { JxChip } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Chip.tsx:11`
Ключевые слова: chip, чип, фильтр, быстрый выбор, период, удаляемая метка

## Сигнатура

```tsx
<JxChip active?: boolean = false; children?: ReactNode; onRemove?: () => void; removable?: boolean = false />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `active` | `boolean` | нет | `false` | выделить как выбранную |
| `children` | `ReactNode` | нет |  | текст метки |
| `onRemove` | `() => void` | нет |  | вызывается по крестику |
| `removable` | `boolean` | нет | `false` | показать крестик удаления |

## CSS-классы

`jx-chip`, `jx-chip--active`, `jx-chip-x`

## Примеры

### Быстрый выбор периода

```tsx
<div style={{ display: 'flex', gap: '8px' }}>
  {periods.map((period) => (
    <JxChip key={period.value} active={period.value === selected} onClick={() => setSelected(period.value)}>
      {period.label}
    </JxChip>
  ))}
</div>
```
