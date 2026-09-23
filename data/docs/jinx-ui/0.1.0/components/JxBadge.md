# JxBadge

Небольшая метка статуса или счётчика. Тон задаёт цвет из токенов, `dot` добавляет точку-индикатор перед текстом.

Импорт: `import { JxBadge } from '@jinx-ui/react'`  
Источник: `dist/components/Badge.d.ts:8`
Ключевые слова: badge, бейдж, статус, метка, счётчик, индикатор

## Сигнатура

```tsx
<JxBadge children?: ReactNode; dot?: boolean = false; tone?: JxBadgeTone = 'default' />
```

Наследует `HTMLAttributes<HTMLSpanElement>`: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.

## Пропсы

| Проп | Тип | Обязателен | По умолчанию | Описание |
|---|---|---|---|---|
| `children` | `ReactNode` | нет |  | текст метки |
| `dot` | `boolean` | нет | `false` | показать точку-индикатор |
| `tone` | `"danger" \\| "default" \\| "warning" \\| "info" \\| "success" \\| "accent" \\| "solid"` | нет | `'default'` | цветовой тон: `default`, `accent`, `success`, `warning`, `danger`, `info`, `solid` |

## CSS-классы

`jx-badge`, `jx-badge--accent`, `jx-badge--danger`, `jx-badge--dot`, `jx-badge--info`, `jx-badge--solid`, `jx-badge--success`, `jx-badge--warning`

## Примеры

### Статусы в таблице

```tsx
<JxBadge tone="success" dot>Активен</JxBadge>
<JxBadge tone="warning">Ожидает</JxBadge>
```
