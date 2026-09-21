# JxToggle

Импорт: `import { JxToggle } from '@jinx-ui/react'`  
Источник: `packages/react/src/components/Toggle.tsx:19`

## Сигнатура

```tsx
<JxToggle items: JxToggleItem[]; defaultValue?: string; onValueChange?: (value: string) => void; value?: string />
```

Наследует `Omit<HTMLAttributes<HTMLDivElement>, "onChange">`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `items` | `JxToggleItem[]` | да |  |  |
| `defaultValue` | `string` | нет |  |  |
| `onValueChange` | `(value: string) => void` | нет |  |  |
| `value` | `string` | нет |  |  |

## CSS-классы

`jx-toggle-btn`, `jx-toggle-group`, `jx-toggle-indicator-bg`
